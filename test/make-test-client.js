const fs = require('fs')
const OAuth = require('oauth')
const sinon = require('sinon')

let Client = null
let config = { log_level: 'error' }

// If special online-testing flag given, run all tests using credentials in .env
if (process.env.USE_CREDENTIALS) {
  if (!fs.existsSync(process.env.USE_CREDENTIALS)) throw new Error('USE_CREDENTIALS={file} should identify credentials file to use')

  require('dotenv').config({ path: process.env.USE_CREDENTIALS })
  Client = require('../lib/client')

// Otherwise, run all tests offline with mocks:
} else {
  const proxyquire = require('proxyquire')
  Client = proxyquire('../lib/client', { request: require('./stubbed-request') })
  config = Object.assign({
    base_url: 'fake-proto://fake-fqdn/api/v0.1/',
    oauth_key: 'fake-oauth-key',
    oauth_secret: 'fake-oauth-secret',
    oauth_url: 'fake-oauth-url'
  }, config)

  before(() => {
    sinon.stub(OAuth.OAuth2.prototype, 'getOAuthAccessToken').callsFake((code, params, callback) => {
      const error = null
      const accessToken = 'this-is-a-fake-access-token'
      const refreshToken = 'this-is-a-fake-refresh-token'
      const results = null
      callback(error, accessToken, refreshToken, results)
    })
  })

  after(() => {
    OAuth.OAuth2.prototype.getOAuthAccessToken.restore()
  })
}

module.exports = () => {
  return new Client(config)
}
