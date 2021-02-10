/**
 * This maps the functions to manipulate the transaction object to the pages
 */

import dateOfBirth from '../pages/concessions/date-of-birth/update-transaction.js'
import disabilityConcession from '../pages/concessions/disability/update-transaction.js'

import licenceLength from '../pages/licence-details/licence-length/update-transaction.js'
import licenceType from '../pages/licence-details/licence-type/update-transaction.js'
import licenceToStart from '../pages/licence-details/licence-to-start/update-transaction.js'
import licenceStartTime from '../pages/licence-details/licence-start-time/update-transaction.js'

import name from '../pages/contact/name/update-transaction.js'
import addressLookup from '../pages/contact/address/lookup/update-transaction.js'
import addressSelect from '../pages/contact/address/select/update-transaction.js'
import addressEntry from '../pages/contact/address/entry/update-transaction.js'
import contact from '../pages/contact/contact/update-transaction.js'
import newsletter from '../pages/contact/newsletter/update-transaction.js'
import licenceBy from '../pages/contact/digital-licence/licence-by/update-transactions.js'
import licenceOption from '../pages/contact/digital-licence/licence-option/update-transactions.js'

import paymentCancelled from '../pages/payment/cancelled/update-transaction.js'
import paymentFailed from '../pages/payment/failed/update-transaction.js'

import termsAndConditions from '../pages/terms-and-conditions/update-transaction.js'
import renewalInactive from '../pages/renewals/renewal-inactive/update-transaction.js'

import {
  DATE_OF_BIRTH,
  LICENCE_TYPE,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_START_TIME,
  DISABILITY_CONCESSION,
  NAME,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  ADDRESS_ENTRY,
  DIGITAL_LICENCE_BY,
  DIGITAL_LICENCE_OPTION,
  CONTACT,
  NEWSLETTER,
  TERMS_AND_CONDITIONS,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED,
  RENEWAL_INACTIVE
} from '../uri.js'

export default {
  [DATE_OF_BIRTH.page]: dateOfBirth,
  [LICENCE_TO_START.page]: licenceToStart,
  [DISABILITY_CONCESSION.page]: disabilityConcession,
  [LICENCE_LENGTH.page]: licenceLength,
  [LICENCE_TYPE.page]: licenceType,
  [LICENCE_START_TIME.page]: licenceStartTime,
  [ADDRESS_LOOKUP.page]: addressLookup,
  [ADDRESS_SELECT.page]: addressSelect,
  [ADDRESS_ENTRY.page]: addressEntry,
  [NAME.page]: name,
  [DIGITAL_LICENCE_OPTION.page]: licenceOption,
  [DIGITAL_LICENCE_BY.page]: licenceBy,
  [CONTACT.page]: contact,
  [NEWSLETTER.page]: newsletter,
  [TERMS_AND_CONDITIONS.page]: termsAndConditions,
  [PAYMENT_FAILED.page]: paymentFailed,
  [PAYMENT_CANCELLED.page]: paymentCancelled,
  [RENEWAL_INACTIVE.page]: renewalInactive
}
