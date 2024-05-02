const sinon = require('sinon')
const { fixtureForRequest } = require('./fixtures')

let client = null

describe.only('Bib test', function () {
  beforeEach(() => {
    client = require('./make-test-client')()

    sinon.stub(global, 'fetch').callsFake(fixtureForRequest)
    console.log('Stubbed fetch? ', fetch, !!fetch.restore)
  })

  afterEach(() => {
    client = null
    global.fetch.restore()
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
