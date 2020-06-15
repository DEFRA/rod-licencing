import moment from 'moment'
import { DATE_OF_BIRTH } from '../../../uri.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import { isMinor, isJunior, isSenior } from '@defra-fish/business-rules-lib'

/**
 * Transfer the validated page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(DATE_OF_BIRTH.page)

  const dateOfBirth = moment({
    year: payload['date-of-birth-year'],
    month: Number.parseInt(payload['date-of-birth-month']) - 1,
    day: payload['date-of-birth-day']
  }).format('YYYY-MM-DD')

  // Work out the junior or senior concession at the point at which the licence starts
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // Set the data of birth in the licensee object
  permission.licensee.birthDate = dateOfBirth
  delete permission.licensee.noLicenceRequired

  // Calculate the age when the licence starts
  const ageAtLicenceStartDate = moment(permission.licenceStartDate).diff(moment(dateOfBirth), 'years')

  if (isMinor(ageAtLicenceStartDate)) {
    // Just flag as being under 13 for the router
    concessionHelper.clear(permission)
    Object.assign(permission.licensee, { noLicenceRequired: true })
  } else if (isJunior(ageAtLicenceStartDate)) {
    // Juniors always get a 12 months licence
    Object.assign(permission, { licenceLength: '12M', licenceStartTime: '0' })
    concessionHelper.addJunior(permission)
    // Junior licences are net sent out by post so if the contact details are by letter then reset to none
    if (permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.letter) {
      permission.licensee.preferredMethodOfConfirmation = HOW_CONTACTED.none
      permission.licensee.preferredMethodOfReminder = HOW_CONTACTED.none
    }
  } else if (isSenior(ageAtLicenceStartDate)) {
    concessionHelper.addSenior(permission)
  } else {
    concessionHelper.removeJunior(permission)
    concessionHelper.removeSenior(permission)
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}