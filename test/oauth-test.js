let client = null

describe('OAUTH', function () {
  this.timeout(10000)
  beforeEach(() => {
    client = require('./make-test-client')()
  })

  afterEach(() => {
    client = null
  })

  describe('token expiration', function () {
    it('should trigger token refresh', async () => {
      // Do something that triggers token fetch:
      const resp = await client.get('bibs?limit=1&offset=0', { authenticate: true })

      expect(resp).to.be.a('object')

      // Emulate token expiration by making setting it to this known "expired" token value:
      client.accessToken = 'fake-expired-token'

      const resp2 = await client.get('bibs?limit=1&offset=1', { authenticate: true })
      expect(resp2).to.be.a('object')
    })

    it('should attempt to refresh token only N times after first failure', async () => {
      // Do something that triggers token fetch:
      const resp = await client.get('bibs?limit=1&offset=0', { authenticate: true })

      // This one should succeed because we haven't monkeyed with the token yet:
      expect(resp).to.be.a('object')

      // Emulate token expiration by making setting it to this known "expired" token value:
      client.accessToken = 'fake-expired-token'

      // Emulate repeated token refresh failure by hijacking refreshToken:
      let refreshCalled = 0
      client.refreshToken = () => {
        // Count the number of times the client attempts to refresh the token IN VAIN
        refreshCalled += 1
        return Promise.resolve()
      }

      // We'll let it attempt to refresh the token 3 times in sequence
      // Each time it will fail because we've replaced the refreshToken method with utter nonsense
      try {
        await client.get('bibs?limit=1&offset=1', { authenticate: true, token_expiration_retries: 3 })
        // Arriving here is a failure because we passed an invalid token
        throw new Error('Expected failure due to hijacked refreshToken, but it seems to have resolved.')
      } catch (error) {
        // When client exhauses retries, this error is thrown:
        expect(error).to.be.a('error')
        expect(error).to.have.a.property('name', 'TokenRefreshError')
        // Confirm it retried exactly options.token_expiration_retries times:
        expect(refreshCalled).to.equal(3)
      }
    })
  })
})
