import { BaseEntity, EntityDefinition } from './base.entity.js'
export class TransactionCurrency extends BaseEntity {
  static #definition = new EntityDefinition({
    collection: 'transactioncurrencies',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'transactioncurrencyid', type: 'string' },
      name: { field: 'currencyname', type: 'string' },
      code: { field: 'isocurrencycode', type: 'string' },
      symbol: { field: 'currencysymbol', type: 'string' }
    }
  })

  /** Define mappings between Dynamics entity field and local entity field */
  static get definition () {
    return TransactionCurrency.#definition
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
