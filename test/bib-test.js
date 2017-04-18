/* global describe it */

const assert = require('assert')
const Client = require('../index')

describe('Bib test', function () {
  this.timeout(10000)

  describe('Bibs endpoint', function () {
    it('should return a Bib', function () {
      var client = new Client()
      return client.get('bibs/sierra-nypl/17746307', { authenticate: true })
        .then((bib) => {
          assert(bib)
          assert.equal(bib.id, 17746307)
          assert.equal(bib.nyplSource, 'sierra-nypl')
        })
    })
  })
})
