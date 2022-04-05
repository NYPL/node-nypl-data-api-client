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
    it('should trigger token refresh', function () {
      // Do something that triggers token fetch:
      return client.get('bibs?limit=1&offset=0', { authenticate: true })
        .then((res) => {
          expect(res).to.be.a('object')

          // Emulate token expiration by making setting it to this known "expired" token value:
          client.accessToken = 'fake-expired-token'
          return client.get('bibs?limit=1&offset=1', { authenticate: true }).then((res) => {
            expect(res).to.be.a('object')
          })
        })
    })

    it('should attempt to refresh token only N times after first failure', function () {
      // Do something that triggers token fetch:
      return client.get('bibs?limit=1&offset=0', { authenticate: true })
        .then((res) => {
          // This one should succeed because we haven't monkeyed with the token yet:
          expect(res).to.be.a('object')

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
          return client.get('bibs?limit=1&offset=1', { authenticate: true, token_expiration_retries: 3 }).then((res) => {
            throw new Error('Expected failure due to hijacked refreshToken, but it seems to have resolved.')
            // Arriving here is a failure because we passed an invalid token
          }).catch((error) => {
            // When client exhauses retries, this error is thrown:
            expect(error).to.be.a('error')
            expect(error).to.have.a.property('name', 'TokenRefreshError')
            // Confirm it retried exactly options.token_expiration_retries times:
            expect(refreshCalled).to.equal(3)
          })
        })
    })
  })
})
