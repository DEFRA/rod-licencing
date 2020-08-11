import {
  NEWSLETTER,
  CONTACT,
  CONTACT_SUMMARY,
  TEST_TRANSACTION,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  NEW_TRANSACTION
} from '../../../../uri.js'

import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

import { ADULT_TODAY, dobHelper } from '../../../../__mocks__/test-helpers'
import { licenceToStart } from '../../../licence-details/licence-to-start/update-transaction'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The newsletter page', () => {
  it('returns success on request', async () => {
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
    const response = await injectWithCookies('GET', NEWSLETTER.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects to itself posting an empty response', async () => {
    const response = await injectWithCookies('POST', NEWSLETTER.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(NEWSLETTER.uri)
  })

  it('redirects to itself posting an invalid email response', async () => {
    const response = await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'yes', email: 'foo', 'email-entry': 'yes' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(NEWSLETTER.uri)
  })

  describe('if the user has set the preferred method of contact to email ', async () => {
    beforeAll(async d => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
      d()
    })

    it('if posting no it sets the newsletter contact method to none and preserves the contact methods and email', async () => {
      await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'no',
        'email-entry': 'no'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.none,
          preferredMethodOfConfirmation: HOW_CONTACTED.email,
          preferredMethodOfReminder: HOW_CONTACTED.email,
          email: 'example@email.com'
        })
      )
    })

    it('if posting no it redirects to the summary page', async () => {
      const response = await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
    })

    it('if posting yes it sets the newsletter contact method to email and preserves the contact methods and email', async () => {
      await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.email,
          preferredMethodOfConfirmation: HOW_CONTACTED.email,
          preferredMethodOfReminder: HOW_CONTACTED.email,
          email: 'example@email.com'
        })
      )
    })

    it('if posting yes and subsequently setting the preferred method of contact to text, the email is preserved', async () => {
      await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no'
      })
      await postRedirectGet(CONTACT.uri, { 'how-contacted': 'text', text: '+22 0445638902' })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.email,
          preferredMethodOfConfirmation: HOW_CONTACTED.text,
          preferredMethodOfReminder: HOW_CONTACTED.text,
          email: 'example@email.com'
        })
      )
    })

    it('if posting yes it redirects to the summary page', async () => {
      const response = await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
    })
  })

  describe('if the user has set the preferred method of contact to text ', async () => {
    beforeAll(async d => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      await postRedirectGet(CONTACT.uri, { 'how-contacted': 'text', text: '+22 0445638902' })
      d()
    })

    it('if posting no it sets the newsletter contact method to none and preserves the email address', async () => {
      await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'no',
        'email-entry': 'yes'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.none,
          preferredMethodOfConfirmation: HOW_CONTACTED.text,
          preferredMethodOfReminder: HOW_CONTACTED.text
        })
      )
    })

    it('if posting no it redirects to the summary page', async () => {
      const response = await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'no',
        'email-entry': 'yes'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
    })

    it('if posting yes it sets the newsletter contact method to email and sets the email address', async () => {
      await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'yes',
        email: 'example@email.com'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.email,
          preferredMethodOfConfirmation: HOW_CONTACTED.text,
          preferredMethodOfReminder: HOW_CONTACTED.text,
          email: 'example@email.com'
        })
      )
    })

    it('if posting yes it redirects to the summary page', async () => {
      const response = await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no',
        email: 'example@email.com'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
    })

    it('if having previously posting yes and subsequently posting no, it nulls the email', async () => {
      await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'yes',
        email: 'example@email.com'
      })
      await postRedirectGet(NEWSLETTER.uri, {
        newsletter: 'no',
        'email-entry': 'no'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfNewsletter).toBe(HOW_CONTACTED.none)
      expect(JSON.parse(payload).permissions[0].licensee.email).not.toBeTruthy()
    })
  })
})
