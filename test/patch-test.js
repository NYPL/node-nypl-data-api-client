const { rejects } = require('node:assert/strict')
const { fetchSpy } = require('./helper')

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
    it('should accept a new schema object via PATCH and return an object', async () => {
      const resp = await client.patch('hold-requests/1234', holdRequestPatch)
      expect(resp).to.be.a('object')

      // Check that this translates into the right `fetch` call
      expect(fetchSpy().callCount).to.eq(1)
      expect(fetchSpy().firstCall.args[0]).to.eq(
        'fake-proto://fake-fqdn/api/v0.1/hold-requests/1234'
      )
      expect(fetchSpy().firstCall.args[1]).to.deep.equal({
        // Verify PATCHed body is stringified:
        body: '{"success":true,"processed":true}',
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer this-is-a-fake-access-token',
          'Content-Type': 'application/json'
        }
      })
    })

    it('should fail if supplied body is plaintext', async () => {
      const call = client.patch('hold-requests/1234', JSON.stringify(holdRequestPatch))
      return rejects(call, {
        name: 'RequestError',
        message: 'Attempted to PATCH with options.json==true, but body is a string'
      })
    })

    // A null/empty body should be accepted as valid if options.json===true
    it('should succeed if supplied body is empty', async () => {
      const call = await client.patch('hold-requests/1234')
      expect(call).to.be.a('object')
    })
  })

  describe('when config.json=false', () => {
    it('should accept a plaintext body and return plain text', async () => {
      const res = await client.patch('hold-requests/1234', JSON.stringify(holdRequestPatch), { json: false })
      await expect(res).be.a('string')
    })
  })
})
