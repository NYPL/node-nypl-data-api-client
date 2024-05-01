const oauth = require('oauth')
const sinon = require('sinon')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { fixtureForRequest } = require('./fixtures')

chai.use(chaiAsPromised)
global.expect = chai.expect

let _fetchSpy

beforeEach(() => {
  sinon.stub(oauth.OAuth2.prototype, 'getOAuthAccessToken').callsFake((code, params, callback) => {
    const error = null
    const accessToken = 'this-is-a-fake-access-token'
    const refreshToken = 'this-is-a-fake-refresh-token'
    const results = null
    callback(error, accessToken, refreshToken, results)
  })

  _fetchSpy = sinon.stub(global, 'fetch').callsFake(fixtureForRequest)
})

afterEach(() => {
  oauth.OAuth2.prototype.getOAuthAccessToken.restore()
  _fetchSpy.restore()
})

module.exports = {
  fetchSpy: () => _fetchSpy
}
