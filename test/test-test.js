const sinon = require('sinon')

describe.only('Travis debug test', () => {
  beforeEach(() => {
    // console.log('Stubbing fetch:', fetch)
    expect(fetch).to.be.a('function')
    sinon.stub(global, 'fetch').callsFake(() => Promise.resolve())
    console.log('Stubbed fetch? ', fetch, !!fetch.restore)
    console.log('Stubbed global.fetch? ', global.fetch, !!global.fetch.restore)
  })

  afterEach(() => {
    global.fetch.restore()
  })

  it('should show that fetch is stubbed', async () => {
    console.log('(inside test) Stubbed fetch? ', fetch, !!fetch.restore)
  })
})
