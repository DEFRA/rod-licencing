import { PoclStagingException } from '../pocl-staging-exception.entity.js'
import { Permission, retrieveGlobalOptionSets } from '../..'

describe('pocl staging exception entity', () => {
  let optionSetData
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })
  it('maps from dynamics', async () => {
    const exception = PoclStagingException.fromResponse(
      {
        '@odata.etag': 'W/"56351087"',
        defra_poclfiledataerrorid: '91f15d18-0aa4-ea11-a812-000d3a64905b',
        defra_name: 'filename.xml: 983934-34897782-2323',
        defra_description: '{ json: "description" }',
        defra_jsonobject: '{ json: "payload" }',
        defra_notes: 'Notes associated with the error',
        defra_status: 910400000,
        defra_errortype: 910400001
      },
      optionSetData
    )

    const expectedFields = {
      id: '91f15d18-0aa4-ea11-a812-000d3a64905b',
      name: 'filename.xml: 983934-34897782-2323',
      description: '{ json: "description" }',
      json: '{ json: "payload" }',
      notes: 'Notes associated with the error',
      status: expect.objectContaining({ id: 910400000, label: 'Open', description: 'Open' }),
      type: expect.objectContaining({ id: 910400001, label: 'Failure', description: 'Failure' })
    }

    expect(exception).toBeInstanceOf(PoclStagingException)
    expect(exception).toMatchObject(expect.objectContaining({ etag: 'W/"56351087"', ...expectedFields }))
    expect(exception.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(exception.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const exception = new PoclStagingException()
    exception.name = 'filename.xml: 983934-34897782-2323'
    exception.description = '{ json: "description" }'
    exception.json = '{ json: "payload" }'
    exception.notes = 'Notes associated with the error'
    exception.status = optionSetData.defra_poclfiledataerrorstatus.options['910400001']
    exception.type = optionSetData.defra_poclfiledataerrortype.options['910400000']

    // Test permission binding
    const permission = new Permission()
    exception.bindToEntity(PoclStagingException.definition.relationships.permission, permission)
    // Bind to the POCL file via alternate key
    exception.bindToAlternateKey(PoclStagingException.definition.relationships.poclFile, 'filename.xml')

    const dynamicsEntity = exception.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'filename.xml: 983934-34897782-2323',
        defra_description: '{ json: "description" }',
        defra_jsonobject: '{ json: "payload" }',
        defra_notes: 'Notes associated with the error',
        defra_status: 910400001,
        defra_errortype: 910400000,
        'defra_PermissionId@odata.bind': `$${permission.uniqueContentId}`,
        'defra_POCLFileId@odata.bind': "/defra_poclfiles(defra_name='filename.xml')"
      })
    )
  })
})
