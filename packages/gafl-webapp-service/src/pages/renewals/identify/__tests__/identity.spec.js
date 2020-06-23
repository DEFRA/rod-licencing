import { IDENTIFY, AUTHENTICATE, CONTROLLER, LICENCE_SUMMARY, TEST_TRANSACTION } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { JUNIOR_MAX_AGE } from '@defra-fish/business-rules-lib'
import { authenticationResult } from '../__mocks__/data/authentication-result.js'
import moment from 'moment'
import * as constants from '../../../../processors/mapping-constants.js'
import { hasSenior } from '../../../../processors/concession-helper.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const VALID_IDENTIFY = IDENTIFY.uri.replace('{referenceNumber}', 'AAAAAA')

const dobAdultToday = moment().subtract(JUNIOR_MAX_AGE + 1, 'years')
const dobInvalid = moment().add(1, 'years')
const dobHelper = d => ({
  'date-of-birth-day': d.date().toString(),
  'date-of-birth-month': (d.month() + 1).toString(),
  'date-of-birth-year': d.year()
})

jest.mock('@defra-fish/connectors-lib')

describe('The easy renewal identification page', () => {
  it('returns a failure when not called with a permission reference ', async () => {
    const data = await injectWithCookies('GET', IDENTIFY.uri)
    expect(data.statusCode).toBe(403)
  })

  it('returns a failure when not called with an invalid permission reference ', async () => {
    const data = await injectWithCookies('GET', IDENTIFY.uri.replace('{referenceNumber}', 'not-a-valid-reference-number'))
    expect(data.statusCode).toBe(403)
  })

  it('returns successfully when called with a valid reference ', async () => {
    const data = await injectWithCookies('GET', VALID_IDENTIFY)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an invalid postcode', async () => {
    const data = await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'HHHHH' }, dobHelper(dobAdultToday)))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(VALID_IDENTIFY)
  })

  it('redirects back to itself on posting an invalid data of birth', async () => {
    const data = await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobInvalid)))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(VALID_IDENTIFY)
  })

  it('redirects back to itself on posting an valid but not authenticated details', async () => {
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(null)))
    const data = await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobAdultToday)))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(AUTHENTICATE.uri)
    const data2 = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(VALID_IDENTIFY)
    await injectWithCookies('GET', VALID_IDENTIFY)
  })

  it.each([
    ['email', constants.HOW_CONTACTED.email],
    ['text', constants.HOW_CONTACTED.text],
    ['none', constants.HOW_CONTACTED.none],
    ['letter', constants.HOW_CONTACTED.letter]
  ])('redirects to the controller on posting a valid response - (how contacted=%s)', async (name, fn) => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.licensee.preferredMethodOfConfirmation.label = fn
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult)))
    const data = await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobAdultToday)))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(AUTHENTICATE.uri)
    const data2 = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTROLLER.uri)
  })

  it('that an adult licence holder who is now over 65 gets a senior concession', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.licensee.birthDate = moment()
      .add(-65, 'years')
      .add(-1, 'days')
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult)))
    await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobAdultToday)))
    await injectWithCookies('GET', AUTHENTICATE.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(hasSenior(JSON.parse(payload).permissions[0])).toBeTruthy()
  })
})
