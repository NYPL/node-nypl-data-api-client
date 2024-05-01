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

class ResponseError extends Error {
  constructor (message, response) {
    super()
    this.name = 'ResponseError'
    this.message = message
    this.response = response
  }
}

class RequestError extends Error {
  constructor (message) {
    super()
    this.name = 'RequestError'
    this.message = message
  }
}

class ConfigError extends Error {
  constructor (message) {
    super()
    this.name = 'ConfigError'
    this.message = message
  }
}

module.exports = {
  ConfigError,
  RequestError,
  ResponseError,
  TokenExpirationError,
  TokenRefreshError
}
