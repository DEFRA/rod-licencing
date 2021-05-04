import { BaseEntity, EntityDefinition } from '../base.entity'
import TestEntity from '../../__mocks__/TestEntity.js'

describe('BaseEntity', () => {
  const runTestTypeConversion = (propertyName, value, expected = value, expectedSerialized = expected) => {
    const test = new TestEntity()
    test._setState(propertyName, value)
    expect(test._getState(propertyName)).toEqual(expected)
    expect(test._toSerialized(propertyName)).toEqual(expectedSerialized)
  }

  it('requires subclasses to define a mapping', () => {
    class BadClass extends BaseEntity {}
    const badClassInstance = new BadClass()
    expect(() => badClassInstance.toRequestBody()).toThrow('Definition not defined in subclass')
  })

  it('throws an error if an undefined mapping is used', () => {
    const test = new TestEntity()
    expect(() => test._setState('unknown', 'some string')).toThrow('Unrecognised property mapping')
  })

  it('allows null or undefined to be set for all properties', () => {
    runTestTypeConversion('strVal', undefined)
    runTestTypeConversion('intVal', undefined)
    runTestTypeConversion('decVal', undefined)
    runTestTypeConversion('dateVal', undefined)
    runTestTypeConversion('dateTimeVal', undefined)
    runTestTypeConversion('optionSetVal', undefined)

    runTestTypeConversion('strVal', null)
    runTestTypeConversion('intVal', null)
    runTestTypeConversion('decVal', null)
    runTestTypeConversion('dateVal', null)
    runTestTypeConversion('dateTimeVal', null)
    runTestTypeConversion('optionSetVal', null)
  })

  it('coerces to a string for string properties', () => {
    runTestTypeConversion('strVal', 'a string')
    runTestTypeConversion('strVal', 123, '123')
  })

  it('expects an integer when a property is mapped to type=integer', () => {
    runTestTypeConversion('intVal', 123)
    runTestTypeConversion('intVal', '123', 123)
    const test = new TestEntity()
    expect(() => test._setState('intVal', 'some string')).toThrow('Value is not an integer')
    expect(() => test._setState('intVal', 123.45)).toThrow('Value is not an integer')
  })

  it('expects a decimal when a property is mapped to type=decimal', () => {
    runTestTypeConversion('decVal', 123)
    runTestTypeConversion('decVal', '123', 123)
    runTestTypeConversion('decVal', 123.45)
    runTestTypeConversion('decVal', '123.45', 123.45)
    const test = new TestEntity()
    expect(() => test._setState('decVal', 'some string')).toThrow('Value is not an decimal')
  })

  it('expects a boolean when a property is mapped to type=boolean', () => {
    runTestTypeConversion('boolVal', true)
    runTestTypeConversion('boolVal', false)
    const test = new TestEntity()
    expect(() => test._setState('boolVal', 'some string')).toThrow('Value is not an boolean')
  })

  it('uses a short date when type=date', () => {
    const testDate = new Date('2020-01-01T01:02:03')
    runTestTypeConversion('dateVal', testDate, testDate, '2020-01-01')
    runTestTypeConversion('dateVal', '2020-01-01T01:02:03', '2020-01-01T01:02:03', '2020-01-01')
    const test = new TestEntity()
    // Moment outputs a warning if an invalid string is given to the constructor
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => test._setState('dateVal', 'some string')).toThrow('Value is not a valid date')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('uses a long date when type=datetime', () => {
    const testDate = new Date('2020-01-01T01:02:03Z')
    runTestTypeConversion('dateTimeVal', testDate, testDate, '2020-01-01T01:02:03Z')
    runTestTypeConversion('dateTimeVal', '2020-01-01T01:02:03', '2020-01-01T01:02:03', '2020-01-01T01:02:03Z')
    const test = new TestEntity()
    // Moment outputs a warning if an invalid string is given to the constructor
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => test._setState('dateTimeVal', 'some string')).toThrow('Value is not a valid date')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('uses utc with a long date when type=datetime', () => {
    const testDate = new Date('2020-01-01T01:02:03+0100')
    runTestTypeConversion('dateTimeVal', testDate, testDate, '2020-01-01T00:02:03Z')
    runTestTypeConversion('dateTimeVal', '2020-01-01T01:02:03+0100', '2020-01-01T01:02:03+0100', '2020-01-01T00:02:03Z')
  })

  it('validates global option set references when type=optionset', () => {
    const testGlobalOptionSet = { id: 910400000, label: 'test', description: 'test' }
    runTestTypeConversion('optionSetVal', testGlobalOptionSet, testGlobalOptionSet, 910400000)

    const test = new TestEntity()
    expect(() => test._setState('optionSetVal', 'wrong type')).toThrow('Value is not a valid GlobalOptionSetDefinition')
  })

  it('throws an error if an optionset cannot be resolved in a server response', () => {
    expect(() =>
      TestEntity.fromResponse(
        {
          '@odata.etag': 'W/"22639016"',
          strval: null,
          optionsetval: 12345456
        },
        {}
      )
    ).toThrow('Unable to find optionset entries for test_globaloption')
  })

  it('throws an error if attempting to bind to a null entity', () => {
    expect(() => {
      const t = new TestEntity()
      t._bind('any', null)
    }).toThrow()
  })
})

describe('EntityDefinition', () => {
  const exampleDefinitionData = {
    localName: 'example',
    dynamicsCollection: 'example_remote',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: {
        field: 'idval',
        type: 'string'
      },
      strVal: {
        field: 'strval',
        type: 'string'
      }
    },
    alternateKey: 'strval',
    relationships: {
      test: { property: 'relatedEntity', entity: TestEntity, parent: true }
    }
  }

  it('exposes properties used by the entity manager', () => {
    const definition = new EntityDefinition(() => exampleDefinitionData)
    expect(definition.select).toStrictEqual(['idval', 'strval'])
    expect(definition.localName).toStrictEqual('example')
    expect(definition.localCollection).toStrictEqual('examples')
    expect(definition.dynamicsCollection).toStrictEqual('example_remote')
    expect(definition.defaultFilter).toStrictEqual('statecode eq 0')
    expect(definition.mappings).toBeInstanceOf(Object)
    expect(definition.alternateKey).toStrictEqual('strval')
    expect(definition.relationships).toStrictEqual({ test: { property: 'relatedEntity', entity: TestEntity, parent: true } })
  })

  it('requires a subclass of BaseEntity to be supplied in a relationship definition', () => {
    class NotASubclassOfBaseEntity {}
    const entityDefinition = new EntityDefinition(() => ({
      ...exampleDefinitionData,
      ...{ relationships: { test: { property: 'example', entity: NotASubclassOfBaseEntity } } }
    }))

    const expectedError =
      '"relationships.test.entity" failed custom validation because Relationship entity must be a subclass of BaseEntity'
    expect(() => entityDefinition.select).toThrow(expectedError)
    expect(() => entityDefinition.localName).toThrow(expectedError)
    expect(() => entityDefinition.localCollection).toThrow(expectedError)
    expect(() => entityDefinition.dynamicsCollection).toThrow(expectedError)
    expect(() => entityDefinition.defaultFilter).toThrow(expectedError)
    expect(() => entityDefinition.mappings).toThrow(expectedError)
    expect(() => entityDefinition.alternateKey).toThrow(expectedError)
    expect(() => entityDefinition.relationships).toThrow(expectedError)
  })

  it('requires a valid entity definition', () => {
    const entityDefinition = new EntityDefinition(() => ({}))
    expect(() => entityDefinition.localName).toThrow('"localName" is required')
  })
})
