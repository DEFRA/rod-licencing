import { start, stop, server } from '../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The controller handler', () => {
  it('Return redirect on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy'
    })
    expect(data.statusCode).toBe(302)
  })
})
