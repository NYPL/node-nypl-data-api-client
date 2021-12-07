# NYPL Data API Client

Helper lib for interacting with the (internal) NYPL Data API

## Installation

Install it via npm for use inside your project:

```js
npm i @nypl/nypl-data-api-client --save
```

## Usage

Initialize a client (see [ClientConstructorOptions](/usage.md#ClientConstructorOptions)):

```js
const NyplClient = require('@nypl/nypl-data-api-client')
var client = new NyplClient({ 
  base_url: 'http://[FQDN].com/api/v0.1/',
  oauth_key: 'oauth-key',
  oauth_secret 'top-secret-oauth-secret',
  oauth_url: 'https://[fqdn]/'
})
```

### Docs

See [usage.md](usage.md) for complete documentation of Client methods and use.

(Usage doc is generated via `./node_modules/.bin/jsdoc2md lib/client.js > usage.md`.)

### Examples

To authenticate and fetch a bib (all GETs authenticate first, by default):

```js
client.get('bibs/sierra-nypl/17746307').then((resp) => {
  let bib = resp.data
  console.log('Got bib: ' + bib.title)
}).catch((e) => console.error('Error authenticating or fetching bib: ', e))
```

To get the "Item" stream schema, which doesn't require authentication:
```js
client.get('current-schemas/Item', { authenticate: false }).then((resp) => {
  let schema = resp.data
  // Now we can build an avro encoder by parsing the escaped "schema" prop:
  var avroType = require('avsc').parse(JSON.parse(schema.schema))
})
```

To get patron id `12345678` (note you must auth with an account that has the 'read:patron' role):
```js
client.get('patrons/12345678').then((resp) => {
  let patron = resp.data
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

To POST a new "TestSchema" schema:
```js
client.post('schemas/TestSchema', { name: "TestSchema", type: "record", fields: [ ... ] })
  .then((resp) => {
    if (JSON.parse(resp).data.stream !== 'TestSchema') throw Error('Error creating schema...')
  })
```

## CLI

A small CLI exists for common tasks.

If installed globally (i.e. `npm i -g @nypl/nypl-data-api-client`), it can be run as follows:

```js
nypl-data-api
```

For local installs, it can be run via local `node_modules`:

```js
./node_modules/.bin/nypl-data-api
```

To get help with any command run:

```js
nypl-data-api help [command]
```

Note that the cli uses the following environment variables, read by default from `.env`:

 - NYPL_API_BASE_URL
 - NYPL_OAUTH_KEY
 - NYPL_OAUTH_SECRET
 - NYPL_OAUTH_URL

See `.env.example` for a sample `.env` file. To specify a different `.env`, use the `--envfile` param (e.g. `--envfile config/qa.env`)

### Schema post

Run the following to upload the content of the given jsonfile to `schemas/[name]`

```js
nypl-data-api schema post [name] [jsonfile]
```

## Contributing

1. Cut feature branch from `master`
2. After review, merge to `master`
3. Bump version in `package.json` & note changes in `CHANGELOG.md`
4. `git tag -a v[version]`
5. `npm publish`

## Testing

All tests work offline with `request` and `oauth` stubs:

```js
npm test
```

If you want to run the test suite against real infrastructure, you can do so as follows:

```js
USE_CREDENTIALS=[credentials file, e.g. '.env'] npm test
```
