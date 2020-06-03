import each from 'jest-each'
import { govUkPayApi, salesApi } from '@defra-fish/connectors-lib'

import { initialize, injectWithCookies, postRedirectGet, start, stop } from '../../__mocks__/test-utils'
import { ADULT_FULL_1_DAY_LICENCE, MOCK_PAYMENT_RESPONSE, ADULT_DISABLED_12_MONTH_LICENCE, SENIOR_12_MONTH_LICENCE } from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, PAYMENT_FAILED, PAYMENT_CANCELLED } from '../../uri.js'
import mockPermits from '../../__mocks__/data/permits'
import mockPermitsConcessions from '../../__mocks__/data/permit-concessions'
import mockConcessions from '../../__mocks__/data/concessions'
import mockDefraCountries from '../../__mocks__/data/defra-country'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('@defra-fish/connectors-lib')
salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))
salesApi.countries.getAll = jest.fn(async () => new Promise(resolve => resolve(mockDefraCountries)))

const TRY_AGAIN_STR = 'Try again'

const paymentStatusCancelled = {
  state: {
    finished: true,
    status: 'cancelled',
    message: 'Payment cancelled',
    code: 'P0030'
  }
}

const paymentStatusRejected = {
  state: {
    finished: true,
    status: 'failed',
    message: 'Payment method rejected',
    code: 'P0010'
  }
}

const paymentStatusExpired = {
  state: {
    finished: true,
    status: 'failed',
    message: 'Payment expired',
    code: 'P0020'
  }
}

const paymentGeneralError = {
  state: {
    finished: true,
    status: 'error',
    message: 'Payment provider returned an error',
    code: 'P0050'
  }
}

const paymentTooManyRequests = {
  state: {
    finished: true,
    status: 'failed',
    message: 'Too many requests',
    code: 'P0900'
  }
}

const paymentIdNotFound = {
  state: {
    finished: true,
    code: 'P0200',
    description: 'paymentId not found'
  }
}

const paymentGovUkPayUnavailable = {
  code: 'P0999',
  description: 'GOV.UK Pay is unavailable'
}

const paymentIncomplete = {
  state: {
    status: 'started',
    finished: false
  }
}

describe('The agreed handler', () => {
  each([
    ['rejected', paymentStatusRejected],
    ['expired', paymentStatusExpired],
    ['general-error', paymentGeneralError]
  ]).it('redirects to the payment-failed page if the GOV.UK Pay returns %s on payment status fetch', async (desc, pstat) => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (MOCK_PAYMENT_RESPONSE), ok: true, status: 201 })))

    govUkPayApi.fetchPaymentStatus = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (pstat), ok: true, status: 201 })))

    const data1 = await injectWithCookies('GET', AGREED.uri)

    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    // Return after payment rejected
    const data2 = await injectWithCookies('GET', AGREED.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(PAYMENT_FAILED.uri)

    // Ensure correctness of transaction
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)

    // Test states
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()

    const data4 = await postRedirectGet(PAYMENT_FAILED.uri, {})
    expect(data4.statusCode).toBe(302)
    expect(data4.headers.location).toBe(AGREED.uri)

    // Test that the status has been updated correctly
    const { payload: status2 } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus2 = JSON.parse(status2)
    expect(parsedStatus2[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('redirects to the payment-cancelled page if the GOV.UK Pay returns cancelled', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (MOCK_PAYMENT_RESPONSE), ok: true, status: 201 })))

    govUkPayApi.fetchPaymentStatus = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (paymentStatusCancelled), ok: true, status: 201 })))

    const data1 = await injectWithCookies('GET', AGREED.uri)

    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    // Return after payment cancelled
    const data2 = await injectWithCookies('GET', AGREED.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(PAYMENT_CANCELLED.uri)

    // Ensure correctness of transaction
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)

    // Test states
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()

    // Perform the redirect to the payment failed screen and attempt payment again
    await injectWithCookies('GET', PAYMENT_FAILED.uri)
    const data3 = await postRedirectGet(PAYMENT_FAILED.uri, {})
    expect(data3.statusCode).toBe(302)
    expect(data3.headers.location).toBe(AGREED.uri)

    // Test that the status has been updated correctly
    const { payload: status2 } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus2 = JSON.parse(status2)
    expect(parsedStatus2[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error with the retry flag set if the GOV.UK Pay API throws a (recoverable) exception on payment creation', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise((resolve, reject) => reject(new Error('Time out'))))

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes(TRY_AGAIN_STR)).toBeTruthy()
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error with the retry flag set if the GOV.UK Pay API rate limit is exceeded', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (paymentTooManyRequests), ok: false, status: 429 })))

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes(TRY_AGAIN_STR)).toBeTruthy()
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 error without the retry flag set if the GOV.UK Pay API returns any arbitrary 400 error on payment creation', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()

    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (paymentIdNotFound), ok: false, status: 404 })))

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes(TRY_AGAIN_STR)).not.toBeTruthy()
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 error without the retry flag set if the GOV.UK Pay API returns any arbitrary 500 error on payment creation', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (paymentGovUkPayUnavailable), ok: false, status: 500 })))

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes(TRY_AGAIN_STR)).not.toBeTruthy()
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 400 (forbidden) error if requested where if the GOV.UK Pay API returns an incomplete payment status', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()

    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (MOCK_PAYMENT_RESPONSE), ok: true, status: 201 })))

    govUkPayApi.fetchPaymentStatus = jest.fn(async () =>
      new Promise((resolve, reject) => resolve({ json: () => (paymentIncomplete), ok: true, status: 201 })))

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    const data2 = await injectWithCookies('GET', AGREED.uri)
    expect(data2.statusCode).toBe(403)

    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error if the GOV.UK Pay API throws en exception on fetching status', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (MOCK_PAYMENT_RESPONSE), ok: true, status: 201 })))

    govUkPayApi.fetchPaymentStatus = jest.fn(async () =>
      new Promise((resolve, reject) => reject(new Error('Timeout'))))

    const data1 = await injectWithCookies('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes(TRY_AGAIN_STR)).toBeTruthy()

    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error if the GOV.UK Pay API returns an the rate limit response getting status', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    govUkPayApi.createPayment = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (MOCK_PAYMENT_RESPONSE), ok: true, status: 201 })))

    govUkPayApi.fetchPaymentStatus = jest.fn(async () =>
      new Promise(resolve => resolve({ json: () => (paymentTooManyRequests), ok: false, status: 429 })))

    const data1 = await injectWithCookies('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)

    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })
})
