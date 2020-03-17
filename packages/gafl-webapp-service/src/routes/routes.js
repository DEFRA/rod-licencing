'use strict'

import name from '../pages/name/route.js'
import dateOfBirth from '../pages/date-of-birth/route.js'
import controller from './controller-route.js'
import staticAssets from '../handlers/static-handler.js'
import miscHandlers from './misc-routes.js'

const routes = [controller, ...name, ...dateOfBirth, ...staticAssets, ...miscHandlers]

export default routes
