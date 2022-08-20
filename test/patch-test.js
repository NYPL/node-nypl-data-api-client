let client = null

describe('Client PATCH method', function () {
  beforeEach(() => {
    client = require('./make-test-client')()
  })

  afterEach(() => {
    client = null
  })

  // This is a common patch that the
  // [HoldRequestResultConsumer makes](https://github.com/NYPL/hold-request-result-consumer/blob/e7bd5b04afe25cf65ed2a5ce2de0576973e592cb/src/OAuthClient/HoldRequestClient.php#L123)
  // makes when it detects a hold-request has been fulfilled
  const holdRequestPatch = {
    success: true,
    processed: true
  }

  describe('when config.json=true (default)', function () {
    it('should accept a new schema object via PATCH and return an object', function () {
      return client.patch('hold-requests/1234', holdRequestPatch)
        .then((resp) => {
          expect(resp).to.be.a('object')
        })
    })

    it('should fail if supplied body is plaintext', function () {
      const call = client.patch('hold-requests/1234', JSON.stringify(holdRequestPatch))
      return expect(call).to.be.rejected
    })

    // A null/empty body should be accepted as valid if options.json===true
    it('should succeed if supplied body is empty', function () {
      const call = client.patch('hold-requests/1234')
      return expect(call).to.be.fulfilled
    })
  })

  describe('when config.json=false', function () {
    it('should accept a plaintext body and return plain text', function () {
      const call = client.patch('hold-requests/1234', JSON.stringify(holdRequestPatch), { json: false })
      return Promise.all([
        expect(call).to.be.fulfilled,
        expect(call).to.eventually.be.a('string')
      ])
    })

    it('should fail if supplied body is not plaintext', function () {
      const call = client.patch('hold-requests/1234', holdRequestPatch, { json: false })
      return expect(call).to.be.rejected
    })
  })
})
