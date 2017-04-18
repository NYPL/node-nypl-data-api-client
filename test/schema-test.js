/* global describe it */

const assert = require('assert')
const Client = require('../index')

describe('Schema test', function () {
  this.timeout(10000)

  describe('Schema endpoint', function () {
    it('should return Item schema', function () {
      var client = new Client()
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
      var client = new Client()
      return client.post(`schemas/${testSchema.name}`, JSON.stringify(testSchema))
        .then((resp) => {
          assert(resp)

          resp = JSON.parse(resp)
          assert(resp)
          assert(resp.data)
          assert(resp.data.stream, 'TestSchema')
        })
    })

    it('should delete the new schema via DELETE (tk)', function () {
      var client = new Client()
      return client.dangerouslyCallDelete(`schemas/${testSchema.name}`)
        .then((resp) => {
          assert(resp)

          // TODO: Need to properly parse a successful DELETE response
          // Currently data api doesn't support this.
        })
    })
  })
})
