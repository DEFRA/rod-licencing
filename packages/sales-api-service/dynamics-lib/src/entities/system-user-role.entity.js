import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * SystemUserRole entity
 * @extends BaseEntity
 */
export class SystemUserRole extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'systemUserRole',
    dynamicsCollection: 'systemuserrolescollection',
    mappings: {
      id: { field: 'systemuserroleid', type: 'string' },
      roleId: { field: 'roleid', type: 'string' },
      systemUserId: { field: 'systemuserid', type: 'string' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return SystemUserRole._definition
  }

  /**
   * The role id associated with this user/role mapping
   * @type {string}
   */
  get roleId () {
    return super._getState('roleId')
  }

  set roleId (roleId) {
    super._setState('roleId', roleId)
  }

  /**
   * The system user id associated with this user/role mapping
   * @type {string}
   */
  get systemUserId () {
    return super._getState('systemUserId')
  }

  set systemUserId (systemUserId) {
    super._setState('systemUserId', systemUserId)
  }
}
