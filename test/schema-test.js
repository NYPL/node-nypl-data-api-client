/* global describe it beforeEach afterEach */

const assert = require('assert')
var client = null

describe('Schema test', function () {
  beforeEach(() => {
    client = require('./make-test-client')()
  })

  afterEach(() => {
    client = null
  })

  describe('Schema endpoint', function () {
    it('should return Item schema', function () {
      return client.get('current-schemas/Item', { authenticate: false })
        .then((schema) => {
          assert(schema)
          assert.equal(schema.stream, 'Item')
        })
    })

    // This is the trivial test schema we'll create (and delete once supported)
    var testSchema = {
      name: 'TestSchema',
      type: 'record',
      fields: [
        {
          name: 'id',
          type: 'string'
        }
      ]
    }

    it('should accept a new schema via POST', function () {
      // return client.post(`schemas/${testSchema.name}`, JSON.stringify(testSchema))
      return client.post(`schemas/${testSchema.name}`, testSchema)
        .then((resp) => {
          assert(resp)

          assert(resp)
          assert(resp.stream, 'TestSchema')
        })
    })

    it('should delete the new schema via DELETE (tk)', function () {
      return client.dangerouslyCallDelete(`schemas/${testSchema.name}`)
        .then((resp) => {
          assert(resp)

          // TODO: Need to properly parse a successful DELETE response
          // Currently data api doesn't support this.
        })
    })
  })
})
