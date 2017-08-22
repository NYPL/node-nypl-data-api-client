# NYPL Data API Client

Helper lib for interacting with the (internal) NYPL Data API

## Installation

Install it via npm for use inside your project:

```js
npm i @nypl/nypl-data-api-client --save
```

## Usage

```js
const NyplClient = require('@nypl/nypl-data-api-client')
var client = new NyplClient({ base_url: 'http://example.com/api/v0.1/' })
```

Client options include:
 - **base_url**: Base URL for the api (e.g. 'http://example.com/api/v0.1/'). (Alternatively use NYPL_API_BASE_URL)
 - **oauth_key**: OAUTH key (Alternatively use NYPL_OAUTH_KEY)
 - **oauth_secret**: OAUTH secret (Alternatively use NYPL_OAUTH_SECRET)
 - **oauth_url**: OAUTH URL. (Alternatively use NYPL_OAUTH_URL)
 - **log_level**: Set [log level](https://github.com/pimterry/loglevel) (i.e. info, error, warn, debug). Default env.LOG_LEVEL or 'error'

Note that you must specify URL base for the api via `base_url` config (as above) or via `NYPL_API_BASE_URL` env variable. The value should include everything from the protocol to the version number in the path (as above).
.

### client.get (path, opts)

Returns a Promise that resolves content at `path` (e.g. 'current-schemas/Item')

Params:
 - **path**: String path to retrieve
 - **opts**: Optional options hash that may include:
   - **cache**: Boolean, default `true`. Controls whether or not response is cached (using default configuration of [node-cache](https://www.npmjs.com/package/node-cache)
   - **authenticate**: Boolean, default `true`. Controls whether or not to OAUTH first.
   - **token_expiration_retries**: Int, default 1. Controls how many times the client will attempt to fetch a new OAUTH token if cached token seems to have expired.

To authenticate and fetch a bib (all GETs authenticate first, by default):
```js
client.get('bibs/sierra-nypl/17746307').then((bib) => {
  console.log('Got bib: ' + bib.title)
}).catch((e) => console.error('Error authenticating or fetching bib: ', e))
```

To get the "Item" stream schema, which doesn't require authentication:
```js
client.get('current-schemas/Item', { authenticate: false }).then((schema) => {
  // Now we can build an avro encoder by parsing the escaped "schema" prop:
  var avroType = require('avsc').parse(JSON.parse(schema.schema))
})
```

To get patron id `12345678` (note you must auth with an account that has the 'read:patron' role):
```js
client.get('patrons/12345678').then((patron) => {
  if (!patron) console.error('Could not find patron')
  else {
    var pType = Object.keys(patron.fixedFields).map((key) => patron.fixedFields[key])
      .filter((fixed) => fixed.label === 'Patron Type')[0]
      .value
    var name = patron.names[0]
    var barcode = patron.barCodes[0]

    console.log('Patron:')
    console.log('  Name: ' + name)
    console.log('  Barcode: ' + barcode)
    console.log('  Patron Type: ' + pType)
  }
})
```


### client.post (path, data, headers)

Returns a Promise that resolves after submitting `data` to `path`

Params:
 - **path**: String path to retrieve
 - **data**: Object/data you want to POST to the endpoint
 - **headers**: Object representing headers to send to the endpoint. 
   By default, the `Authorization` and `Content-type: application/json` headers are added.

For example, to post a new "TestSchema" schema:
```js
client.post('schemas/TestSchema', '{ "name": "TestSchema", "type": "record", "fields": [ ... ] }')
  .then((resp) => {
    if (JSON.parse(resp).data.stream !== 'TestSchema') throw Error('Error creating schema...')
  })
```

## CLI

A small CLI exists for common tasks. Run the following for a list of commands:

```js
nypl-data-api
```

To get help with any command run:

```js
nypl-data-api help [command]
```

Note that the lib draws from the following environment variables, which you can place in `.env`:

 - NYPL_API_BASE_URL
 - NYPL_OAUTH_KEY
 - NYPL_OAUTH_SECRET
 - NYPL_OAUTH_URL

### Schema post

Run the following to upload the content of the given jsonfile to `schemas/[name]`

```js
nypl-data-api schema post [name] [jsonfile]
```

## Testing

1.  Pull this repository
1.  Copy `./.env.example` to `./.env` and plug in values
```js
npm test
```
