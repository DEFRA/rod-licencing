import { StagingException } from '../staging-exception.entity.js'
import { retrieveGlobalOptionSets } from '../..'

let optionSetData
describe('staging exception entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })
  it('maps from dynamics', async () => {
    const exception = StagingException.fromResponse(
      {
        '@odata.etag': 'W/"53585134"',
        defra_crmstagingexceptionid: 'b5b24acd-2e83-ea11-a811-000d3a649213',
        defra_name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
        defra_description: 'Example error description',
        defra_jsonobject: '{ "json": "string" }',
        defra_errorjsonobject: '{ "error": "string" }'
      },
      optionSetData
    )

    const expectedFields = {
      id: 'b5b24acd-2e83-ea11-a811-000d3a649213',
      stagingId: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
      description: 'Example error description',
      transactionJson: '{ "json": "string" }',
      exceptionJson: '{ "error": "string" }'
    }

    expect(exception).toBeInstanceOf(StagingException)
    expect(exception).toMatchObject(expect.objectContaining({ etag: 'W/"53585134"', ...expectedFields }))
    expect(exception.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(exception.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const exception = new StagingException()
    exception.stagingId = 'Test Staging Id'
    exception.description = 'Test description'
    exception.transactionJson = '{ "json": "string" }'
    exception.exceptionJson = '{ "error": "string" }'

    const dynamicsEntity = exception.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'Test Staging Id',
        defra_description: 'Test description',
        defra_jsonobject: '{ "json": "string" }',
        defra_errorjsonobject: '{ "error": "string" }'
      })
    )
  })
})
