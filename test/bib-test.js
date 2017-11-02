/* global describe it beforeEach afterEach */

const assert = require('assert')

let client = null

describe('Bib test', function () {
  beforeEach(() => {
    client = require('./make-test-client')()
  })

  afterEach(() => {
    client = null
  })

  describe('Bibs endpoint', function () {
    it('should return a Bib', function () {
      return client.get('bibs/sierra-nypl/17746307', { authenticate: true })
        .then((bib) => {
          assert(bib)
          assert.equal(bib.id, 17746307)
          assert.equal(bib.nyplSource, 'sierra-nypl')
        })
    })
  })
})
