import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Staging exception entity
 * @extends BaseEntity
 */
export class StagingException extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'stagingException',
    dynamicsCollection: 'defra_crmstagingexceptions',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_crmstagingexceptionid', type: 'string' },
      stagingId: { field: 'defra_name', type: 'string' },
      description: { field: 'defra_description', type: 'string' },
      transactionJson: { field: 'defra_jsonobject', type: 'string' },
      exceptionJson: { field: 'defra_errorjsonobject', type: 'string' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return StagingException._definition
  }

  /**
   * The staging id associated with staging exception
   * @type {string}
   */
  get stagingId () {
    return super._getState('stagingId')
  }

  set stagingId (stagingId) {
    super._setState('stagingId', stagingId)
  }

  /**
   * The description associated with the staging exception
   * @type {string}
   */
  get description () {
    return super._getState('description')
  }

  set description (description) {
    super._setState('description', description)
  }

  /**
   * The transaction json data associated with the staging exception
   * @type {string}
   */
  get transactionJson () {
    return super._getState('transactionJson')
  }

  set transactionJson (transactionJson) {
    super._setState('transactionJson', transactionJson)
  }

  /**
   * The exception json data associated with the staging exception
   * @type {string}
   */
  get exceptionJson () {
    return super._getState('exceptionJson')
  }

  set exceptionJson (exceptionJson) {
    super._setState('exceptionJson', exceptionJson)
  }
}
