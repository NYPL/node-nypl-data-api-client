const sinon = require('sinon')

let client = null
let httpRequestSpy = null

describe('Client cache', function () {
  beforeEach(() => {
    client = require('./make-test-client')()
    httpRequestSpy = sinon.spy(client, '_doRequest')
  })

  afterEach(() => {
    client = null
    httpRequestSpy = null
  })

  describe('when cache=false (default)', function () {
    it('should not cache things', async () => {
      // Call the same endpoint in rapid succession with caching disabled (default):
      const apiCall = () => client.get('bibs/sierra-nypl/17746307')

      await apiCall()
      await apiCall()

      // Confirm the client's private _doRequest method was called twice:
      expect(httpRequestSpy.callCount).to.equal(2)
    })
  })

  describe('when cache=true', function () {
    it('should cache things', async () => {
      // Call the same endpoint in rapid succession with caching ENABLED:
      const apiCall = () => client.get('bibs/sierra-nypl/17746307', { cache: true })

      await apiCall()
      await apiCall()

      // Confirm the client's private _doRequest method was called only once:
      expect(httpRequestSpy.callCount).to.equal(1)
    })
  })
})
