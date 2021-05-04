import { BaseEntity, EntityDefinition } from './base.entity.js'
import { PoclFile } from './pocl-file.entity.js'
import { TransactionCurrency } from './transaction-currency.entity.js'

/**
 * Transaction entity
 * @extends BaseEntity
 */
export class Transaction extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'transaction',
    dynamicsCollection: 'defra_transactions',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_transactionid', type: 'string' },
      referenceNumber: { field: 'defra_name', type: 'string' },
      description: { field: 'defra_description', type: 'string' },
      channelId: { field: 'defra_fadcode', type: 'string' },
      timestamp: { field: 'defra_timestamp', type: 'datetime' },
      paymentType: { field: 'defra_paymenttype', type: 'optionset', ref: 'defra_paymenttype' },
      source: { field: 'defra_transactionsource', type: 'optionset', ref: 'defra_financialtransactionsource' },
      total: { field: 'defra_total', type: 'decimal' }
    },
    relationships: {
      poclFile: { property: 'defra_POCLFile', entity: PoclFile, parent: true },
      transactionCurrency: { property: 'transactioncurrencyid', entity: TransactionCurrency, parent: true }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return Transaction._definition
  }

  /**
   * The reference number associated with the transaction
   * @type {string}
   */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /**
   * The channel identifier / fadcode associated with the transaction
   * @type {string}
   */
  get channelId () {
    return super._getState('channelId')
  }

  set channelId (channelId) {
    super._setState('channelId', channelId)
  }

  /**
   * The description associated with the transaction
   * @type {string}
   */
  get description () {
    return super._getState('description')
  }

  set description (description) {
    super._setState('description', description)
  }

  /**
   * The timestamp associated with the transaction
   * @type {string}
   */
  get timestamp () {
    return super._getState('timestamp')
  }

  set timestamp (timestamp) {
    super._setState('timestamp', timestamp)
  }

  /**
   * The payment type for the transaction
   * @type {Object<GlobalOptionSetDefinition>}
   */
  get paymentType () {
    return super._getState('paymentType')
  }

  set paymentType (paymentType) {
    super._setState('paymentType', paymentType)
  }

  /**
   * The source of the transaction
   * @type {Object<GlobalOptionSetDefinition>}
   */
  get source () {
    return super._getState('source')
  }

  set source (source) {
    super._setState('source', source)
  }

  /**
   * The total value of the transaction
   * @type {string}
   */
  get total () {
    return super._getState('total')
  }

  set total (total) {
    super._setState('total', total)
  }
}
