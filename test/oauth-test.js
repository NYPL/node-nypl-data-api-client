/* global describe it */

const assert = require('assert')
const Client = require('../index')

describe('OAUTH', function () {
  this.timeout(10000)

  describe('token expiration', function () {
    it('should trigger token refresh', function () {
      var client = new Client()

      // Do something that triggers token fetch:
      return client.get('bibs?limit=1&offset=0', { authenticate: true })
        .then((res) => {
          assert(res)

          // Emulate token expiration by making it invalid:
          client.access_token = 'gobbledeesplat'
          return client.get('bibs?limit=1&offset=1', { authenticate: true }).then((res) => {
            assert(res)
          })
        })
    })

    it('should attempt to refresh token only N times after first failure', function () {
      var client = new Client()

      // Do something that triggers token fetch:
      return client.get('bibs?limit=1&offset=0', { authenticate: true })
        .then((res) => {
          // This one should succeed because we haven't monkeyed with the token yet:
          assert(res)

          // Emulate token expiration by making it invalid:
          client.access_token = 'gobbledeesplat'

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
            // Arriving here is a failure because we passed an invalid token
            assert(false)
          }).catch((error) => {
            // When client exhauses retries, this error is thrown:
            assert.equal(error.name, 'TokenRefreshError')
            // Confirm it retried exactly options.token_expiration_retries times:
            assert.equal(refreshCalled, 3)
          })
        })
    })
  })
})
