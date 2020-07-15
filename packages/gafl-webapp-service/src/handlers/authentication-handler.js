import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../processors/renewals-write-cache.js'
import { IDENTIFY, CONTROLLER, RENEWAL_INACTIVE } from '../uri.js'
import { validation, RENEW_BEFORE_DAYS, RENEW_AFTER_DAYS } from '@defra-fish/business-rules-lib'
import Joi from '@hapi/joi'
import { salesApi } from '@defra-fish/connectors-lib'
import moment from 'moment'

/**
 * Handler to authenticate the user on the easy renewals journey. It will
 * (1) Redirect back to the identification page where there is an authentication failure
 * (2) Redirect to an error page where the renewal has expired
 * (3) Redirect back to an error page where a licence is already issued
 * (4) Establish the session cache and redirect into the controller where the user is authenticated
 * @param request
 * @param h
 * @returns {Promise<ResponseObject|*|Response>}
 */
export default async (request, h) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(IDENTIFY.page)
  const dateOfBirth = await validation.contact
    .createBirthDateValidator(Joi)
    .validateAsync(`${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`)
  const postcode = await validation.contact.createUKPostcodeValidator(Joi).validateAsync(payload.postcode)

  const permission = await request.cache().helpers.status.getCurrentPermission()
  const referenceNumber = payload.referenceNumber || permission.referenceNumber

  // Authenticate
  const authenticationResult = await salesApi.authenticate(referenceNumber, dateOfBirth, postcode)

  const linkInactive = async reason => {
    await request.cache().helpers.status.setCurrentPermission({
      referenceNumber,
      authentication: {
        authorized: false,
        reason,
        endDate: authenticationResult.permission.endDate
      }
    })
    return h.redirect(RENEWAL_INACTIVE.uri)
  }

  if (!authenticationResult) {
    payload.referenceNumber = referenceNumber
    await request.cache().helpers.page.setCurrentPermission(IDENTIFY.page, { payload, error: { referenceNumber: 'string.invalid' } })
    await request.cache().helpers.status.setCurrentPermission({ referenceNumber, authentication: { authorized: false } })
    return h.redirect(IDENTIFY.uri)
  } else {
    // Test for 12 month licence
    if (
      authenticationResult.permission.permit.durationDesignator.description === 'M' &&
      authenticationResult.permission.permit.durationMagnitude === 12
    ) {
      const daysDiff = moment(authenticationResult.permission.endDate).diff(moment().startOf('day'), 'days')
      // Test for active renewal
      if (daysDiff > RENEW_BEFORE_DAYS) {
        return linkInactive('not-due')
      } else if (daysDiff < -RENEW_AFTER_DAYS) {
        return linkInactive('expired')
      } else {
        await setUpCacheFromAuthenticationResult(request, authenticationResult)
        await setUpPayloads(request)
        await request.cache().helpers.status.setCurrentPermission({ authentication: { authorized: true } })
        return h.redirect(CONTROLLER.uri)
      }
    } else {
      return linkInactive('not-annual')
    }
  }
}
