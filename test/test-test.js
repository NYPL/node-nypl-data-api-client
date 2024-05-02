const sinon = require('sinon')

const stubFetch = () => {
  sinon.stub(global, 'fetch').callsFake(() => Promise.resolve())
  console.log('Stubbed fetch? ', fetch, !!fetch.restore)
  console.log('Stubbed global.fetch? ', global.fetch, !!global.fetch.restore)
}

const doAssertions = () => {
  console.log('(inside test) Stubbed fetch? ', fetch, !!fetch.restore)
  expect(fetch.restore).to.be.a('function')
}

const restore = () => {
  if (global.fetch.restore) {
    global.fetch.restore()
  }
}

describe.only('Travis debug test', () => {
  describe('Failing in Travis', () => {
    beforeEach(() => {
      stubFetch()
    })

    afterEach(restore)

    it('should show that fetch is stubbed', doAssertions)
  })

  describe('Working everywhere', () => {
    beforeEach(() => {
      expect(fetch).to.be.a('function')

      stubFetch()
    })

    afterEach(restore)

    it('should show that fetch is stubbed', doAssertions)
  })
})
