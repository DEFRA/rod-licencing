import moment from 'moment'
import {
  IDENTIFY,
  AUTHENTICATE,
  CONTROLLER,
  LICENCE_SUMMARY,
  TEST_TRANSACTION,
  RENEWAL_PUBLIC,
  RENEWAL_INACTIVE,
  LICENCE_LENGTH,
  CONTACT_SUMMARY
} from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../__mocks__/test-utils-system.js'

import { dobHelper, ADULT_TODAY } from '../../../../__mocks__/test-utils-business-rules.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { RENEW_AFTER_DAYS, RENEW_BEFORE_DAYS } from '@defra-fish/business-rules-lib'
import { authenticationResult } from '../__mocks__/data/authentication-result.js'
import * as constants from '../../../../processors/mapping-constants.js'
import { hasSenior } from '../../../../processors/concession-helper.js'
import mockDefraCountries from '../../../../__mocks__/data/defra-country.js'

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
})

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_XGOV_PROPERTY
})

const VALID_RENEWAL_PUBLIC = RENEWAL_PUBLIC.uri.replace('{referenceNumber?}', 'AAAAAA')
const VALID_RENEWAL_PUBLIC_URI = RENEWAL_PUBLIC.uri.replace('{referenceNumber?}', '')

const dobInvalid = moment().add(1, 'years')
jest.mock('@defra-fish/connectors-lib')
mockSalesApi()
salesApi.countries.getAll = jest.fn(() => Promise.resolve(mockDefraCountries))

describe('The easy renewal identification page', () => {
  it('returns a failure when called with an invalid permission reference ', async () => {
    const data = await injectWithCookies('GET', RENEWAL_PUBLIC.uri.replace('{referenceNumber}', 'not-a-valid-reference-number'))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri)
    const data2 = await injectWithCookies('GET', IDENTIFY.uri)
    expect(data2.statusCode).toBe(403)
  })

  it('returns successfully when called with a valid reference ', async () => {
    const data = await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri)
    const data2 = await injectWithCookies('GET', IDENTIFY.uri)
    expect(data2.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an invalid postcode', async () => {
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'HHHHH' }, dobHelper(ADULT_TODAY)))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri)
  })

  it('redirects back to itself on posting an invalid data of birth', async () => {
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobInvalid)))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri)
  })

  it('redirects back to itself on posting an valid but not authenticated details', async () => {
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(null))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC_URI)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
    )
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(AUTHENTICATE.uri)
    const data2 = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(IDENTIFY.uri)
    const data3 = await injectWithCookies('GET', IDENTIFY.uri)
    expect(data3.statusCode).toBe(200)
  })

  it.each([
    ['email', constants.HOW_CONTACTED.email],
    ['text', constants.HOW_CONTACTED.text],
    ['none', constants.HOW_CONTACTED.none],
    ['letter', constants.HOW_CONTACTED.letter]
  ])('redirects to the controller on posting a valid response - (how contacted=%s), and shows both summary pages', async (name, fn) => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.licensee.preferredMethodOfConfirmation.label = fn
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .toISOString()
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))

    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
    )
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(AUTHENTICATE.uri)

    const data2 = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTROLLER.uri)
    await injectWithCookies('GET', CONTROLLER.uri)

    const data4 = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data4.statusCode).toBe(200)

    const data5 = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data5.statusCode).toBe(200)
  })

  const salmonAndSeaTroutPermitSubtype = {
    id: 910400000,
    label: 'Salmon and sea trout',
    description: 'S'
  }

  const troutAndCoarsePermitSubtype = {
    id: 910400001,
    label: 'Trout and coarse',
    description: 'C'
  }

  it.each([
    [
      'Trout and coarse - 2 rod',
      { subType: troutAndCoarsePermitSubtype, numberOfRods: '2', licenceType: constants.LICENCE_TYPE['trout-and-coarse'] }
    ],
    [
      'Trout and coarse - 3 rod',
      { subType: troutAndCoarsePermitSubtype, numberOfRods: '3', licenceType: constants.LICENCE_TYPE['trout-and-coarse'] }
    ],
    [
      'Salmon and sea trout',
      { subType: salmonAndSeaTroutPermitSubtype, numberOfRods: '1', licenceType: constants.LICENCE_TYPE['salmon-and-sea-trout'] }
    ]
  ])('redirects to the controller on posting a valid response - (licence type=%s)', async (name, obj) => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.permit.numberOfRods = obj.numberOfRods
    newAuthenticationResult.permission.permit.permitSubtype = obj.subType
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .toISOString()
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    await injectWithCookies('GET', AUTHENTICATE.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].numberOfRods).toEqual(obj.numberOfRods)
    expect(JSON.parse(payload).permissions[0].licenceType).toEqual(obj.licenceType)
  })

  it('that an adult licence holder who is now over 65 gets a senior concession', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .toISOString()
    newAuthenticationResult.permission.licensee.birthDate = moment()
      .add(-65, 'years')
      .add(-1, 'days')
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    await injectWithCookies('GET', AUTHENTICATE.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(hasSenior(JSON.parse(payload).permissions[0])).toBeTruthy()
  })

  it('that an expiry too far in the future causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .add(RENEW_BEFORE_DAYS + 1, 'days')
      .toISOString()
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_INACTIVE.uri)

    // Fetch the page
    const data2 = await injectWithCookies('GET', RENEWAL_INACTIVE.uri)
    expect(data2.statusCode).toBe(200)

    const data3 = await injectWithCookies('POST', RENEWAL_INACTIVE.uri, {})
    expect(data3.statusCode).toBe(302)
    expect(data3.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('that an expiry that has expired causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .add(-1 * (RENEW_AFTER_DAYS + 1), 'days')
      .toISOString()
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_INACTIVE.uri)
  })

  it('that an expiry for a 1 or 8 day licence causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.permit.durationMagnitude = 1
    newAuthenticationResult.permission.permit.durationDesignator.description = 'D'
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_INACTIVE.uri)
  })
})
