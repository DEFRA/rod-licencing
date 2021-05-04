import { FulfilmentRequest, FulfilmentRequestFile, Permission, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('fulfilment request entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const fulfilmentRequest = FulfilmentRequest.fromResponse(
      {
        '@odata.etag': 'W/"53050431"',
        defra_status: 910400000,
        defra_name: '2020-04-14T11:14:27.626Z-TKDJ2A',
        defra_requesttimestamp: '2020-04-14T11:14:27Z',
        defra_fulfilmentrequestid: 'ef336a19-417e-ea11-a811-000d3a64905b',
        defra_notes: 'Test notes'
      },
      optionSetData
    )

    const expectedFields = {
      id: 'ef336a19-417e-ea11-a811-000d3a64905b',
      referenceNumber: '2020-04-14T11:14:27.626Z-TKDJ2A',
      requestTimestamp: '2020-04-14T11:14:27Z',
      notes: 'Test notes',
      status: expect.objectContaining({ id: 910400000, label: 'Pending', description: 'Pending' })
    }

    expect(fulfilmentRequest).toBeInstanceOf(FulfilmentRequest)
    expect(fulfilmentRequest).toMatchObject(expect.objectContaining({ etag: 'W/"53050431"', ...expectedFields }))
    expect(fulfilmentRequest.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(fulfilmentRequest.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const permission = new Permission()
    const fulfilmentRequestFile = new FulfilmentRequestFile()

    const fulfilmentRequest = new FulfilmentRequest()
    fulfilmentRequest.referenceNumber = 'TEST'
    fulfilmentRequest.requestTimestamp = '2020-04-14T11:14:27Z'
    fulfilmentRequest.notes = 'Some notes'
    fulfilmentRequest.status = optionSetData.defra_fulfilmentrequeststatus.options['910400001']
    fulfilmentRequest.bindToEntity(FulfilmentRequest.definition.relationships.permission, permission)
    fulfilmentRequest.bindToEntity(FulfilmentRequest.definition.relationships.fulfilmentRequestFile, fulfilmentRequestFile)

    const dynamicsEntity = fulfilmentRequest.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'TEST',
        defra_requesttimestamp: '2020-04-14T11:14:27Z',
        defra_notes: 'Some notes',
        defra_status: 910400001,
        'defra_PermissionId@odata.bind': '$' + permission.uniqueContentId,
        'defra_FulfilmentRequestFileId@odata.bind': '$' + fulfilmentRequestFile.uniqueContentId
      })
    )
  })
})
