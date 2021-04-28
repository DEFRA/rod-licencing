import { salesApi } from '@defra-fish/connectors-lib'
import mockDefraCountries from '../../../../../__mocks__/data/defra-country.js'
import { start, stop, initialize, injectWithCookies } from '../../../../../__mocks__/test-utils-system.js'
import {
  ADDRESS_ENTRY,
  CONTACT,
  TEST_TRANSACTION,
  CONTACT_SUMMARY,
  CONTROLLER,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEW_TRANSACTION,
  NEWSLETTER
} from '../../../../../uri.js'
import { ADULT_TODAY, dobHelper } from '../../../../../__mocks__/test-utils-business-rules'
import { licenceToStart } from '../../../../licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../../../../licence-details/licence-type/route'
import { getCountryDropDownOptions } from '../route'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const goodAddress = {
  premises: '14 HOWECROFT COURT',
  street: 'EASTMEAD LANE',
  locality: '',
  town: 'BRISTOL',
  postcode: 'BS9 1HJ',
  'country-code': 'GB-ENG'
}

salesApi.countries.getAll = jest.fn(async () => new Promise(resolve => resolve(mockDefraCountries)))

describe('The manual address entry page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', ADDRESS_ENTRY.uri)
    expect(response.statusCode).toBe(200)
  })

  it('.getCountryDropDownOptions returns country list excluding "United Kingdom"', async () => {
    const countries = await getCountryDropDownOptions()
    expect(countries).toEqual(expect.not.objectContaining({ description: 'GB', label: 'United Kingdom' }))
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting address with no premises', async () => {
    const addr = Object.assign({}, goodAddress)
    delete addr.premises
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting too long premises', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.premises = 'A'.repeat(101)
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting too long street', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.street = 'A'.repeat(101)
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting too long locality', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.locality = 'A'.repeat(101)
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting address with no town', async () => {
    const addr = Object.assign({}, goodAddress)
    delete addr.town
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting too long town', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.town = 'A'.repeat(101)
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting with missing country code', async () => {
    const addr = Object.assign({}, goodAddress)
    delete addr['country-code']
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting invalid UK postcode', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.postcode = 'foo'
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects to the contact page on posting a valid UK address', async () => {
    const addr = Object.assign({}, goodAddress)
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(CONTACT.uri)

    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee).toEqual({
      organisation: null,
      premises: '14 Howecroft Court',
      street: 'Eastmead Lane',
      town: 'Bristol',
      postcode: 'BS9 1HJ',
      countryCode: 'GB-ENG'
    })
  })

  it('redirects to contact page on posting a valid non-UK address', async () => {
    const addr = Object.assign({}, goodAddress)
    addr['country-code'] = 'FR'
    addr.postcode = 'not checked'
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, addr)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(CONTACT.uri)

    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee).toEqual({
      organisation: null,
      premises: '14 Howecroft Court',
      street: 'Eastmead Lane',
      town: 'Bristol',
      postcode: 'NOT CHECKED',
      countryCode: 'FR'
    })
  })

  it('redirects to contact summary page on posting a valid non-UK address if the contact summary has been seen', async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'yes', 'email-entry': 'no' })
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    const response = await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
  })
})
