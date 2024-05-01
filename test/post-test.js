const { fetchSpy } = require('./helper')

let client = null

describe('Client POST method', function () {
  beforeEach(() => {
    client = require('./make-test-client')()
  })

  afterEach(() => {
    client = null
  })

  // This is the trivial test schema we'll create
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

  describe('when config.json=true (default)', () => {
    it('should accept a new schema object via POST and return an object', async () => {
      const resp = await client.post(`schemas/${testSchema.name}`, testSchema)
      expect(resp).to.be.a('object')

      // Check that this translates into the right `fetch` call
      expect(fetchSpy().callCount).to.eq(1)
      expect(fetchSpy().firstCall.args[0]).to.eq(
        'fake-proto://fake-fqdn/api/v0.1/schemas/TestSchema'
      )
      expect(fetchSpy().firstCall.args[1]).to.deep.equal({
        // Verify POSTed body is stringified:
        body: '{"name":"TestSchema","type":"record","fields":[{"name":"id","type":"string"}]}',
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer this-is-a-fake-access-token',
          'Content-Type': 'application/json'
        }
      })
    })

    it('should fail if supplied body is plaintext', () => {
      const call = client.post(`schemas/${testSchema.name}`, JSON.stringify(testSchema))
      return expect(call).to.be.rejectedWith('Attempted to POST with options.json==true, but body is a string')
    })

    // A null/empty body should be accepted as valid if options.json===true
    it('should succeed if supplied body is empty', () => {
      const call = client.post(`schemas/${testSchema.name}`)
      return expect(call).to.be.fulfilled
    })
  })

  describe('when config.json=false', () => {
    it('should accept a plaintext body and return plain text', () => {
      const call = client.post(`schemas/${testSchema.name}`, JSON.stringify(testSchema), { json: false })
      return expect(call).to.eventually.be.a('string')
    })
  })
})
