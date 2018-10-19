'use strict'

const request = require('request')
const NodeCache = require('node-cache')
const OAuth = require('oauth')

const TokenExpirationError = require('./errors').TokenExpirationError
const TokenRefreshError = require('./errors').TokenRefreshError

// Set up logging with prefix "[nypl-data-api-client {LEVEL}]: ":
const loglevel = require('loglevel')
const logPrefix = require('loglevel-plugin-prefix')
logPrefix.apply(loglevel, {
  template: '[nypl-data-api-client %l]:',
  nameFormatter: function (name) { return name || 'global' }
})
const log = loglevel.getLogger('nypl-data-api-client')

class Client {

  /**
   * @typedef {Object} ClientConstructorOptions
   * @property {string} base_url - Base URL for API (e.g. 'https://[FQDN]/api/v0.1/').
   *    If missing, client will check process.env.NYPL_API_BASE_URL
   * @property {string} oauth_key - OAUTH key. (If missing, client will use
   *    process.env.NYPL_OAUTH_KEY)
   * @property {string} oauth_secret - OAUTH secret. (If missing, client will use
   *    process.env.NYPL_OAUTH_SECRET)
   * @property {string} oauth_url - OAUTH URL. (If missing, client will use
   *    process.env.NYPL_OAUTH_URL)
   * @property {string} log_level - Set [log level](https://github.com/pimterry/loglevel)
   *    (i.e. info, error, warn, debug). Default env.LOG_LEVEL or 'error'
   */

  /**
   * @constructs Client
   * @param {ClientConstructorOptions} options - A hash of options
   */
  constructor (opts) {
    opts = opts || {}
    this.options = Object.assign({
      log_level: process.env['LOG_LEVEL'] || 'error',
      base_url: process.env['NYPL_API_BASE_URL'],
      oauth_key: process.env['NYPL_OAUTH_KEY'],
      oauth_secret: process.env['NYPL_OAUTH_SECRET'],
      oauth_url: process.env['NYPL_OAUTH_URL']
    }, opts)

    this.cache = new NodeCache()

    if (this.options.log_level) log.setLevel(this.options.log_level)
  }

  /**
   * GET an api path
   *
   * @param {string} path - The path to fetch (e.g. 'current-schema/Item')
   * @param {RequestOptions} options - A hash of options.
   *
   * @return {Promise} A promise that resolves the fetched data
   */
  get (path, options) {
    options = Object.assign({
      cache: false
    }, options)

    return this._doHttpMethod('GET', path, options)
  }

  /**
   * POST an object to an api endpoint
   *
   * @param {string} path - The path to fetch (e.g. 'current-schema/Item')
   * @param {Object} body - The object/string to pass with the request
   * @param {RequestOptions} options - A hash of options.
   *
   * @return {Promise} A promise that resolves the result data
   */
  post (path, body, options = {}) {
    options = Object.assign({
      body
    }, options)

    log.debug(`post("${path}", ${JSON.stringify(body)} (${typeof body}),  ${JSON.stringify(options)})`)
    return this._doHttpMethod('POST', path, options)
  }

  /**
   * DELETE an object from an api endpoint
   *
   * @param {string} path - The path to fetch (e.g. 'current-schema/Item')
   * @param {Object} body - The object/string to pass with the request
   * @param {RequestOptions} options - A hash of options.
   *
   * @return {Promise} A promise that resolves the result data
   */
  dangerouslyCallDelete (path, body, options) {
    options = Object.assign({
      body
    }, options)

    return this._doHttpMethod('DELETE', path, options)
  }

  /**
   * Get access_token
   *
   * @access private
   *
   * @return {Promise} A promise that resolves an access_token
   */
  token () {
    if (this.access_token) {
      log.debug('token(): Resolving cached token')
      return Promise.resolve(this.access_token)
    }

    var OAuth2 = OAuth.OAuth2

    var key = this.options.oauth_key
    var secret = this.options.oauth_secret
    var url = this.options.oauth_url

    if (!key || !secret || !url) throw new Error('OAUTH config not set. See https://github.com/NYPL-discovery/node-nypl-data-api-client#usage')

    var oauth2 = new OAuth2(key, secret, url, null, 'oauth/token', null)

    return new Promise((resolve, reject) => {
      log.debug('token(): Fetching token')
      oauth2.getOAuthAccessToken('', { grant_type: 'client_credentials' }, (e, access_token, refresh_token, results) => {
        if (e) {
          log.error('token(): Failure getting token: ' + e.message)
          return reject(e)
        }

        this.access_token = access_token

        log.debug('token(): Resolving new token')

        resolve(this.access_token)
      })
    })
  }

  /**
   * Declares current token invalid, attempts token refresh
   *
   * @access private
   *
   * @return {Promise} A promise that resolves a new token
   */
  refreshToken () {
    this.access_token = null

    return this.token()
  }

  /**
   * @typedef {Object} RequestOptions
   * @property {boolean} authenticate - Whether or not to authenticate before performing request. Default `true`
   * @property {boolean} json - Indicates endpoint serves and consumes json.
   *    If set to true, `request` will add header "Content-type: application/json"
   *    as well as automatically parse response as json.
   * @property {boolean} cache - Whether or not to cache the result. Only allowed for GET requests. Default `false`
   * @property {Object} headers - Hash of headers to pass in the request. Default {}.
   * @property {integer} token_expiration_retries - Number of refresh attempts to make if token expired. Default 1
   */

