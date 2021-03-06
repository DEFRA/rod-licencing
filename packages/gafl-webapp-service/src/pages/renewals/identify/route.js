import { IDENTIFY, AUTHENTICATE } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import Boom from '@hapi/boom'

const getData = async request => {
  // If we are supplied a permission number, validate it or throw 400
  const permission = await request.cache().helpers.status.getCurrentPermission()

  if (permission.referenceNumber) {
    const validatePermissionNumber = validation.permission
      .permissionNumberUniqueComponentValidator(Joi)
      .validate(permission.referenceNumber)
    if (validatePermissionNumber.error) {
      throw Boom.forbidden('Attempt to access the authentication page with an invalid permission number')
    }
  }

  return { referenceNumber: permission.referenceNumber }
}

const schema = Joi.object({
  referenceNumber: validation.permission.permissionNumberUniqueComponentValidator(Joi),
  'date-of-birth': validation.contact.createBirthDateValidator(Joi),
  postcode: validation.contact.createUKPostcodeValidator(Joi)
}).options({ abortEarly: false, allowUnknown: true })

const validator = async payload => {
  const dateOfBirth = `${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`
  Joi.assert(
    {
      'date-of-birth': dateOfBirth,
      postcode: payload.postcode,
      referenceNumber: payload.referenceNumber
    },
    schema
  )
}

export default pageRoute(IDENTIFY.page, IDENTIFY.uri, validator, AUTHENTICATE.uri, getData)
