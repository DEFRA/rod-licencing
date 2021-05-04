import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * TransactionCurrency entity
 * @extends BaseEntity
 */
export class TransactionCurrency extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'transactionCurrency',
    dynamicsCollection: 'transactioncurrencies',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'transactioncurrencyid', type: 'string' },
      name: { field: 'currencyname', type: 'string' },
      code: { field: 'isocurrencycode', type: 'string' },
      symbol: { field: 'currencysymbol', type: 'string' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return TransactionCurrency._definition
  }

  /** get the name of the entity */
  get name () {
    return super._getState('name')
  }

  /** get the code of the entity */
  get code () {
    return super._getState('code')
  }

  /** get the symbol of the entity */
  get symbol () {
    return super._getState('symbol')
  }
}
