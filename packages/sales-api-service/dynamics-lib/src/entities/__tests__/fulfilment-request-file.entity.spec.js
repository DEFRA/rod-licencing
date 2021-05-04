import { FulfilmentRequestFile, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('fulfilment request file entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const fulfilmentRequestFile = FulfilmentRequestFile.fromResponse(
      {
        '@odata.etag': 'W/"45446109"',
        defra_deliverytimestamp: '2020-01-27T14:27:08Z',
        defra_numberoffulfilmentrequests: 841,
        defra_fulfilmentrequestfileid: '1a000f36-0441-ea11-a812-000d3a649fc7',
        defra_status: 910400001,
        defra_name: 'EAFF202001270001.json',
        defra_date: '2020-01-27T00:00:00Z',
        defra_notes: 'Test notes'
      },
      optionSetData
    )

    const expectedFields = {
      id: '1a000f36-0441-ea11-a812-000d3a649fc7',
      fileName: 'EAFF202001270001.json',
      numberOfRequests: 841,
      notes: 'Test notes',
      date: '2020-01-27T00:00:00Z',
      deliveryTimestamp: '2020-01-27T14:27:08Z',
      status: expect.objectContaining({ id: 910400001, label: 'Delivered', description: 'Delivered' })
    }

    expect(fulfilmentRequestFile).toBeInstanceOf(FulfilmentRequestFile)
    expect(fulfilmentRequestFile).toMatchObject(expect.objectContaining({ etag: 'W/"45446109"', ...expectedFields }))
    expect(fulfilmentRequestFile.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(fulfilmentRequestFile.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const fulfilmentRequestFile = new FulfilmentRequestFile()
    fulfilmentRequestFile.fileName = 'TEST'
    fulfilmentRequestFile.date = '2020-01-27T00:00:00Z'
    fulfilmentRequestFile.deliveryTimestamp = '2020-01-27T14:27:08Z'
    fulfilmentRequestFile.numberOfRequests = 1
    fulfilmentRequestFile.notes = 'Some notes'
    fulfilmentRequestFile.status = optionSetData.defra_fulfilmentrequestfilestatus.options['910400000']

    const dynamicsEntity = fulfilmentRequestFile.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_deliverytimestamp: '2020-01-27T14:27:08Z',
        defra_numberoffulfilmentrequests: 1,
        defra_status: 910400000,
        defra_name: 'TEST',
        defra_date: '2020-01-27T00:00:00Z',
        defra_notes: 'Some notes'
      })
    )
  })
})
