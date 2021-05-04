import { PredefinedQuery } from '../predefined-query.js'
import TestEntity from '../../__mocks__/TestEntity.js'

describe('PredefinedQuery', () => {
  const expectedTestEntitySelect = ['idval', 'strval', 'intval', 'decval', 'boolval', 'dateval', 'datetimeval', 'optionsetval']
  const mockTestEntityResponseData = {
    '@odata.etag': 'W/"186695153"',
    idval: 'test-id',
    strval: 'test-string',
    intval: 12345,
    decval: 0.12345,
    boolval: true,
    dateval: '2020-06-04',
    datetimeval: '2020-06-04T15:26:00.000Z',
    optionsetval: 910400001
  }
  const expectedTestEntityFields = expect.objectContaining({
    id: 'test-id',
    strVal: 'test-string',
    intVal: 12345,
    decVal: 0.12345,
    boolVal: true,
    dateVal: '2020-06-04',
    dateTimeVal: '2020-06-04T15:26:00.000Z',
    optionSetVal: expect.objectContaining({
      id: 910400001,
      label: 'test',
      description: 'test'
    })
  })

  const optionSetData = {
    test_globaloption: {
      options: {
        910400001: { id: 910400001, label: 'test', description: 'test' }
      }
    }
  }

  it('builds a query using a filter and no expands', async () => {
    const query = new PredefinedQuery({
      root: TestEntity,
      filter: `${TestEntity.definition.mappings.strVal.field} eq 'Test Value'`
    })

    expect(query.toRetrieveRequest()).toStrictEqual({
      collection: 'test',
      filter: "strval eq 'Test Value'",
      select: expectedTestEntitySelect
    })

    const queryResult = query.fromResponse([mockTestEntityResponseData], optionSetData)
    expect(queryResult).toMatchObject([{ entity: expectedTestEntityFields }])
  })

  it('builds a query using both a filter and expands', async () => {
    const query = new PredefinedQuery({
      root: TestEntity,
      filter: `${TestEntity.definition.mappings.strVal.field} eq 'Test Value'`,
      expand: [TestEntity.definition.relationships.parentTestEntity, TestEntity.definition.relationships.childTestEntity]
    })

    expect(query.toRetrieveRequest()).toStrictEqual({
      collection: 'test',
      filter: "strval eq 'Test Value'",
      select: expectedTestEntitySelect,
      expand: [
        {
          property: 'parent_test_entity'
        },
        {
          property: 'child_test_entity'
        }
      ]
    })

    const queryResult = query.fromResponse(
      [{ ...mockTestEntityResponseData, parent_test_entity: mockTestEntityResponseData, child_test_entity: [mockTestEntityResponseData] }],
      optionSetData
    )

    expect(queryResult).toMatchObject([
      {
        entity: expectedTestEntityFields,
        expanded: {
          parentTestEntity: {
            entity: expectedTestEntityFields
          },
          childTestEntity: [
            {
              entity: expectedTestEntityFields
            }
          ]
        }
      }
    ])
  })
})
