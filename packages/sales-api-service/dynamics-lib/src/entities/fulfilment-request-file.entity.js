import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Fulfilment request file entity
 * @extends BaseEntity
 */
export class FulfilmentRequestFile extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'fulfilmentRequestFile',
    dynamicsCollection: 'defra_fulfilmentrequestfiles',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_fulfilmentrequestfileid', type: 'string' },
      fileName: { field: 'defra_name', type: 'string' },
      numberOfRequests: { field: 'defra_numberoffulfilmentrequests', type: 'integer' },
      notes: { field: 'defra_notes', type: 'string' },
      date: { field: 'defra_date', type: 'datetime' },
      deliveryTimestamp: { field: 'defra_deliverytimestamp', type: 'datetime' },
      status: { field: 'defra_status', type: 'optionset', ref: 'defra_fulfilmentrequestfilestatus' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return FulfilmentRequestFile._definition
  }

  /**
   * The filename of this fulfilment request file
   * @type {string}
   */
  get fileName () {
    return super._getState('fileName')
  }

  set fileName (fileName) {
    super._setState('fileName', fileName)
  }

  /**
   * The number of fulfilment requests associated with this fulfilment request file
   * @type {number}
   */
  get numberOfRequests () {
    return super._getState('numberOfRequests')
  }

  set numberOfRequests (numberOfRequests) {
    super._setState('numberOfRequests', numberOfRequests)
  }

  /**
   * Any notes associated with the fulfilment request file
   * @type {string}
   */
  get notes () {
    return super._getState('notes')
  }

  set notes (notes) {
    super._setState('notes', notes)
  }

  /**
   * The date which the fulfilment request file pertains to
   * @type {date|string}
   */
  get date () {
    return super._getState('date')
  }

  set date (date) {
    super._setState('date', date)
  }

  /**
   * The timestamp at which the fulfilment request file was delivered to the fulfilment provider
   * @type {date|string}
   */
  get deliveryTimestamp () {
    return super._getState('deliveryTimestamp')
  }

  set deliveryTimestamp (deliveryTimestamp) {
    super._setState('deliveryTimestamp', deliveryTimestamp)
  }

  /**
   * The status of the fulfilment request file
   * @type {GlobalOptionSetDefinition}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }
}
