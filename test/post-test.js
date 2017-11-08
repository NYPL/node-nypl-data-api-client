var client = null

describe('Client POST method', function () {
  beforeEach(() => {
    client = require('./make-test-client')()
  })

  afterEach(() => {
    client = null
  })

  // This is the trivial test schema we'll create
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

  describe('when config.json=true (default)', function () {
    it('should accept a new schema object via POST and return an object', function () {
      return client.post(`schemas/${testSchema.name}`, testSchema)
        .then((resp) => {
          expect(resp).to.be.a('object')
        })
    })
  })

  describe('when config.json=false', function () {
    it('should accept a plaintext body and return plain text', function () {
      let call = client.post(`schemas/${testSchema.name}`, JSON.stringify(testSchema), { json: false })
      return Promise.all([
        expect(call).to.be.fulfilled,
        expect(call).to.eventually.be.a('string')
      ])
    })

    it('should fail if supplied body is not plaintext', function () {
      let call = client.post(`schemas/${testSchema.name}`, testSchema, { json: false })
      return expect(call).to.be.rejected
    })
  })
})
