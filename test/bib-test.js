let client = null

describe('Bib test', function () {
  beforeEach(() => {
    client = require('./make-test-client')()
  })

  afterEach(() => {
    client = null
  })

  describe('Bibs endpoint', function () {
    it('should return a Bib', async () => {
      console.log('(inside test) Stubbed fetch? ', fetch, !!fetch.restore)

      const resp = await client.get('bibs/sierra-nypl/17746307', { authenticate: true })
      expect(resp.data).to.be.a('object')
      expect(resp.data).to.have.a.property('id', '17746307')
      expect(resp.data).to.have.a.property('nyplSource', 'sierra-nypl')
    })
  })
})
