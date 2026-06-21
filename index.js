// dcc client
// http://www.dcc-servers.net/dcc/dcc-tree/dccifd.html

const net = require('node:net')

exports.register = function () {
  this.load_dcc_ini()
  // explicit hook (not magic hook_data_post) so the plugin can be inherited;
  // don't rename. guarded so inheritors don't re-register. haraka/Haraka#3604
  if (this.name === 'dcc') this.register_hook('data_post', 'dcc_data_post')
}

exports.load_dcc_ini = function () {
  this.cfg = this.config.get('dcc.ini', () => {
    this.load_dcc_ini()
  })
  this.set_connect_opts()
}

// Resolve the dccifd connection target once per (re)load, not per message: a
// unix socket `path`, else `host`/`port`. haraka/Haraka#3604
exports.set_connect_opts = function () {
  const c = this.cfg.dccifd ?? {}
  this.connect_opts = c.path ? { path: c.path } : { host: c.host, port: c.port }
}

exports.get_host = function (host) {
  switch (host) {
    case 'Unknown':
    case 'NXDOMAIN':
    case 'DNSERROR':
    case undefined:
      return undefined
    default:
      return host
  }
}

exports.should_train = function (txn) {
  if (txn.notes.training_mode && txn.notes.training_mode === 'spam')
    return ' spam'
  return ''
}

exports.human_result = function (code) {
  switch (code) {
    case 'A':
      return 'Accept'
    case 'G':
      return 'Greylist'
    case 'R':
      return 'Reject'
    case 'S':
      return 'Accept some'
    case 'T':
      return 'Temp fail'
  }
}

exports.get_result = function (c, result) {
  const plugin = this

  // Get result code
  switch (result) {
    case 'A':
    // Accept, fall through
    case 'G':
    // Greylist, fall through
    case 'R':
    // Reject, fall through
    case 'S':
    // Accept for some recipients, fall through
    case 'T':
      // Temporary failure
      break
    default:
      c.logerror(plugin, 'invalid result: ' + result)
      break
  }
  return result
}

exports.human_disposition = function (code) {
  switch (code) {
    case 'A':
      return 'Accept'
    case 'G':
      return 'Greylist/Discard'
    case 'R':
      return 'Reject'
  }
}

exports.get_disposition = function (c, disposition) {
  const plugin = this

  switch (disposition) {
    case 'A': // Deliver the message
    case 'G': // Discard the message during greylist embargo
    case 'R': // Discard the message as spam
      break
    default:
      c.logerror(plugin, 'invalid disposition: ' + disposition)
      break
  }

  return disposition
}

exports.get_request_headers = function (conn, training) {
  const txn = conn.transaction
  const host = this.get_host(conn.remote.host)

  const headers = [
    'header' + training,
    conn.remote.ip + (host ? '\r' + host : ''),
    conn.hello.host,
    txn.mail_from.address,
    txn.rcpt_to
      .map((rcpt) => {
        return rcpt.address
      })
      .join('\r'),
  ].join('\n')

  conn.logdebug(this, 'sending protocol headers: ' + headers)
  return headers + '\n\n'
}

exports.get_response_headers = function (c, rl) {
  // Read headers
  const headers = []
  for (let i = 0; i < rl.length; i++) {
    if (/^\s/.test(rl[i]) && headers.length) {
      // Continuation
      headers[headers.length - 1] += rl[i]
    } else {
      if (rl[i]) headers.push(rl[i])
    }
  }
  c.logdebug(this, 'found ' + headers.length + ' headers')

  for (let h = 0; h < headers.length; h++) {
    const header = headers[h].toString('utf8').trim()
    let match
    if ((match = /^([^: ]+):\s*((?:.|[\r\n])+)/.exec(header))) {
      c.transaction.add_header(match[1], match[2])
    } else {
      c.logerror(this, 'header did not match regexp: ' + header)
    }
  }

  return headers
}

exports.dcc_data_post = function (next, connection) {
  const plugin = this
  const txn = connection.transaction
  if (!txn) return next()

  // Fix-up rDNS for DCC
  const training = plugin.should_train(txn)
  let response = ''
  let client

  // Idempotent terminal handler: error and end can both fire, so guard next().
  // unpipe() before destroy() — see haraka/message-stream#22.
  let calledNext = false
  const nextOnce = (code, msg) => {
    if (txn?.message_stream) txn.message_stream.unpipe()
    if (client && !client.destroyed) client.destroy()
    if (calledNext) return
    calledNext = true
    return code ? next(code, msg) : next()
  }

  function onConnect() {
    // the transaction can vanish during the async connect; building headers
    // without it throws here, which would crash the worker (not caught by the
    // plugin runner). Bail to CONT instead.
    if (!connection.transaction) return nextOnce()
    connection.logdebug(plugin, 'connected to dcc')

    this.write(plugin.get_request_headers(connection, training), () => {
      connection.transaction.message_stream.pipe(client)
    })
  }

  client = net.createConnection(plugin.connect_opts, onConnect)

  client
    .on('error', function (err) {
      connection.logerror(plugin, err.message)
      nextOnce()
    })
    .on('data', function (chunk) {
      response += chunk.toString('utf8')
    })
    .on('end', function () {
      if (!connection.transaction) return nextOnce() // client gone
      const parsed = plugin.parse_dcc(connection, response)
      if (!parsed) {
        connection.logwarn(plugin, `invalid response: ${response}`)
        return nextOnce()
      }
      connection.logdebug(plugin, 'got response: ' + response)
      nextOnce(...plugin.handle_dcc(connection, parsed, training))
    })
}

// parse a raw dccifd response into { result, disposition, headers }
// reusable by inheriting plugins, see haraka/Haraka#3604
exports.parse_dcc = function (connection, raw) {
  if (!connection.transaction) return null
  const rl = String(raw).split('\n')
  if (rl.length < 2) return null
  const result = this.get_result(connection, rl.shift())
  const disposition = this.get_disposition(connection, rl.shift())
  const headers = this.get_response_headers(connection, rl)
  return { result, disposition, headers }
}

// annotate the transaction with a parsed DCC result. I/O-free, reusable by
// inheriting plugins, see haraka/Haraka#3604
exports.handle_dcc = function (connection, parsed, training) {
  if (!connection.transaction || !parsed) return []
  connection.transaction.results.add(this, {
    training: training ? true : false,
    result: this.human_result(parsed.result),
    disposition: this.human_disposition(parsed.disposition),
    headers: parsed.headers,
  })
  connection.loginfo(
    this,
    `training=${training ? 'Y' : 'N'} result=${parsed.result} ` +
      `disposition=${parsed.disposition} headers=${parsed.headers.length}`,
  )
  return []
}
