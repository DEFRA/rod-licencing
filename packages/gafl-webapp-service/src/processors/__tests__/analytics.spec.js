import { initialiseAnalyticsSessionData, getTrackingProductDetailsFromTransaction, getAffiliation } from '../analytics.js'
import db from 'debug'

jest.mock('debug', () => jest.fn(() => jest.fn()))

describe('initialiseAnalyticsSessionData', () => {
  const fakeCacheSetter = jest.fn()
  const fakeCacheDecorator = jest.fn(() => ({ helpers: { status: { set: fakeCacheSetter } } }))
  let fakeDebug, firstDbCall
  beforeAll(() => {
    ;[[firstDbCall]] = db.mock.calls
    fakeDebug = db.mock.results[0].value
    console.log('fakeDebug', fakeDebug)
  })
  beforeEach(jest.clearAllMocks)

  it('initialises debug', () => {
    expect(firstDbCall).toEqual('webapp:analytics-processor')
  })

  it.each([
    { _ga: 'GA1.2.1234567890.10234567890', gaClientId: '1234567890' },
    { _ga: 'GA2.1-3.220027162.1602852296', gaClientId: '220027162' }
  ])(
    'stores the ga client id from the query string on the session to support cross-domain tracking from the landing page',
    async ({ _ga, gaClientId }) => {
      const fakeRequest = {
        query: { _ga },
        cache: fakeCacheDecorator
      }
      await initialiseAnalyticsSessionData(fakeRequest)
      expect(fakeCacheSetter).toHaveBeenCalledWith(
        expect.objectContaining({
          gaClientId
        })
      )
    }
  )

  it.each(['!@£$%^&*()œ∑´®†¥¨^øåß∂ƒ©˙∆˚', '¡€#¢∞§¶•ªø^¨¥©˙∆˚˙©†ƒ®', '1$2$345$678', '1,2,345,678', '523510731.1602852296'])(
    'unexpected _ga formats fail gracefully',
    async _ga => {
      const fakeRequest = {
        query: { _ga },
        cache: fakeCacheDecorator
      }
      let err
      try {
        await initialiseAnalyticsSessionData(fakeRequest)
      } catch (e) {
        err = e
      }
      expect(err).toBeUndefined()
    }
  )

  it.each(['!@£$%^&*()œ∑´®†¥¨^øåß∂ƒ©˙∆˚', '¡€#¢∞§¶•ªø^¨¥©˙∆˚˙©†ƒ®', '1$2$345$678', '1,2,345,678', '523510731.1602852296'])(
    'unexpected _ga formats are logged',
    async _ga => {
      const fakeRequest = {
        query: { _ga },
        cache: fakeCacheDecorator
      }

      await initialiseAnalyticsSessionData(fakeRequest)
      expect(fakeDebug).toHaveBeenCalledWith(expect.stringContaining(_ga))
    }
  )

  it('retrieves campaign attribution from the query string parameters and stores these on the session', async () => {
    const fakeRequest = {
      query: {
        utm_campaign: 'test_campaign',
        utm_source: 'test_source',
        utm_medium: 'test_medium',
        utm_term: 'test_term',
        utm_content: 'test_content'
      },
      cache: fakeCacheDecorator
    }
    await initialiseAnalyticsSessionData(fakeRequest)
    expect(fakeCacheSetter).toHaveBeenCalledWith(
      expect.objectContaining({
        attribution: {
          utm_campaign: 'test_campaign',
          utm_source: 'test_source',
          utm_medium: 'test_medium',
          utm_term: 'test_term',
          utm_content: 'test_content'
        }
      })
    )
  })

  it('retrieves the custom ga client id from the previous session and stores these on the new session', async () => {
    const fakeRequest = { cache: fakeCacheDecorator, query: {} }
    await initialiseAnalyticsSessionData(fakeRequest, { gaClientId: 'test123' })
    expect(fakeCacheSetter).toHaveBeenCalledWith(
      expect.objectContaining({
        gaClientId: 'test123',
        attribution: undefined
      })
    )
  })

  it('retrieves campaign attribution from the previous session and stores these on the new session', async () => {
    const fakeRequest = { cache: fakeCacheDecorator, query: {} }
    await initialiseAnalyticsSessionData(fakeRequest, {
      attribution: {
        utm_campaign: 'test_campaign',
        utm_source: 'test_source',
        utm_medium: 'test_medium',
        utm_term: 'test_term',
        utm_content: 'test_content'
      }
    })
    expect(fakeCacheSetter).toHaveBeenCalledWith(
      expect.objectContaining({
        attribution: {
          utm_campaign: 'test_campaign',
          utm_source: 'test_source',
          utm_medium: 'test_medium',
          utm_term: 'test_term',
          utm_content: 'test_content'
        }
      })
    )
  })
})

