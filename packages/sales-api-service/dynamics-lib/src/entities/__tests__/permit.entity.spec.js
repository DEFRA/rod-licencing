import { Permit, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('permit entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })
  it('maps from dynamics', async () => {
    const permit = Permit.fromResponse(
      {
        '@odata.etag': 'W/"22639016"',
        defra_permitid: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
        defra_name: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
        defra_permittype: 910400000,
        defra_permitsubtype: 910400000,
        defra_durationnumericpart: 1,
        defra_durationdaymonthyearpart: 910400000,
        defra_numberofrods: 2,
        defra_availablefrom: '2017-03-31T23:00:00Z',
        defra_availableto: '2020-03-31T22:59:00Z',
        defra_isforfulfilment: false,
        defra_iscountersales: true,
        defra_recurringsupported: false,
        defra_advertisedprice: 6.0,
        defra_itemid: '42289'
      },
      optionSetData
    )

    const expectedFields = {
      id: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
      description: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
      permitType: expect.objectContaining({ id: 910400000, label: 'Rod Fishing Licence', description: 'Rod Fishing Licence' }),
      permitSubtype: expect.objectContaining({ id: 910400000, label: 'Salmon and sea trout', description: 'S' }),
      durationMagnitude: 1,
      durationDesignator: expect.objectContaining({ id: 910400000, label: 'Day(s)', description: 'D' }),
      numberOfRods: 2,
      availableFrom: '2017-03-31T23:00:00Z',
      availableTo: '2020-03-31T22:59:00Z',
      isForFulfilment: false,
      isCounterSales: true,
      isRecurringPaymentSupported: false,
      cost: 6,
      itemId: '42289'
    }

    expect(permit).toBeInstanceOf(Permit)
    expect(permit).toMatchObject(expect.objectContaining({ etag: 'W/"22639016"', ...expectedFields }))
    expect(permit.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(permit.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })
})
