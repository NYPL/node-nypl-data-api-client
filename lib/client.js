'use strict'

const request = require('request')
const NodeCache = require('node-cache')
const log = require('loglevel').getLogger('nypl-data-api-client')
const OAuth = require('oauth')

const TokenExpirationError = require('./errors').TokenExpirationError
const TokenRefreshError = require('./errors').TokenRefreshError

class Client {

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

  get (path, opts) {
    opts = opts || {}
    opts = Object.assign({
      cache: true,
      authenticate: true,
      token_expiration_retries: 1 // Number of refresh attempts to make if token expired (1 should do it!)
    }, opts)

    var uri = this._getFullUrl(path)
    var cacheKey = `GET ${uri}`

    var cached = null
    if (opts.cache && (cached = this.cache.get(cacheKey))) {
      return Promise.resolve(cached)
    } else {
      var handleCache = (data) => {
        if (opts.cache) this.cache.set(cacheKey, data)
        return data
      }

      if (opts.authenticate) {
        return this.token()
          .then((token) => this._doGet(uri, { headers: { Authorization: `Bearer ${token}` } }))
          .catch((error) => {
            // Let `_refreshTokenIfExpired` check the error to determine whether
            // or not to attempt a token refresh and retry:
            return this._refreshTokenIfExpired(error, opts)
              .then((newOptions) => this.get(path, newOptions))
          })
          .then(handleCache)
      } else {
        return this._doGet(uri)
          .then(handleCache)
      }
    }
  }

  post (path, body) {
    return this.token().then((token) => {
      var headers = { Authorization: `Bearer ${token}` }
      var uri = this._getFullUrl(path)
      var options = { method: 'POST', headers, uri, body }

      log.info(`Posting to ${uri}`)
      return new Promise((resolve, reject) => {
        request(options, (err, response, body) => {
          if (err) reject(err)
          else resolve(body)
        })
      })
    })
  }

  dangerouslyCallDelete (path, body) {
    return this.token().then((token) => {
      var headers = { Authorization: `Bearer ${token}` }
      var uri = this._getFullUrl(path)
      var options = { method: 'DELETE', headers, uri, body }

      log.info(`DELETE ${uri}`)
      return new Promise((resolve, reject) => {
        request(options, (err, response, body) => {
          if (err) reject(err)
          else resolve(body)
        })
      })
    })
  }

  token () {
    if (this.access_token) return Promise.resolve(this.access_token)

    var OAuth2 = OAuth.OAuth2

    var key = this.options.oauth_key
    var secret = this.options.oauth_secret
    var url = this.options.oauth_url

    if (!key || !secret || !url) throw new Error('OAUTH config not set. See https://github.com/NYPL-discovery/node-nypl-data-api-client#usage')

    var oauth2 = new OAuth2(key, secret, url, null, 'oauth/token', null)

    return new Promise((resolve, reject) => {
      oauth2.getOAuthAccessToken('', { grant_type: 'client_credentials' }, (e, access_token, refresh_token, results) => {
        if (e) return reject(e)

        this.access_token = access_token
        resolve(this.access_token)
      })
    })
  }

  /**
   * Declares current token invalid, attempts token refresh
   *
   * @return {Promise} resoves a new token
   */
  refreshToken () {
    this.access_token = null

    return this.token()
  }

  _doGet (url, options) {
    options = options || {}
    options = Object.assign({
      json: true
    }, options)

    return new Promise((resolve, reject) => {
      var requestOptions = {
        uri: url,
        json: options.json
      }
      if (options.headers) requestOptions.headers = options.headers

      log.info('GET: ' + requestOptions.uri)
      request(requestOptions, (error, resp, body) => {
        // Handle low level, non-http error:
        if (error) reject(error)

        // Handle token expiration:
        else if (resp && resp.statusCode === 401) {
          reject(new TokenExpirationError('Detected token expiration fetching ' + url))

        // Sanity check response, trigger error if empty:
        } else if (!body || !body.data) {
          reject('Invalid response: for ' + url + ': ' + JSON.stringify(body))

        // Response looks good; resolve it:
        } else {
          log.debug('GET: ' + requestOptions.uri + ': ', body)
          var data = body.data
          resolve(data)
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
   *  Examines an error thrown by _doGet to either attempt token refresh or throw an error in defeat.
   *  TODO Presently only used by `get`. Should be integrated with `post` to resolve token expirations during POSTs
   *
   *  @return {Object} hash with updated options array suitable for sending into `get`
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
