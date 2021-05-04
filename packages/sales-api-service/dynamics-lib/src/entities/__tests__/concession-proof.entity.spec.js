import { Concession, ConcessionProof, Permission, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('concession proof entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const proof = ConcessionProof.fromResponse(
      {
        '@odata.etag': 'W/"53050428"',
        defra_concessionproofid: 'ee336a19-417e-ea11-a811-000d3a64905b',
        defra_referencenumber: 'AB 01 02 03 CD',
        defra_concessionprooftype: 910400001
      },
      optionSetData
    )

    const expectedFields = {
      id: 'ee336a19-417e-ea11-a811-000d3a64905b',
      referenceNumber: 'AB 01 02 03 CD',
      type: expect.objectContaining({ id: 910400001, label: 'National Insurance Number', description: 'National Insurance Number' })
    }

    expect(proof).toBeInstanceOf(ConcessionProof)
    expect(proof).toMatchObject(expect.objectContaining({ etag: 'W/"53050428"', ...expectedFields }))
    expect(proof.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(proof.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    // Mimic a concession to test binding
    const concession = Concession.fromResponse(
      {
        '@odata.etag': 'W/"22638892"',
        defra_name: 'Junior',
        defra_concessionid: '3230c68f-ef65-e611-80dc-c4346bad4004'
      },
      {}
    )
    const permission = new Permission()

    const concessionProof = new ConcessionProof()
    concessionProof.referenceNumber = 'TEST'
    concessionProof.type = optionSetData.defra_concessionproof.options['910400000']
    concessionProof.bindToEntity(ConcessionProof.definition.relationships.permission, permission)
    concessionProof.bindToEntity(ConcessionProof.definition.relationships.concession, concession)

    const dynamicsEntity = concessionProof.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_referencenumber: 'TEST',
        defra_concessionprooftype: 910400000,
        'defra_PermissionId@odata.bind': '$' + permission.uniqueContentId,
        'defra_ConcessionNameId@odata.bind': `/${Concession.definition.dynamicsCollection}(${concession.id})`
      })
    )
  })
})
