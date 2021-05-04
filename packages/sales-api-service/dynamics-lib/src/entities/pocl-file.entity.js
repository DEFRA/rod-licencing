import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * pocl file entity
 * @extends BaseEntity
 */
export class PoclFile extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'poclFile',
    dynamicsCollection: 'defra_poclfiles',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_poclfileid', type: 'string' },
      fileName: { field: 'defra_name', type: 'string' },
      fileSize: { field: 'defra_filesize', type: 'string' },
      totalCount: { field: 'defra_numberofsales', type: 'integer' },
      successCount: { field: 'defra_numberofsuccessfulrecords', type: 'integer' },
      errorCount: { field: 'defra_numberoferrors', type: 'integer' },
      notes: { field: 'defra_notes', type: 'string' },
      salesDate: { field: 'defra_salesdate', type: 'datetime' },
      receiptTimestamp: { field: 'defra_receipttimestamp', type: 'datetime' },
      dataSource: { field: 'defra_datasource', type: 'optionset', ref: 'defra_datasource' },
      status: { field: 'defra_status', type: 'optionset', ref: 'defra_poclfilestatus' }
    },
    alternateKey: 'defra_name'
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return PoclFile._definition
  }

  /**
   * The filename of this pocl file
   * @type {string}
   */
  get fileName () {
    return super._getState('fileName')
  }

  set fileName (fileName) {
    super._setState('fileName', fileName)
  }

  /**
   * The filename of this pocl file
   * @type {string}
   */
  get fileSize () {
    return super._getState('fileSize')
  }

  set fileSize (fileName) {
    super._setState('fileSize', fileName)
  }

  /**
   * The total count of records associated with this pocl file
   * @type {number}
   */
  get totalCount () {
    return super._getState('totalCount')
  }

  set totalCount (totalCount) {
    super._setState('totalCount', totalCount)
  }

  /**
   * The total count of successfully processed records associated with this pocl file
   * @type {number}
   */
  get successCount () {
    return super._getState('successCount')
  }

  set successCount (successCount) {
    super._setState('successCount', successCount)
  }

  /**
   * The total count of records which resulted in a processing error associated with this pocl file
   * @type {number}
   */
  get errorCount () {
    return super._getState('errorCount')
  }

  set errorCount (errorCount) {
    super._setState('errorCount', errorCount)
  }

  /**
   * Any notes associated with the pocl file
   * @type {string}
   */
  get notes () {
    return super._getState('notes')
  }

  set notes (notes) {
    super._setState('notes', notes)
  }

  /**
   * The date which the pocl file pertains to
   * @type {date|string}
   */
  get salesDate () {
    return super._getState('salesDate')
  }

  set salesDate (salesDate) {
    super._setState('salesDate', salesDate)
  }

  /**
   * The timestamp at which the pocl file was received
   * @type {date|string}
   */
  get receiptTimestamp () {
    return super._getState('receiptTimestamp')
  }

  set receiptTimestamp (receiptTimestamp) {
    super._setState('receiptTimestamp', receiptTimestamp)
  }

  /**
   * The data source associated with the pocl file
   * @type {Object<GlobalOptionSetDefinition>}
   */
  get dataSource () {
    return super._getState('dataSource')
  }

  set dataSource (dataSource) {
    super._setState('dataSource', dataSource)
  }

  /**
   * The status of the pocl file
   * @type {GlobalOptionSetDefinition}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }
}