  /**
   * Internal common http method executor
   *
   * All methods accept an optional options hash defined as follows:
   *
   * @param {string} method - HTTP verb to execute (e.g. GET, POST, DELETE)
   * @param {string} path - Request path to use - relative to api base url. e.g. 'current-schemas/Item'
   * @param {RequestOptions} optionsh - Hash of request options.
   *
   * @access private
   *
   * @returns {Promise} A promise that resolves the response data
   */
  _doHttpMethod (method, path, options) {
    options = Object.assign({
      cache: false,
      authenticate: true,
      json: true,
      headers: {}, // Note if options.json=true, `request` will add Content-type: application/json for free
      token_expiration_retries: 1 // Number of refresh attempts to make if token expired (1 should do it!)
    }, options)

    log.debug(`_doHttpMethod("${method}", "${path}", ${JSON.stringify(options)})`)
    // Disallow caching anything but GET:
    if (method !== 'GET') options.cache = false

    // Disallow non-object body if json enabled:
    if (options.json && options.body && (typeof options.body) !== 'object') {
      return Promise.reject(new Error(`Attempted to ${method} with options.json==true, but body is a ${typeof options.body}`))
    }

    var uri = this._getFullUrl(path)
    var cacheKey = `${method} ${uri}`

    var cached = null
    if (options.cache && (cached = this.cache.get(cacheKey))) {
      return Promise.resolve(cached)
    } else {
      var handleCache = (data) => {
        if (options.cache) this.cache.set(cacheKey, data)
        return data
      }

      // Build request-specific options
      let requestOptions = {
        method,
        body: options.body,
        uri,
        json: options.json,
        headers: options.headers,
        token_expiration_retries: options.token_expiration_retries
      }

      if (options.authenticate) {
        return this._doAuthenticatedRequest(requestOptions)
          .then(handleCache)
      } else {
        return this._doRequest(requestOptions)
          .then(handleCache)
      }
    }
  }
  /**
   * General purpose internal method for executing authenticated requests
   * If token invalid, will attempt to refresh token exactly
   * {options.token_expiration_retries} times (default 1)
   *
   * @access private
   */
  _doAuthenticatedRequest (options = {}) {
    // Get a fresh copy of options, initialized with a headers hash if missing:
    options = Object.assign({
      headers: {}
    }, options)

    log.debug(`_doAuthenticatedRequest(${JSON.stringify(options)})`)
    return this.token()
      .then((token) => {
        options.headers = Object.assign(options.headers, { Authorization: `Bearer ${token}` })
        return this._doRequest(options)
      })
      .catch((error) => {
        // Let `_refreshTokenIfExpired` check the error to determine whether
        // or not to attempt a token refresh and retry:
        return this._refreshTokenIfExpired(error, options)
          .then((newOptions) => this._doAuthenticatedRequest(newOptions))
      })
  }

  _doRequest (options) {
    options = options || {}
    options = Object.assign({
      json: true
    }, options)

    log.debug(`_doRequest(${JSON.stringify(options)})`)
    return new Promise((resolve, reject) => {
      // Build `request` library specific options from given options:
      var requestOptions = {
        uri: options.uri,
        json: options.json
      }
      if (options.headers) requestOptions.headers = options.headers
      if (options.body) requestOptions.body = options.body
      if (options.method) requestOptions.method = options.method

      log.debug(`request(${JSON.stringify(requestOptions)}, cb)`)
      request(requestOptions, (error, resp, body) => {
        // Handle low level, non-http error:
        if (error) reject(error)

        // Handle token expiration:
        else if (resp && resp.statusCode === 401) {
          reject(new TokenExpirationError('Detected token expiration fetching ' + options.uri))

        // Sanity check response, trigger error if empty:
        } else if (!body) {
          reject('Invalid response: for ' + options.uri + ': ' + JSON.stringify(body))

        // Response looks good; resolve it:
        } else {
          log.debug('GET: ' + requestOptions.uri + ': ', body)
          resolve(body)
        }
      })
    })
  }

  _getFullUrl (path) {
    var baseUrl = this.options.base_url || process.env['NYPL_API_BASE_URL']
    if (!baseUrl) throw new Error('NYPL api base url not set (may be set in config.base_url or ENV[NYPL_API_BASE_URL]')

    return baseUrl + path
  }

  /**
   *  Examines an error thrown by _doAuthenticatedRequest to either attempt token refresh or throw an error in defeat.
   *
   *  @access private
   *
   *  @return {Object} hash with updated options array suitable for sending into `_doAuthenticatedRequest`
   */
  _refreshTokenIfExpired (error, options) {
    if (error && error.name === 'TokenExpirationError') {
      let retriesRemaining = options.token_expiration_retries
      if (retriesRemaining > 0) {
        log.debug('Expired OAUTH token detected, ' + options.token_expiration_retries + ' retries remaining')
        let newOptions = Object.assign({}, options, { token_expiration_retries: retriesRemaining - 1 })
        return this.refreshToken().then(() => newOptions)
      } else {
        throw new TokenRefreshError('Exhausted retries refreshing token')
      }
    } else throw error
  }
}

module.exports = Client
