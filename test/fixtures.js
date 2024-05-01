const path = require('path')
const fs = require('fs')

/**
* Given the arguments for a node:fetch invocation, returns the local fixture data
**/
const mockData = (url, options) => {
  // Build mock data paths like this:
  //   ./test/data/{encoded request uri}-{method}.json
  const apiPath = url.replace(/^.*\/api\/v0.1\//, '')
  const testDataSubdir = encodeURIComponent(apiPath)
  const method = (options.method || 'GET').toLowerCase()
  const mockPath = './' + path.join('test/data/', `${testDataSubdir}-${method}`) + '.json'

  // Make sure mock file exists:
  if (!fs.existsSync(mockPath)) throw new Error('Mock doesn\'t exist: ' + mockPath)

  return fs.readFileSync(mockPath, 'utf8')
}

/**
* Given the options passed to node:fetch, throws an error if the headers
* represent various token issues
*/
const checkAuthenticationHeader = (options) => {
  // Identify access_token:
  const accessToken = ((options.headers || {}).Authorization || '').replace(/^Bearer /, '')

  // Emulate expired token:
  if (accessToken === 'fake-expired-token') throw new Error('Authentication required, but access token expired')

  // Emulate absent token:
  if (!accessToken) throw new Error('Authentication required, but no access token found')
}

module.exports.fixtureForRequest = async (url, options) => {
  // First verify an access_token was provided if path requires authentication.
  // (current-schemas path is a known public endpoint)
  if (!/api\/v0.1\/current-schemas/.test(url)) {
    try {
      await checkAuthenticationHeader(options)
    } catch (e) {
      return { status: 401 }
    }
  }

  // Fetch mock data from filesystem:
  const data = mockData(url, options)

  // Mock special `json=[true/false]` request config param
  if (options.json === false) {
    // Throw error if body is an object:
    // if (options.body && (typeof options.body) === 'object') return callback(new Error('request invocation error: with json=false, payload can not be object'))

    // Emulate plaintext response by to-stringing mock data:
    // data = (typeof data) === 'object' ? JSON.stringify(data) : String(data)
  }

  return {
    status: 200,
    body: data,
    text: () => Promise.resolve(data),
    json: () => Promise.resolve(JSON.parse(data))
  }
}
