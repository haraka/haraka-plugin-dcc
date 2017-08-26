
// node.js built-in modules
const assert   = require('assert');

// npm modules
const fixtures = require('haraka-test-fixtures');

beforeEach((done) => {
    this.plugin = new fixtures.plugin('dcc');
    done();  // if a test hangs, assure you called done()
});

describe('dcc', () => {
    it('loads', (done) => {
        assert.ok(this.plugin);
        done();
    });
});

describe('load_dcc_ini', () => {

    beforeEach((done) => {
        this.plugin = new fixtures.plugin('dcc');
        this.plugin.load_dcc_ini();
        done();
    });

    it('loads dcc.ini from config/dcc.ini', (done) => {
        assert.ok(this.plugin.cfg.main);
        done();
    });

    it('detects set path', (done) => {
        assert.equal(this.plugin.cfg.dccifd.path, '/var/dcc/dccifd', this.plugin.cfg);
        done();
    });
});

describe('get_host', () => {

    [ 'Unknown', 'NXDOMAIN', 'DNSERROR', undefined ].forEach((e) => {
        it(`returns undefined for ${e}`, (done) => {
            assert.equal(this.plugin.get_host(e), undefined);
            done();
        });
    });

    it('returns a hostname', (done) => {
        assert.equal(this.plugin.get_host('host'), 'host');
        done();
    });
});
