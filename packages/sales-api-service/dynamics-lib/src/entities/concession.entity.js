import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Concessions entity
 * @extends BaseEntity
 */
export class Concession extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'concession',
    dynamicsCollection: 'defra_concessions',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_concessionid', type: 'string' },
      name: { field: 'defra_name', type: 'string' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return Concession._definition
  }

  /**
   * The name of the concession
   *
   * @type {string}
   * @readonly
   */
  get name () {
    return super._getState('name')
  }
}