describe('tracking data transform', () => {
  it.each(['Salmon 12 day licence', 'Pike 2 year licence', 'Trout 20 second licence'])(
    'passes permit description as id',
    permitDescription => {
      const transaction = getSampleTransaction([getSamplePermission({ permitDescription })])
      const [{ id }] = getTrackingProductDetailsFromTransaction(transaction)
      expect(id).toBe(permitDescription)
    }
  )

  it.each([
    ['Old trout', 1, 'Old trout - 1 rod(s) licence'],
    ['Silverfish', 10, 'Silverfish - 10 rod(s) licence'],
    ['Goldfish', 99, 'Goldfish - 99 rod(s) licence']
  ])('Generates name from permit subtype label and number of rods', (permitSubtypeLabel, numberOfRods, expectedName) => {
    const transaction = getSampleTransaction([getSamplePermission({ permitSubtypeLabel, numberOfRods })])
    const [{ name }] = getTrackingProductDetailsFromTransaction(transaction)
    expect(name).toBe(expectedName)
  })

  it.each(['Rod Fishing Licence', 'Fishing trawler licence', 'Salmon tickling licence'])(
    'Generates brand from permit type label',
    permitTypeLabel => {
      const transaction = getSampleTransaction([getSamplePermission({ permitTypeLabel })])
      const [{ brand }] = getTrackingProductDetailsFromTransaction(transaction)
      expect(brand).toBe(permitTypeLabel)
    }
  )

  it.each([
    ['Dalmationfish', 101, [{ name: 'threats' }, { name: 'coercion' }], 'Dalmationfish/101 rod(s)/threats,coercion'],
    ['Swordfish', 3, [{ name: 'bribery' }], 'Swordfish/3 rod(s)/bribery'],
    ['Pollock', 1, [], 'Pollock/1 rod(s)/Full']
  ])(
    'Generates category from permit subtype label, number of rods and concessions',
    (permitSubtypeLabel, numberOfRods, concessions, expectedCategory) => {
      const transaction = getSampleTransaction([getSamplePermission({ permitSubtypeLabel, numberOfRods, concessions })])
      const [{ category }] = getTrackingProductDetailsFromTransaction(transaction)

      expect(category).toBe(expectedCategory)
    }
  )

  it.each([
    [17, 'seconds', '17 seconds'],
    [48, 'hours', '48 hours'],
    [20000, 'years', '20000 years']
  ])('Generates variant from duration', (durationMagnitude, durationDesignatorLabel, expectedVariant) => {
    const transaction = getSampleTransaction([getSamplePermission({ durationMagnitude, durationDesignatorLabel })])
    const [{ variant }] = getTrackingProductDetailsFromTransaction(transaction)
    expect(variant).toBe(expectedVariant)
  })

  it.each(['Desc 1', 'Desc 2', 'Desc 3'])('quantity is always 1', permitDescription => {
    const transaction = getSampleTransaction([getSamplePermission({ permitDescription })])
    const [{ quantity }] = getTrackingProductDetailsFromTransaction(transaction)
    expect(quantity).toBe(1)
  })

  it.each([1.99, 20.865, 999.76])('Generates price from permit cost', cost => {
    const transaction = getSampleTransaction([getSamplePermission({ cost })])
    const [{ price }] = getTrackingProductDetailsFromTransaction(transaction)
    expect(price).toBe(cost)
  })

  it.each([[['A', 'B', 'C']], [['1', '2', '3', '4', '5']], [['eeny', 'meeny']]])(
    'generates one product for each permission',
    permitDescriptions => {
      const transaction = getSampleTransaction(permitDescriptions.map(permitDescription => getSamplePermission({ permitDescription })))
      const products = getTrackingProductDetailsFromTransaction(transaction)
      expect(products.length).toBe(permitDescriptions.length)
    }
  )
})

describe('affiliation transform', () => {
  it('returns expected value for web sales', () => {
    expect(getAffiliation('websales')).toBe('Get a fishing licence service - Web sales')
  })

  it('returns expected value for telesales', () => {
    expect(getAffiliation('telesales')).toBe('Get a fishing licence service - Telephone sales')
  })
})

const getSamplePermission = ({
  permitDescription = 'Salmon 1 day 1 Rod Licence (Full)',
  permitSubtypeLabel = 'Salmon and sea trout',
  numberOfRods = 1,
  permitTypeLabel = 'Rod Fishing Licence',
  durationMagnitude = 12,
  durationDesignatorLabel = 'Month(s)',
  cost = 1,
  concessions = []
} = {}) => ({
  permit: {
    description: permitDescription,
    permitSubtype: {
      label: permitSubtypeLabel
    },
    numberOfRods,
    permitType: {
      label: permitTypeLabel
    },
    durationMagnitude,
    durationDesignator: {
      label: durationDesignatorLabel
    },
    cost,
    concessions
  }
})

const getSampleTransaction = (permissions = [getSamplePermission()]) => ({
  permissions
})
