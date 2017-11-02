const path = require('path')
const fs = require('fs')

function mockData (options) {
  // Build mock data paths like this:
  //   ./test/data/{encoded request uri}-{method}.json
  let apiPath = options.uri.replace(/^.*\/api\/v0.1\//, '')
  let testDataSubdir = encodeURIComponent(apiPath)
  let method = (options.method || 'GET').toLowerCase()
  let mockPath = './' + path.join('test/data/', `${testDataSubdir}-${method}`) + '.json'

  // Make sure mock file exists:
  if (!fs.existsSync(mockPath)) throw new Error('Mock doesn\'t exist: ' + mockPath)

  return JSON.parse(fs.readFileSync(mockPath))
}

function checkAuthenticationHeader (options) {
  let method = (options.method || 'GET').toLowerCase()
  let apiPath = options.uri.replace(/^.*\/api\/v0.1\//, '')

  // Mock whether or not authentication is required based on request URI & method:
  // Default to requiring auth:
  let requireAccessToken = true
  // Allow GETs on /current-schema without a token:
  if (/^(current-schemas)/.test(apiPath) && method === 'get') requireAccessToken = false

  // Identify access_token:
  let accessToken = ((options.headers || {})['Authorization'] || '').replace(/^Bearer /, '')

  // Emulate expired token:
  if (requireAccessToken && accessToken === 'fake-expired-token') throw new Error('Authentication required, but access token expired')

  // Emulate absent token:
  if (requireAccessToken && !accessToken) throw new Error('Authentication required, but no access token found')
}

module.exports = function (options, callback) {
  // First verify an access_token was provided if path requires authentication:
  try {
    checkAuthenticationHeader(options)
  } catch (e) {
    return callback(null, { statusCode: 401 })
  }

  // Fetch mock data from filesystem:
  let data = mockData(options)
  callback(null, { statusCode: 200 }, data)
}
