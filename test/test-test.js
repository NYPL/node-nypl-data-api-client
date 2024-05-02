const sinon = require('sinon')

describe.only('Travis debug test', function () {
  beforeEach(() => {
    sinon.stub(global, 'fetch').callsFake(() => Promise.resolve())
    console.log('Stubbed fetch? ', global.fetch, fetch, !!fetch.restore)
  })

  afterEach(() => {
    global.fetch.restore()
  })

  it('should show that fetch is stubbed', async () => {
    console.log('(inside test) Stubbed fetch? ', fetch, !!fetch.restore)
  })
})
