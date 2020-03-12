'use strict'

import { createServer, init, server } from '../../../../src/server.js'
import CatboxMemory from '@hapi/catbox-memory'

createServer({
  cache: [
    {
      provider: {
        constructor: CatboxMemory
      }
    }
  ]
})

// Start application before running the test case
beforeAll(async done => {
  server.events.on('start', () => {
    done()
  })
  await init()
})

// Stop application after running the test case
afterAll(done => {
  server.events.on('stop', () => {
    done()
  })
  server.stop()
})

test('Should return success requesting the name page', async () => {
  const options = {
    method: 'GET',
    url: '/name'
  }
  const data = await server.inject(options)
  expect(data.statusCode).toBe(200)
})
