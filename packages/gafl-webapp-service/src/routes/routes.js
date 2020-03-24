'use strict'

import licenceLength from '../pages/licence-length/route.js'
import licenceType from '../pages/licence-type/route.js'
import numberOfRods from '../pages/number-of-rods/route.js'
import licenceToStart from '../pages/licence-to-start/route.js'

import summary from '../pages/summary/route.js'

import name from '../pages/name/route.js'
import dateOfBirth from '../pages/date-of-birth/route.js'
import noLicenceRequired from '../pages/no-licence-required/route.js'

import controller from './controller-route.js'
import newTransactionRoute from './new-transaction-route.js'
import addPermissionRoute from './add-permission-route.js'
import staticAssets from './static-routes.js'
import miscRoutes from './misc-routes.js'

const routes = [
  controller,
  newTransactionRoute,
  addPermissionRoute,
  ...staticAssets,
  ...miscRoutes,
  ...licenceLength,
  ...licenceType,
  ...numberOfRods,
  ...licenceToStart,
  ...name,
  ...summary,
  ...dateOfBirth,
  ...noLicenceRequired
]

export default routes
