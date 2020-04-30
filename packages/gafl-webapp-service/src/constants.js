/*
 * Page locations, templates
 */
const LICENCE_LENGTH = { uri: '/buy/licence-length', page: 'licence-length' }
const LICENCE_TYPE = { uri: '/buy/licence-type', page: 'licence-type' }
const NUMBER_OF_RODS = { uri: '/buy/number-of-rods', page: 'number-of-rods' }
const LICENCE_TO_START = { uri: '/buy/start-kind', page: 'licence-to-start' }
const LICENCE_START_DATE = { uri: '/buy/start-date', page: 'licence-start-date' }
const LICENCE_START_TIME = { uri: '/buy/start-time', page: 'licence-start-time' }

const NO_LICENCE_REQUIRED = { uri: '/buy/no-licence-required', page: 'no-licence-required' }
const JUNIOR_LICENCE = { uri: '/buy/junior-licence', page: 'junior-licence' }

const BENEFIT_CHECK = { uri: '/buy/benefit-check', page: 'benefit-check' }
const BENEFIT_NI_NUMBER = { uri: '/buy/benefit-ni-number', page: 'benefit-ni-number' }
const BLUE_BADGE_CHECK = { uri: '/buy/blue-badge-check', page: 'blue-badge-check' }
const BLUE_BADGE_NUMBER = { uri: '/buy/blue-badge-number', page: 'blue-badge-number' }
const DATE_OF_BIRTH = { uri: '/buy/date-of-birth', page: 'date-of-birth' }

const NAME = { uri: '/buy/name', page: 'name' }
const ADDRESS_LOOKUP = { uri: '/buy/find-address', page: 'address-lookup' }
const ADDRESS_SELECT = { uri: '/buy/select-address', page: 'address-select' }
const ADDRESS_ENTRY = { uri: '/buy/address', page: 'address-entry' }
const CONTACT = { uri: '/buy/contact', page: 'contact' }
const NEWSLETTER = { uri: '/buy/newsletter', page: 'newsletter' }

const CONTACT_SUMMARY = { uri: '/buy/contact-summary', page: 'contact-summary' }
const LICENCE_SUMMARY = { uri: '/buy/licence-summary', page: 'licence-summary' }

const TERMS_AND_CONDITIONS = { uri: '/buy/terms-conditions', page: 'terms-and-conditions' }
const ORDER_COMPLETE = { uri: '/buy/order-complete', page: 'order-complete' }

const CONTROLLER = { uri: '/buy' }
const NEW_TRANSACTION = { uri: '/buy/new' }
const ADD_PERMISSION = { uri: '/buy/add' }
const AGREED = { uri: '/buy/agreed' }
const FINALISED = { uri: '/buy/finalised' }

const CLIENT_ERROR = { uri: '/buy/client-error', page: 'client-error' }
const SERVER_ERROR = { uri: '/buy/server-error', page: 'server-error' }

/**
 * These are inserted at runtime by the test framework but the session manager needs to know about them
 */
const TEST_STATUS = { uri: '/buy/status' }
const TEST_TRANSACTION = { uri: '/buy/transaction' }

/**
 * System constants and defaults
 */
const SALES_API_URL_DEFAULT = 'http://0.0.0.0:4000'
const SALES_API_TIMEOUT_MS_DEFAULT = 10000
const MAX_PERMISSIONS = 500
const ADDRESS_LOOKUP_SERVICE = { lang: 'EN', dataset: 'DPA' }
const ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT = 10000
const SESSION_TTL_MS_DEFAULT = 3 * 60 * 60 * 1000
const REDIS_PORT_DEFAULT = 6379
const SESSION_COOKIE_NAME_DEFAULT = 'sid'
const PAGE_STATE = { completed: true, error: false }
const COMPLETION_STATUS = { agreed: 'agreed', posted: 'posted', finalised: 'finalised', payed: 'payed', completed: 'completed' }

export {
  SESSION_TTL_MS_DEFAULT,
  REDIS_PORT_DEFAULT,
  SESSION_COOKIE_NAME_DEFAULT,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  NUMBER_OF_RODS,
  LICENCE_TO_START,
  LICENCE_START_DATE,
  LICENCE_START_TIME,
  DATE_OF_BIRTH,
  NO_LICENCE_REQUIRED,
  JUNIOR_LICENCE,
  NAME,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  ADDRESS_ENTRY,
  CONTACT,
  NEWSLETTER,
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  CONTROLLER,
  TERMS_AND_CONDITIONS,
  AGREED,
  FINALISED,
  ORDER_COMPLETE,
  NEW_TRANSACTION,
  ADD_PERMISSION,
  BENEFIT_CHECK,
  BENEFIT_NI_NUMBER,
  BLUE_BADGE_CHECK,
  BLUE_BADGE_NUMBER,
  SALES_API_URL_DEFAULT,
  ADDRESS_LOOKUP_SERVICE,
  ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT,
  SALES_API_TIMEOUT_MS_DEFAULT,
  MAX_PERMISSIONS,
  PAGE_STATE,
  COMPLETION_STATUS,
  CLIENT_ERROR,
  SERVER_ERROR,
  TEST_STATUS,
  TEST_TRANSACTION
}
