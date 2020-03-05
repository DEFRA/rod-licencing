import initialiseServer from '../../index.js'
let server = null

describe('reference-data endpoint', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
    const api = require('dynamics-web-api').default
    api.__setResponse([
      {
        value: [
          {
            '@odata.etag': 'W/"22639016"',
            defra_availablefrom: '2017-03-31T23:00:00Z',
            defra_availableto: '2020-03-31T22:59:00Z',
            'defra_duration@OData.Community.Display.V1.FormattedValue': '1 day',
            defra_duration: 910400000,
            'defra_permittype@OData.Community.Display.V1.FormattedValue': 'Rod Fishing Licence',
            defra_permittype: 910400000,
            defra_advertisedprice: 6.0,
            defra_permitid: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
            defra_name: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
            'defra_permitsubtype@OData.Community.Display.V1.FormattedValue': 'Trout and coarse',
            defra_permitsubtype: 910400001,
            'defra_equipment@OData.Community.Display.V1.FormattedValue': 'Up to 2 rods',
            defra_equipment: 910400000,
            defra_isforfulfilment: false,
            defra_iscountersales: true,
            defra_advertisedprice_base: 6.0,
            defra_itemid: '42289'
          }
        ]
      },
      {
        value: [
          {
            '@odata.etag': 'W/"22638892"',
            defra_name: 'Junior',
            defra_concessionid: '3230c68f-ef65-e611-80dc-c4346bad4004'
          }
        ]
      }
    ])
  })

  afterAll(async () => {
    await server.stop()
  })

  it('returns a full reference data listing', async () => {
    const result = await server.inject({ method: 'GET', url: '/reference-data' })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })
    expect(JSON.parse(result.payload)).toMatchObject({
      Permit: expect.arrayContaining([expect.objectContaining({})]),
      Concession: expect.arrayContaining([expect.objectContaining({})])
    })
  })

  it('returns a list of reference data for a given collection name', async () => {
    const result = await server.inject({ method: 'GET', url: '/reference-data/Permit' })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })
    const payload = JSON.parse(result.payload)
    expect(payload).toHaveLength(1)
    expect(payload).toContainEqual(
      expect.objectContaining({
        availableFrom: '2017-03-31T23:00:00Z',
        availableTo: '2020-03-31T22:59:00Z',
        cost: 6,
        description: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
        duration: '1 day',
        durationId: 910400000,
        equipment: 'Up to 2 rods',
        equipmentId: 910400000,
        id: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
        isCounterSales: true,
        isForFulfilment: false,
        itemId: '42289',
        permitId: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
        permitSubtype: 'Trout and coarse',
        permitSubtypeId: 910400001,
        permitType: 'Rod Fishing Licence',
        permitTypeId: 910400000
      })
    )
  })

  it('returns a 400 error if a unknown key is used', async () => {
    const result = await server.inject({ method: 'GET', url: '/reference-data/Unknown' })
    expect(result).toMatchObject({
      statusCode: 400,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })
  })
})
