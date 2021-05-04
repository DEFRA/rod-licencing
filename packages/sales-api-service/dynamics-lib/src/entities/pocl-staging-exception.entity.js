import { BaseEntity, EntityDefinition } from './base.entity.js'
import { PoclFile } from './pocl-file.entity.js'
import { Permission } from './permission.entity.js'

/**
 * pocl staging exception entity
 * @extends BaseEntity
 */
export class PoclStagingException extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'transactionFileError',
    dynamicsCollection: 'defra_poclfiledataerrors',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_poclfiledataerrorid', type: 'string' },
      name: { field: 'defra_name', type: 'string' },
      description: { field: 'defra_description', type: 'string' },
      json: { field: 'defra_jsonobject', type: 'string' },
      notes: { field: 'defra_notes', type: 'string' },
      type: { field: 'defra_errortype', type: 'optionset', ref: 'defra_poclfiledataerrortype' },
      status: { field: 'defra_status', type: 'optionset', ref: 'defra_poclfiledataerrorstatus' }
    },
    relationships: {
      permission: { property: 'defra_PermissionId', entity: Permission, parent: true },
      poclFile: { property: 'defra_POCLFileId', entity: PoclFile, parent: true }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return PoclStagingException._definition
  }

  /**
   * The name associated with this pocl staging exception
   * @type {string}
   */
  get name () {
    return super._getState('name')
  }

  set name (name) {
    super._setState('name', name)
  }

  /**
   * The description associated with this pocl staging exception
   * @type {string}
   */
  get description () {
    return super._getState('description')
  }

  set description (description) {
    super._setState('description', description)
  }

  /**
   * The json associated with this pocl staging exception
   * @type {number}
   */
  get json () {
    return super._getState('json')
  }

  set json (json) {
    super._setState('json', json)
  }

  /**
   * The notes associated with this pocl staging exception
   * @type {number}
   */
  get notes () {
    return super._getState('notes')
  }

  set notes (notes) {
    super._setState('notes', notes)
  }

  /**
   * The type of pocl staging exception
   * @type {Object<GlobalOptionSetDefinition>}
   */
  get type () {
    return super._getState('type')
  }

  set type (type) {
    super._setState('type', type)
  }

  /**
   * The status of the pocl staging exception
   * @type {GlobalOptionSetDefinition}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }
}
