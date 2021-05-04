import { BaseEntity, EntityDefinition } from './base.entity.js'
import { Contact } from './contact.entity.js'
import { Permit } from './permit.entity.js'
import { RecurringPayment } from './recurring-payment.entity.js'

/**
 * Recurring payment instruction entity
 * @extends BaseEntity
 */
export class RecurringPaymentInstruction extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'recurringPaymentInstruction',
    dynamicsCollection: 'defra_recurringpaymentinstructions',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_recurringpaymentinstructionid', type: 'string' }
    },
    relationships: {
      recurringPayment: { property: 'defra_RecurringPayment', entity: RecurringPayment, parent: true },
      licensee: { property: 'defra_Contact', entity: Contact, parent: true },
      permit: { property: 'defra_Permit', entity: Permit, parent: true }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return RecurringPaymentInstruction._definition
  }
}
