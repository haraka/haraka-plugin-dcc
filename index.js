// dcc client
// http://www.dcc-servers.net/dcc/dcc-tree/dccifd.html

const net = require('net');

exports.register = function () {
    this.load_dcc_ini();
}

exports.load_dcc_ini = function () {
    const plugin = this;
    plugin.cfg = plugin.config.get('dcc.ini', () => {
        plugin.load_dcc_ini();
    });
}

exports.get_host = function (host) {
    switch (host) {
        case 'Unknown':
        case 'NXDOMAIN':
        case 'DNSERROR':
        case undefined:
            return undefined;
        default:
            return host;
    }
}

exports.should_train = function (txn) {
    if (txn.notes.training_mode && txn.notes.training_mode === 'spam')
        return ' spam';
    return '';
}

exports.human_result = function (code) {
    switch (code) {
        case 'A': return 'Accept';
        case 'G': return 'Greylist';
        case 'R': return 'Reject';
        case 'S': return 'Accept some';
        case 'T': return 'Temp fail';
    }
}

exports.get_result = function (c, result) {
    const plugin = this;

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
            break;
        default:
            c.logerror(plugin, 'invalid result: ' + result);
            break;
    }
    return result;
}

exports.human_disposition = function (code) {
    switch (code) {
        case 'A': return 'Accept';
        case 'G': return 'Greylist/Discard';
        case 'R': return 'Reject';
    }
}

exports.get_disposition = function (c, disposition) {
    const plugin = this;

    switch (disposition) {
        case 'A':    // Deliver the message
        case 'G':    // Discard the message during greylist embargo
        case 'R':    // Discard the message as spam
            break;
        default:
            c.logerror(plugin, 'invalid disposition: ' + disposition);
            break;
    }

    return disposition;
}

exports.get_request_headers = function (conn, training) {
    const plugin = this;
    const txn = conn.transaction;
    const host  = plugin.get_host(conn.remote.host);

    const headers = [
        'header' + training,
        conn.remote.ip + ((host) ? '\r' + host : ''),
        conn.hello.host,
        txn.mail_from.address(),
        txn.rcpt_to.map((rcpt) => { return rcpt.address(); }).join('\r'),
    ].join('\n');

    conn.logdebug(plugin, 'sending protocol headers: ' + headers);
    return headers + '\n\n';
}

exports.get_response_headers = function (c, rl) {
    // Read headers
    const headers = [];
    for (let i=0; i<rl.length; i++) {
        if (/^\s/.test(rl[i]) && headers.length) {
            // Continuation
            headers[headers.length-1] += rl[i];
        }
        else {
            if (rl[i]) headers.push(rl[i]);
        }
    }
    c.logdebug(this, 'found ' + headers.length + ' headers');

    for (let h=0; h<headers.length; h++) {
        const header = headers[h].toString('utf8').trim();
        let match;
        if ((match = /^([^: ]+):\s*((?:.|[\r\n])+)/.exec(header))) {
            c.transaction.add_header(match[1], match[2]);
        }
        else {
            c.logerror(this, 'header did not match regexp: ' + header);
        }
    }

    return headers;
}

exports.hook_data_post = function (next, connection) {
    const plugin = this;

    // Fix-up rDNS for DCC
    const training = plugin.should_train(connection.transaction);
    let response = '';
    let client;

    function onConnect () {
        connection.logdebug(plugin, 'connected to dcc');

        this.write(plugin.get_request_headers(connection, training) , () => {
            connection.transaction.message_stream.pipe(client);
        });
    }

    const c = plugin.cfg.dccifd;
    if (c.path) {
        client = net.createConnection(c.path, onConnect);
    }
    else {
        client = net.createConnection(c.port, c.host, onConnect);
    }

    client
        .on('error', function (err) {
            connection.logerror(plugin, err.message);
            return next();
        })
        .on('data', function (chunk) {
            response += chunk.toString('utf8');
        })
        .on('end', function () {
            const rl = response.split("\n");
            if (rl.length < 2) {
                connection.logwarn(plugin, 'invalid response: ' + response + 'length=' + rl.length);
                return next();
            }
            connection.logdebug(plugin, 'got response: ' + response);

            const result      = plugin.get_result(connection, rl.shift());
            const disposition = plugin.get_disposition(connection, rl.shift());
            const headers     = plugin.get_response_headers(connection, rl);

            connection.transaction.results.add(plugin, {
                'training': (training ? true : false),
                'result': plugin.human_result(result),
                'disposition': plugin.human_disposition(disposition),
                headers,
            });

            connection.loginfo(plugin, 'training=' + (training ? 'Y' : 'N') +
                   ` result=${result} disposition=${disposition} headers=${headers.length}`);

            return next();
        });
}
