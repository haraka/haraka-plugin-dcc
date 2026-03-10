// node.js built-in modules
const assert = require('assert')

// npm modules
const fixtures = require('haraka-test-fixtures')

beforeEach(() => {
  this.plugin = new fixtures.plugin('dcc')
})

describe('dcc', () => {
  it('loads', () => {
    assert.ok(this.plugin)
  })
})

describe('load_dcc_ini', () => {
  beforeEach(() => {
    this.plugin = new fixtures.plugin('dcc')
    this.plugin.load_dcc_ini()
  })

  it('loads dcc.ini from config/dcc.ini', () => {
    assert.ok(this.plugin.cfg.main)
  })

  it('detects set path', () => {
    assert.equal(
      this.plugin.cfg.dccifd.path,
      '/var/dcc/dccifd',
      this.plugin.cfg,
    )

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
