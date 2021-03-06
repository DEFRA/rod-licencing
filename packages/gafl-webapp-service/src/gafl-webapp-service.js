import { createServer, init, shutdownBehavior } from './server.js'
import { PORT_DEFAULT } from './constants.js'

/**
 * Create and start the web-server (once)
 */
createServer({ port: process.env.PORT || PORT_DEFAULT })
init()
  .then(shutdownBehavior)
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
