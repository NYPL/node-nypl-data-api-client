let client = null

describe('Schema test', function () {
  beforeEach(() => {
    client = require('./make-test-client')()
  })

  afterEach(() => {
    client = null
  })

  describe('Schema endpoint', function () {
    it('should return Item schema', async () => {
      const resp = await client.get('current-schemas/Item', { authenticate: false })

      expect(resp).to.be.a('object')
      expect(resp).to.have.property('data')
      expect(resp.data).to.be.a('object')
      expect(resp.data).to.have.property('stream', 'Item')
    })

    // This is the trivial test schema we'll create (and delete once supported)
    const testSchema = {
      name: 'TestSchema',
      type: 'record',
      fields: [
        {
          name: 'id',
          type: 'string'
        }
      ]
    }

    it('should accept a new schema via POST', async () => {
      const resp = await client.post(`schemas/${testSchema.name}`, testSchema)

      expect(resp).to.be.a('object')
      expect(resp).to.have.property('data')
      expect(resp.data).to.be.a('object')
      expect(resp.data).to.have.property('stream', 'TestSchema')
    })

    it('should delete the new schema via DELETE (tk)', async () => {
      const resp = await client.dangerouslyCallDelete(`schemas/${testSchema.name}`)
      expect(resp).to.be.a('object')
    })
  })
})
