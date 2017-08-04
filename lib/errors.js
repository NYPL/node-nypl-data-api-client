// Thrown internally when response indicates OAUTH token expired:
class TokenExpirationError extends Error {
  constructor (message) {
    super()
    this.name = 'TokenExpirationError'
    this.message = message
  }
}

// Thrown externally when token refresh fails
class TokenRefreshError extends Error {
  constructor (message) {
    super()
    this.name = 'TokenRefreshError'
    this.message = message
  }
}
module.exports = { TokenExpirationError, TokenRefreshError }
