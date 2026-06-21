// node.js built-in modules
const assert = require('node:assert')

// npm modules
const { beforeEach, describe, it } = require('node:test')
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
