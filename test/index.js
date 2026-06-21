// node.js built-in modules
const assert = require('node:assert')
const net = require('node:net')

// npm modules
const { afterEach, beforeEach, describe, it } = require('node:test')
const { makePlugin, makeConnection } = require('haraka-test-fixtures')

beforeEach(() => {
  this.plugin = makePlugin('dcc', { register: false })
})

describe('dcc', () => {
  it('loads', () => {
    assert.ok(this.plugin)
  })
})

describe('load_dcc_ini', () => {
  beforeEach(() => {
    this.plugin = makePlugin('dcc', { register: false })
    this.plugin.load_dcc_ini()
  })

  it('loads dcc.ini from config/dcc.ini', () => {
    assert.ok(this.plugin.cfg.main)
  })

  it('ships with no connection target configured', () => {
    // a path default would mask host/port (the path branch always wins)
    assert.equal(this.plugin.cfg.dccifd.path, undefined)
  })
})

describe('set_connect_opts', () => {
  beforeEach(() => {
    this.plugin = makePlugin('dcc', { register: false })
    this.plugin.cfg = { dccifd: {} }
  })

  it('resolves a unix socket path', () => {
    this.plugin.cfg.dccifd = { path: '/var/dcc/dccifd' }
    this.plugin.set_connect_opts()
    assert.deepEqual(this.plugin.connect_opts, { path: '/var/dcc/dccifd' })
  })

  it('resolves host/port when no path is set', () => {
    this.plugin.cfg.dccifd = { host: '127.0.0.1', port: 1025 }
    this.plugin.set_connect_opts()
    assert.deepEqual(this.plugin.connect_opts, {
      host: '127.0.0.1',
      port: 1025,
    })
  })
})

describe('get_host', () => {
  ;['Unknown', 'NXDOMAIN', 'DNSERROR', undefined].forEach((e) => {
    it(`returns undefined for ${e}`, () => {
      assert.equal(this.plugin.get_host(e), undefined)
    })
  })

  it('returns a hostname', () => {
    assert.equal(this.plugin.get_host('host'), 'host')
  })
})

describe('register', () => {
  it('registers an explicit data_post hook', () => {
    this.plugin = makePlugin('dcc', { register: false })
    this.plugin.register()
    assert.ok(this.plugin.hooks.data_post.includes('dcc_data_post'))
  })
})

describe('parse_dcc', () => {
  beforeEach(() => {
    this.plugin = makePlugin('dcc', { register: false })
    this.connection = makeConnection({ withTxn: true })
  })

  it('parses result, disposition, and headers', () => {
    const parsed = this.plugin.parse_dcc(
      this.connection,
      'A\nA\n\nX-DCC-Foo: bar\n',
    )
    assert.equal(parsed.result, 'A')
    assert.equal(parsed.disposition, 'A')
    assert.deepEqual(parsed.headers, ['X-DCC-Foo: bar'])
  })

  it('adds DCC headers to the transaction', () => {
    this.plugin.parse_dcc(this.connection, 'A\nA\n\nX-DCC-Foo: bar\n')
    assert.match(this.connection.transaction.header.get('X-DCC-Foo'), /bar/)
  })

  it('returns null for a too-short response', () => {
    assert.equal(this.plugin.parse_dcc(this.connection, 'A'), null)
  })

  it('returns null when there is no transaction', () => {
    assert.equal(this.plugin.parse_dcc(makeConnection(), 'A\nA\n'), null)
  })
})

describe('handle_dcc', () => {
  beforeEach(() => {
    this.plugin = makePlugin('dcc', { register: false })
    this.connection = makeConnection({ withTxn: true })
  })

  it('annotates the transaction and returns CONT (no reject)', () => {
    const args = this.plugin.handle_dcc(
      this.connection,
      { result: 'R', disposition: 'R', headers: ['X-DCC-X: y'] },
      '',
    )
    assert.deepEqual(args, [])
    const r = this.connection.transaction.results.get('dcc')
    assert.equal(r.result, 'Reject')
    assert.equal(r.disposition, 'Reject')
    assert.equal(r.training, false)
  })

  it('records training mode', () => {
    this.plugin.handle_dcc(
      this.connection,
      { result: 'A', disposition: 'A', headers: [] },
      ' spam',
    )
    assert.equal(this.connection.transaction.results.get('dcc').training, true)
  })
})

describe('dcc_data_post', () => {
  let server

  const primeTxn = () =>
    new Promise((done) => {
      this.plugin = makePlugin('dcc')
      this.connection = makeConnection({ withTxn: true })
      const txn = this.connection.transaction
      txn.mail_from = { address: 'm@example.com' }
      txn.rcpt_to = [{ address: 'r@example.com' }]
      txn.message_stream.add_line('Subject: hi\r\n')
      txn.message_stream.add_line('\r\n')
      txn.message_stream.add_line('body\r\n')
      txn.message_stream.add_line_end(done)
    })

  const startDccifd = (reply) =>
    new Promise((resolve) => {
      server = net.createServer((s) => {
        s.on('data', () => {})
        s.on('end', () => s.end(reply))
      })
      server.listen(0, '127.0.0.1', () => resolve(server.address().port))
    })

  const run = () =>
    new Promise((resolve) =>
      this.plugin.dcc_data_post((...a) => resolve(a), this.connection),
    )

  afterEach((t, done) => {
    const s = server
    server = null
    if (s && s.listening) return s.close(done)
    done()
  })

  it('annotates the transaction from a dccifd response', async () => {
    await primeTxn()
    const port = await startDccifd('A\nA\n\nX-DCC-Test: yes\n')
    this.plugin.connect_opts = { host: '127.0.0.1', port }
    const args = await run()
    assert.deepEqual(args, [])
    const r = this.connection.transaction.results.get('dcc')
    assert.equal(r.result, 'Accept')
    assert.equal(r.disposition, 'Accept')
  })

  it('continues (CONT) on connection error', async () => {
    await primeTxn()
    this.plugin.connect_opts = { host: '127.0.0.1', port: 1 } // refused
    const args = await run()
    assert.deepEqual(args, [])
  })

  it('CONT immediately when there is no transaction', async () => {
    this.plugin = makePlugin('dcc')
    const connection = makeConnection() // no transaction
    const args = await new Promise((resolve) =>
      this.plugin.dcc_data_post((...a) => resolve(a), connection),
    )
    assert.deepEqual(args, [])
  })
})
