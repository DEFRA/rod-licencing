import { BaseEntity, EntityDefinition } from './base.entity.js'
import { Permission } from './permission.entity.js'
import { FulfilmentRequestFile } from './fulfilment-request-file.entity.js'

/**
 * Fulfilment requests entity
 * @extends BaseEntity
 */
export class FulfilmentRequest extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'fulfilmentRequest',
    dynamicsCollection: 'defra_fulfilmentrequests',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_fulfilmentrequestid', type: 'string' },
      referenceNumber: { field: 'defra_name', type: 'string' },
      requestTimestamp: { field: 'defra_requesttimestamp', type: 'datetime' },
      notes: { field: 'defra_notes', type: 'string' },
      status: { field: 'defra_status', type: 'optionset', ref: 'defra_fulfilmentrequeststatus' }
    },
    relationships: {
      permission: { property: 'defra_PermissionId', entity: Permission, parent: true },
      fulfilmentRequestFile: { property: 'defra_FulfilmentRequestFileId', entity: FulfilmentRequestFile, parent: true }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return FulfilmentRequest._definition
  }

  /**
   * The reference number associated with the fulfilment request
   * @type {string}
   */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /**
   * The timestamp of the fulfilment request
   * @type {date|string}
   */
  get requestTimestamp () {
    return super._getState('requestTimestamp')
  }

  set requestTimestamp (requestTimestamp) {
    super._setState('requestTimestamp', requestTimestamp)
  }

  /**
   * Any notes associated with the fulfilment request
   * @type {string}
   */
  get notes () {
    return super._getState('notes')
  }

  set notes (notes) {
    super._setState('notes', notes)
  }

  /**
   * The status of the fulfilment request
   * @type {GlobalOptionSetDefinition}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }
}
