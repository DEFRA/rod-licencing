import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * SystemUser entity
 * @extends BaseEntity
 */
export class SystemUser extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'systemUser',
    dynamicsCollection: 'systemusers',
    mappings: {
      id: { field: 'systemuserid', type: 'string' },
      oid: { field: 'azureactivedirectoryobjectid', type: 'string' },
      firstName: { field: 'firstname', type: 'string' },
      lastName: { field: 'lastname', type: 'string' },
      isDisabled: { field: 'isdisabled', type: 'boolean' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return SystemUser._definition
  }

  /**
   * The azure object id of the system user
   * @type {string}
   */
  get oid () {
    return super._getState('oid')
  }

  set oid (oid) {
    super._setState('oid', oid)
  }

  /**
   * The first name of the system user
   *
   * @type {string}
   */
  get firstName () {
    return super._getState('firstName')
  }

  set firstName (firstName) {
    super._setState('firstName', firstName)
  }

  /**
   * The last name of the system user
   * @type {string}
   */
  get lastName () {
    return super._getState('lastName')
  }

  set lastName (lastName) {
    super._setState('lastName', lastName)
  }

  /**
   * Whether this system user is disabled
   * @type {boolean}
   */
  get isDisabled () {
    return super._getState('isDisabled')
  }

  set isDisabled (isDisabled) {
    super._setState('isDisabled', isDisabled)
  }
}
