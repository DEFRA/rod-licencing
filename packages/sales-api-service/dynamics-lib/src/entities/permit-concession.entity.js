import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * PermitConcession entity
 * @extends BaseEntity
 */
export class PermitConcession extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'permitConcession',
    dynamicsCollection: 'defra_defra_concession_defra_permitset',
    defaultFilter: undefined,
    mappings: {
      id: { field: 'defra_defra_concession_defra_permitid', type: 'string' },
      concessionId: { field: 'defra_concessionid', type: 'string' },
      permitId: { field: 'defra_permitid', type: 'string' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return PermitConcession._definition
  }

  /**
   * The ID of the {@link Concession} associated with this mapping
   * @type {string}
   * @readonly
   */
  get concessionId () {
    return super._getState('concessionId')
  }

  /**
   * The ID of the {@link Permit} associated with this mapping
   * @type {string}
   * @readonly
   */
  get permitId () {
    return super._getState('permitId')
  }
}
