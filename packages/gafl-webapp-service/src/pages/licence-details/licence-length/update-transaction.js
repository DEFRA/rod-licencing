import * as mappings from '../../../processors/mapping-constants.js'
import { LICENCE_LENGTH } from '../../../uri.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import moment from 'moment'
import { cacheDateFormat } from '../../../processors/date-and-time-display'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { isPhysical } from '../../../processors/licence-type-display'
import { licenceToStart } from '../licence-to-start/update-transaction'

export const onLengthChange = permission => {
  // If the licence start date has be chosen as today, and the licence is changed to a 12 month
  // then set the start after payment flag
  if (
    permission.licenceLength === '12M' &&
    moment(permission.licenceStartDate, cacheDateFormat)
      .tz(SERVICE_LOCAL_TIME)
      .isSame(moment(), 'day')
  ) {
    permission.licenceToStart = licenceToStart.AFTER_PAYMENT
    permission.licenceStartTime = null
  }

  // If we have set the licence type to physical change the method of contact from 'none' to 'letter' and vice-versa
  if (isPhysical(permission) && permission?.licensee?.preferredMethodOfConfirmation === mappings.HOW_CONTACTED.none) {
    permission.licensee.preferredMethodOfConfirmation = mappings.HOW_CONTACTED.letter
    permission.licensee.preferredMethodOfReminder = mappings.HOW_CONTACTED.letter
  }

  if (!isPhysical(permission) && permission?.licensee?.preferredMethodOfConfirmation === mappings.HOW_CONTACTED.letter) {
    permission.licensee.preferredMethodOfConfirmation = mappings.HOW_CONTACTED.none
    permission.licensee.preferredMethodOfReminder = mappings.HOW_CONTACTED.none
  }
}
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_LENGTH.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  permission.licenceLength = payload['licence-length']

  // Setting the licence length to anything other that 12 months removes disabled concessions
  if (permission.licenceLength !== '12M') {
    concessionHelper.removeDisabled(permission)
    if (permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
      permission.numberOfRods = '2'
    }
  }

  onLengthChange(permission)

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}
