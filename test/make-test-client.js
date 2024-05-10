const Client = require('../lib/client')

const config = {
  base_url: 'fake-proto://fake-fqdn/api/v0.1/',
  oauth_key: 'fake-oauth-key',
  oauth_secret: 'fake-oauth-secret',
  oauth_url: 'fake-oauth-url',
  log_level: 'error'
}

module.exports = () => {
  return new Client(config)
}
