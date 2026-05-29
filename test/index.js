// node.js built-in modules
const assert = require('node:assert')

// npm modules
const { beforeEach, describe, it } = require('node:test')
const { makePlugin } = require('haraka-test-fixtures')

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
