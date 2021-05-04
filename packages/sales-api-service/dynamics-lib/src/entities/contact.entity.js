import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * @class
 * @classdesc The contact entity
 * @extends BaseEntity
 */
export class Contact extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'contact',
    dynamicsCollection: 'contacts',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'contactid', type: 'string' },
      firstName: { field: 'firstname', type: 'string' },
      lastName: { field: 'lastname', type: 'string' },
      birthDate: { field: 'birthdate', type: 'date' },
      email: { field: 'emailaddress1', type: 'string' },
      mobilePhone: { field: 'mobilephone', type: 'string' },
      organisation: { field: 'defra_organisation', type: 'string' },
      premises: { field: 'defra_premises', type: 'string' },
      street: { field: 'defra_street', type: 'string' },
      locality: { field: 'defra_locality', type: 'string' },
      town: { field: 'defra_town', type: 'string' },
      postcode: { field: 'defra_postcode', type: 'string' },
      country: { field: 'defra_country', type: 'optionset', ref: 'defra_country' },
      preferredMethodOfConfirmation: {
        field: 'defra_preferredmethodofconfirmation',
        type: 'optionset',
        ref: 'defra_preferredcontactmethod'
      },
      preferredMethodOfNewsletter: { field: 'defra_preferredmethodofnewsletter', type: 'optionset', ref: 'defra_preferredcontactmethod' },
      preferredMethodOfReminder: { field: 'defra_preferredmethodofreminder', type: 'optionset', ref: 'defra_preferredcontactmethod' },
      postalFulfilment: { field: 'defra_postalfulfilment', type: 'boolean' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return Contact._definition
  }

  /**
   * The first name of the contact
   *
   * @type {string}
   */
  get firstName () {
    return super._getState('firstName')
  }

  set firstName (firstName) {
    super._setState('firstName', firstName)
  }

  /**
   * The last name of the contact
   * @type {string}
   */
  get lastName () {
    return super._getState('lastName')
  }

  set lastName (lastName) {
    super._setState('lastName', lastName)
  }

  /**
   * The date of birth for the contact
   * @type {string|Date}
   */
  get birthDate () {
    return super._getState('birthDate')
  }

  set birthDate (birthDate) {
    super._setState('birthDate', birthDate)
  }

  /**
   * The email address for the contact
   * @type {string}
   */
  get email () {
    return super._getState('email')
  }

  set email (email) {
    super._setState('email', email)
  }

  /**
   * The mobile phone number for the contact
   * @type {string}
   */
  get mobilePhone () {
    return super._getState('mobilePhone')
  }

  set mobilePhone (mobilePhone) {
    super._setState('mobilePhone', mobilePhone)
  }

  /**
   * The organisation field of the address for the contact
   * @type {string}
   */
  get organisation () {
    return super._getState('organisation')
  }

  set organisation (organisation) {
    super._setState('organisation', organisation)
  }

  /**
   * The premises field of the address for the contact
   * @type {string}
   */
  get premises () {
    return super._getState('premises')
  }

  set premises (premises) {
    super._setState('premises', premises)
  }

  /**
   * The street field of the address for the contact
   * @type {string}
   */
  get street () {
    return super._getState('street')
  }

  set street (street) {
    super._setState('street', street)
  }

  /**
   * The locality field of the address for the contact
   * @type {string}
   */
  get locality () {
    return super._getState('locality')
  }

  set locality (locality) {
    super._setState('locality', locality)
  }

  /**
   * The town field of the address for the contact
   * @type {string}
   */
  get town () {
    return super._getState('town')
  }

  set town (town) {
    super._setState('town', town)
  }

  /**
   * The postcode field of the address for the contact
   * @type {string}
   */
  get postcode () {
    return super._getState('postcode')
  }

  set postcode (postcode) {
    super._setState('postcode', postcode)
  }

  /**
   * The country field of the address for the contact
   * @type {GlobalOptionSetDefinition}
   */
  get country () {
    return super._getState('country')
  }

  set country (country) {
    super._setState('country', country)
  }

  /**
   * The preferred method of confirmation communications of the contact
   * @type {GlobalOptionSetDefinition}
   */
  get preferredMethodOfConfirmation () {
    return super._getState('preferredMethodOfConfirmation')
  }

  set preferredMethodOfConfirmation (preferredMethodOfConfirmation) {
    super._setState('preferredMethodOfConfirmation', preferredMethodOfConfirmation)
  }

  /**
   * The preferred method of newsletter communications of the contact
   * @type {GlobalOptionSetDefinition}
   */
  get preferredMethodOfNewsletter () {
    return super._getState('preferredMethodOfNewsletter')
  }

  set preferredMethodOfNewsletter (preferredMethodOfNewsletter) {
    super._setState('preferredMethodOfNewsletter', preferredMethodOfNewsletter)
  }

  /**
   * The preferred method to receive reminder communications
   * @type {GlobalOptionSetDefinition}
   */
  get preferredMethodOfReminder () {
    return super._getState('preferredMethodOfReminder')
  }

  set preferredMethodOfReminder (preferredMethodOfReminder) {
    super._setState('preferredMethodOfReminder', preferredMethodOfReminder)
  }

  /**
   * Whether the user has requested a licence by post
   * @type {GlobalOptionSetDefinition}
   */
  get postalFulfilment () {
    return super._getState('postalFulfilment')
  }

  set postalFulfilment (postalFulfilment) {
    super._setState('postalFulfilment', postalFulfilment)
  }
}
