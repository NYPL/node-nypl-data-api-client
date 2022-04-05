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
    it('should not cache things', function () {
      // Call the same endpoint in rapid succession with caching disabled (default):
      const apiCall = () => client.get('bibs/sierra-nypl/17746307')
      return apiCall()
        .then(apiCall)
        .then(() => {
          // Confirm the client's private _doRequest method was called twice:
          expect(httpRequestSpy.callCount).to.equal(2)
        })
    })
  })

  describe('when cache=true', function () {
    it('should cache things', function () {
      // Call the same endpoint in rapid succession with caching ENABLED:
      const apiCall = () => client.get('bibs/sierra-nypl/17746307', { cache: true })
      return Promise.all(new Array(3).fill(apiCall()))
        .then((responses) => {
          // Confirm the client's private _doRequest method was called only once:
          expect(httpRequestSpy.callCount).to.equal(1)

          // Check structure of responses:
          expect(responses).to.be.a('array')
          expect(responses).to.have.lengthOf(3)
          responses.forEach((response) => {
            expect(response).to.be.a('object')
            expect(response.data).to.be.a('object')
            expect(response.data.id).to.be.eq('17746307')
          })
        })
    })
  })
})
