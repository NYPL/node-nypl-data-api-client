# NYPL Data API Client

Node module for interacting with the NYPL Platform API

## Installation

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
  try {
    const resp = await client.get('bibs/sierra-nypl/17746307')
    const bib = resp.data
    console.log('Got bib: ' + bib.title)
  } catch (e) => {
    console.error('Error authenticating or fetching bib: ', e)
  }
```

To get the "Item" stream schema, which doesn't require authentication:
```js
  const resp = await client.get('current-schemas/Item', { authenticate: false })
  const schema = resp.data
  // Now we can build an avro encoder by parsing the escaped "schema" prop:
  const avroType = require('avsc').parse(JSON.parse(schema.schema))
```

To get patron id `12345678` (note you must auth with an account that has the 'read:patron' role):
```js
  const resp = await client.get('patrons/12345678')
  const patron = resp.data
  if (!patron) throw new Error('Could not find patron')

  const pType = Object.keys(patron.fixedFields).map((key) => patron.fixedFields[key])
    .filter((fixed) => fixed.label === 'Patron Type')[0]
    .value
  var name = patron.names[0]
  var barcode = patron.barCodes[0]

  console.log('Patron:')
  console.log('  Name: ' + name)
  console.log('  Barcode: ' + barcode)
  console.log('  Patron Type: ' + pType)
```

To POST a new "TestSchema" schema:
```js
  const resp = await client.post('schemas/TestSchema', { name: "TestSchema", type: "record", fields: [ ... ] })
  if (resp.data.stream !== 'TestSchema') throw Error('Error creating schema...')
```

## CLI

A small CLI exists for common tasks.

Set up:

```
git clone git@github.com:NYPL/node-nypl-data-api-client.git
cd node-nypl-data-api-client
nvm use; npm i

cp .env-example .env
# Fill in missing details in .env
```

To fetch the first 25 bibs:

```js
./bin/nypl-data-api.js get bibs
```

To fetch a specific bib:

```js
./bin/nypl-data-api.js get bibs/sierra-nypl/11040445
```

To create a hold-request:

```js
./bin/nypl-data-api.js post hold-requests '{ "record": "1234", "patron": ... }'
```

To specify a different `.env`, use the `--envfile` param (e.g. `--envfile .env-qa`)

A special `schema` command is provided for updating schemas. To post a new schema, run the following to upload the content of the given jsonfile to `schemas/[name]`

```js
./bin/nypl-data-api.js schema post [name] [jsonfile]
```

## Contributing

1. Cut feature branchs from `main`
2. After review, merge to `main`
3. Bump version in `package.json` & note changes in `CHANGELOG.md`
4. `git tag -a v[version]`
5. `npm publish`

## Testing

```js
npm test
```
