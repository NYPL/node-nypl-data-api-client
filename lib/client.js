'use strict'

const request = require('request')
const NodeCache = require('node-cache')
const log = require('loglevel')
const OAuth = require('oauth')

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

    log.setLevel(this.options.log_level)
  }

  get (path, opts) {
    opts = opts || {}
    opts = Object.assign({
      cache: true,
      authenticate: true
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
        if (error) reject(error)
        else if (!body || !body.data) reject('Invalid response: for ' + url, body)
        else {
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
}

module.exports = Client
