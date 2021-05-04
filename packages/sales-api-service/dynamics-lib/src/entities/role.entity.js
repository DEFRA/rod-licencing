import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Role entity
 * @extends BaseEntity
 */
export class Role extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'role',
    dynamicsCollection: 'roles',
    mappings: {
      id: { field: 'roleid', type: 'string' },
      name: { field: 'name', type: 'string' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return Role._definition
  }

  /**
   * The name of the role
   * @type {string}
   */
  get name () {
    return super._getState('name')
  }

  set name (name) {
    super._setState('name', name)
  }
}
