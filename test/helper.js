const oauth = require('oauth')
const sinon = require('sinon')
const chai = require('chai')
const { fixtureForRequest } = require('./fixtures')

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

  // Fix for very weird Node 20.12.2 bug where you have to reference `fetch`
  // in some way before stubbing it or else the stub will not take. This is
  // not a bug in Node 20.11.1 nor in Node 22.1.0
  expect(fetch).to.be.a('function')

  _fetchSpy = sinon.stub(global, 'fetch').callsFake(fixtureForRequest)
})

afterEach(() => {
  oauth.OAuth2.prototype.getOAuthAccessToken.restore()
  _fetchSpy.restore()
})

module.exports = {
  fetchSpy: () => _fetchSpy
}
