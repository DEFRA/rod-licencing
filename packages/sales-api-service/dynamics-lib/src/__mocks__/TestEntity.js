import { BaseEntity, EntityDefinition } from '../entities/base.entity'

export default class TestEntity extends BaseEntity {
  static _definition = new EntityDefinition(() => ({
    localName: 'entityTest',
    dynamicsCollection: 'test',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'idval', type: 'string' },
      strVal: { field: 'strval', type: 'string' },
      intVal: { field: 'intval', type: 'integer' },
      decVal: { field: 'decval', type: 'decimal' },
      boolVal: { field: 'boolval', type: 'boolean' },
      dateVal: { field: 'dateval', type: 'date' },
      dateTimeVal: { field: 'datetimeval', type: 'datetime' },
      optionSetVal: { field: 'optionsetval', type: 'optionset', ref: 'test_globaloption' }
    },
    alternateKey: 'strval',
    relationships: {
      parentTestEntity: { property: 'parent_test_entity', entity: TestEntity, parent: true },
      childTestEntity: { property: 'child_test_entity', entity: TestEntity }
    }
  }))

  /**
   * @returns {EntityDefinition} the definition providing mappings between Dynamics entity and the local entity
   */
  static get definition () {
    return TestEntity._definition
  }

  /**
   * The test strVal field
   * @type {string}
   */
  get strVal () {
    return super._getState('strVal')
  }

  set strVal (strVal) {
    super._setState('strVal', strVal)
  }

  /**
   * The test intVal field
   * @type {number}
   */
  get intVal () {
    return super._getState('intVal')
  }

  set intVal (intVal) {
    super._setState('intVal', intVal)
  }

  /**
   * The test decVal field
   * @type {number}
   */
  get decVal () {
    return super._getState('decVal')
  }

  set decVal (decVal) {
    super._setState('decVal', decVal)
  }

  /**
   * The test boolVal field
   * @type {boolean}
   */
  get boolVal () {
    return super._getState('boolVal')
  }

  set boolVal (boolVal) {
    super._setState('boolVal', boolVal)
  }

  /**
   * The test dateVal field
   * @type {string|Date}
   */
  get dateVal () {
    return super._getState('dateVal')
  }

  set dateVal (dateVal) {
    super._setState('dateVal', dateVal)
  }

  /**
   * The test dateTimeVal field
   * @type {string|Date}
   */
  get dateTimeVal () {
    return super._getState('dateTimeVal')
  }

  set dateTimeVal (dateTimeVal) {
    super._setState('dateTimeVal', dateTimeVal)
  }

  /**
   * The test dateTimeVal field
   * @type {GlobalOptionSetDefinition}
   */
  get optionSetVal () {
    return super._getState('optionSetVal')
  }

  set optionSetVal (optionSetVal) {
    super._setState('optionSetVal', optionSetVal)
  }
}
