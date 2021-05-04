import { BaseEntity, EntityDefinition } from './base.entity.js'
import { Concession } from './concession.entity.js'
import { Permission } from './permission.entity.js'

/**
 * Concession proofs entity
 * @extends BaseEntity
 */
export class ConcessionProof extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'concessionProof',
    dynamicsCollection: 'defra_concessionproofs',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_concessionproofid', type: 'string' },
      referenceNumber: { field: 'defra_referencenumber', type: 'string' },
      type: { field: 'defra_concessionprooftype', type: 'optionset', ref: 'defra_concessionproof' }
    },
    relationships: {
      permission: { property: 'defra_PermissionId', entity: Permission, parent: true },
      concession: { property: 'defra_ConcessionNameId', entity: Concession, parent: true }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return ConcessionProof._definition
  }

  /**
   * The reference number associated with the concession proof (e.g. blue badge number, NI number)
   * @type {string}
   */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /**
   * The type of the concession proof
   * @type {GlobalOptionSetDefinition}
   */
  get type () {
    return super._getState('type')
  }

  set type (type) {
    super._setState('type', type)
  }
}
