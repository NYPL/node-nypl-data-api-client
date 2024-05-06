'use strict'

const NodeCache = require('node-cache')
const OAuth = require('oauth')

const {
  ConfigError,
  RequestError,
  ResponseError,
  TokenExpirationError,
  TokenRefreshError
} = require('./errors')

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
   *
   * Note that `oauth_url` is expected to be a *base* URL, from which authorization & token endpoints are derived internally. As such, the `oauth_url` should end in ".org/" in most cases.
   *
   * @typedef {Object} ClientConstructorOptions
   * @property {string} base_url - Base URL for API (e.g. 'https://[FQDN]/api/v0.1/').
   *    If missing, client will check process.env.NYPL_API_BASE_URL
   * @property {string} oauth_key - OAUTH key. (If missing, client will use
   *    process.env.NYPL_OAUTH_KEY)
   * @property {string} oauth_secret - OAUTH secret. (If missing, client will use
   *    process.env.NYPL_OAUTH_SECRET)
   * @property {string} oauth_url - OAUTH base URL. This is used to build token
   *    endpoints. Normally, should end in ".org/" (If missing, client will use
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
      log_level: process.env.LOG_LEVEL || 'error',
      base_url: process.env.NYPL_API_BASE_URL,
      oauth_key: process.env.NYPL_OAUTH_KEY,
      oauth_secret: process.env.NYPL_OAUTH_SECRET,
      oauth_url: process.env.NYPL_OAUTH_URL
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
   * PUT an object to an api endpoint
   *
   * @param {string} path - The path to fetch (e.g. 'current-schema/Item')
   * @param {Object} body - The object/string to pass with the request
   * @param {RequestOptions} options - A hash of options.
   *
   * @return {Promise} A promise that resolves the result data
   */
  put (path, body, options = {}) {
    options = Object.assign({
      body
    }, options)

    log.debug(`put("${path}", ${JSON.stringify(body)} (${typeof body}),  ${JSON.stringify(options)})`)
    return this._doHttpMethod('PUT', path, options)
  }

  /**
   * PATCH a resource at an api endpoint
   *
   * @param {string} path - The path to fetch (e.g. 'current-schema/Item')
   * @param {Object} body - The partial object to pass with the request
   * @param {RequestOptions} options - A hash of options.
   *
   * @return {Promise} A promise that resolves the result data
   */
  patch (path, body, options = {}) {
    options = Object.assign({
      body
    }, options)

    log.debug(`patch("${path}", ${JSON.stringify(body)} (${typeof body}),  ${JSON.stringify(options)})`)
    return this._doHttpMethod('PATCH', path, options)
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
   * Get accessToken
   *
   * @access private
   *
   * @return {Promise} A promise that resolves an accessToken
   */
  token () {
    if (this.accessToken) {
      log.debug('token(): Resolving cached token')
      return Promise.resolve(this.accessToken)
    }

    const OAuth2 = OAuth.OAuth2

    const key = this.options.oauth_key
    const secret = this.options.oauth_secret
    const url = this.options.oauth_url

    if (!key || !secret || !url) throw new ConfigError('OAUTH config not set. See https://github.com/NYPL-discovery/node-nypl-data-api-client#usage')

    const oauth2 = new OAuth2(key, secret, url, null, 'oauth/token', null)
    return new Promise((resolve, reject) => {
      log.debug('token(): Fetching token')
      oauth2.getOAuthAccessToken('', { grant_type: 'client_credentials' }, (e, accessToken, refreshToken, results) => {
        if (e) {
          log.error('token(): Failure getting token: ' + e.message)
          return reject(e)
        }

        this.accessToken = accessToken

        log.debug('token(): Resolving new token')

        resolve(this.accessToken)
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
    this.accessToken = null

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
  async _doHttpMethod (method, path, options) {
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
      throw new RequestError(`Attempted to ${method} with options.json==true, but body is a ${typeof options.body}`)
    }

    const uri = this._getFullUrl(path)
    const cacheKey = `${method} ${uri}`

    if (options.json) {
      // When json is enabled, add json headers (but allow override from options.headers)
      options.headers = Object.assign({
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }, options.headers)
    }

    let cached = null
    if (options.cache && (cached = this.cache.get(cacheKey))) {
      return cached
    } else {
      // Build request-specific options
      const requestOptions = {
        method,
        // Stringify JSON body:
        body: options.body && options.json ? JSON.stringify(options.body) : options.body,
        uri,
        headers: options.headers,
        token_expiration_retries: options.token_expiration_retries
      }

      const resp = options.authenticate
        ? await this._doAuthenticatedRequest(requestOptions)
        : await this._doRequest(requestOptions)

      let data = null
      // Protect against reading null bodies: (e.g. status 204)
      if (resp.body) {
        data = await options.json ? resp.json() : resp.text()
      }

      // Handle caching:
      if (options.cache) this.cache.set(cacheKey, data)

      return data
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

  async _doRequest (options) {
    options = options || {}
    options = Object.assign({
      json: true
    }, options)

    log.debug(`_doRequest(${JSON.stringify(options)})`)
    // Build `request` library specific options from given options:
    const requestOptions = {}
    if (options.headers) {
      requestOptions.headers = options.headers // Object.entriesoptions.headers.entries().([key, value]) => {
    }
    if (options.body) requestOptions.body = options.body
    if (options.method) requestOptions.method = options.method

    log.debug(`fetch("${options.uri}", ${JSON.stringify(requestOptions)})`)
    const resp = await fetch(options.uri, requestOptions)

    // Handle token expiration:
    if (resp.status === 401) {
      throw new TokenExpirationError('Detected token expiration fetching ' + options.uri)

    // Throw an error on error response?
    } else if (!resp.ok && options.throwForStatus) {
      throw new ResponseError(`Invalid response: for ${options.uri}: "${JSON.stringify(options.body)}"`)

    // Ok response:
    } else {
      return resp
    }
  }

  _getFullUrl (path) {
    const baseUrl = this.options.base_url || process.env.NYPL_API_BASE_URL
    if (!baseUrl) throw new ConfigError('NYPL api base url not set (may be set in config.base_url or ENV[NYPL_API_BASE_URL]')

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
      const retriesRemaining = options.token_expiration_retries
      if (retriesRemaining > 0) {
        log.debug('Expired OAUTH token detected, ' + options.token_expiration_retries + ' retries remaining')
        const newOptions = Object.assign({}, options, { token_expiration_retries: retriesRemaining - 1 })
        return this.refreshToken().then(() => newOptions)
      } else {
        throw new TokenRefreshError('Exhausted retries refreshing token')
      }
    } else throw error
  }
}

module.exports = Client
