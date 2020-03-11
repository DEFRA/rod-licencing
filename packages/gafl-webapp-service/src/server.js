'use strict'

/**
 * The hapi
 */

import Hapi from '@hapi/hapi'
import CatboxRedis from '@hapi/catbox-redis'
import Vision from '@hapi/vision'
import Nunjucks from 'nunjucks'
import glob from 'glob'
import routes from './routes.js'

const views = glob.sync('./src/pages/*/')

let server = null

const createServer = options => {
  server = Hapi.server(Object.assign({
    port: 3000,
    host: 'localhost',
    cache: [
      {
        name: 'hapi-cache',
        provider: {
          constructor: CatboxRedis
        }
      }
    ]
  }, options))
}

const init = async () => {
  if (!server) {
    throw new Error('No server created')
  }

  await server.register(Vision)

  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment)
          return (context) => {
            return template.render(context)
          }
        }
      }
    },
    path: views
  })

  process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
  })

  await server.start()
  console.log('Server running on %s', server.info.uri)

  server.route(routes)
}

export { createServer, server, init }
