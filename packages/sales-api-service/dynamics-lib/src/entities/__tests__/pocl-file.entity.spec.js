import { PoclFile, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('pocl file entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const poclFile = PoclFile.fromResponse(
      {
        '@odata.etag': 'W/"40324890"',
        defra_poclfileid: '5dec0427-e22b-ea11-a810-000d3a64905b',
        defra_name: 'EAF1NewLicence2019123119738.xml',
        defra_filesize: '79.92KB',
        defra_numberofsales: 50,
        defra_numberofsuccessfulrecords: 50,
        defra_numberoferrors: 0,
        defra_notes: 'Test notes',
        defra_salesdate: '2019-12-30T14:58:00Z',
        defra_receipttimestamp: '2019-12-31T15:28:41Z',
        defra_datasource: 910400000,
        defra_status: 910400002
      },
      optionSetData
    )

    const expectedFields = {
      id: '5dec0427-e22b-ea11-a810-000d3a64905b',
      fileName: 'EAF1NewLicence2019123119738.xml',
      fileSize: '79.92KB',
      totalCount: 50,
      successCount: 50,
      errorCount: 0,
      notes: 'Test notes',
      salesDate: '2019-12-30T14:58:00Z',
      receiptTimestamp: '2019-12-31T15:28:41Z',
      dataSource: expect.objectContaining({ id: 910400000, label: 'Post Office Sales', description: 'Post Office Sales' }),
      status: expect.objectContaining({ id: 910400002, label: 'Processed', description: 'Processed' })
    }

    expect(poclFile).toBeInstanceOf(PoclFile)
    expect(poclFile).toMatchObject(expect.objectContaining({ etag: 'W/"40324890"', ...expectedFields }))
    expect(poclFile.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(poclFile.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const poclFile = new PoclFile()
    poclFile.fileName = 'EAF1NewLicence2019123119738.xml'
    poclFile.fileSize = '79.92KB'
    poclFile.totalCount = 50
    poclFile.successCount = 50
    poclFile.errorCount = 0
    poclFile.notes = 'Test notes'
    poclFile.salesDate = '2019-12-30T14:58:00Z'
    poclFile.receiptTimestamp = '2019-12-31T15:28:41Z'
    poclFile.dataSource = optionSetData.defra_datasource.options['910400000']
    poclFile.status = optionSetData.defra_poclfilestatus.options['910400002']

    const dynamicsEntity = poclFile.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'EAF1NewLicence2019123119738.xml',
        defra_filesize: '79.92KB',
        defra_numberofsales: 50,
        defra_numberofsuccessfulrecords: 50,
        defra_numberoferrors: 0,
        defra_notes: 'Test notes',
        defra_salesdate: '2019-12-30T14:58:00Z',
        defra_receipttimestamp: '2019-12-31T15:28:41Z',
        defra_datasource: 910400000,
        defra_status: 910400002
      })
    )
  })
})
