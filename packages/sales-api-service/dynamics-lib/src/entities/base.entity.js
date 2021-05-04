import { v4 as uuidv4 } from 'uuid'
import util from 'util'
import Joi from 'joi'
import moment from 'moment'
import pluralize from 'pluralize'
import { escapeODataStringValue } from '../client/util.js'

/**
 * @typedef {Object} GlobalOptionSetDefinition
 * @property {string} id The identifier of the entry
 * @property {string} label The label of the entry
 * @property {string} description The description of the entry
 */

/**
 * Base class for Dynamics entities
 * @class
 * @abstract
 */
export class BaseEntity {
  _etag = null
  _contentId = uuidv4()
  _localState = {}
  _bindings = {}

  constructor () {
    this[util.inspect.custom] = this.toJSON
  }

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    throw new Error('Definition not defined in subclass')
  }

  /**
   * Indicates whether the entity is new (true) or existing (false) based on the presence of an etag
   *
   * @returns {boolean} true if the entity has not been persisted, false otherwise
   */
  isNew () {
    return this._etag === null
  }

  /**
   * the etag of the entity or null if not yet persisted
   * @readonly
   * @returns {string}
   */
  get etag () {
    return this._etag
  }

  /**
   * Retrieve the state of an entity field
   *
   * @param property the field name
   * @returns {*} the value of the field
   * @protected
   */
  _getState (property) {
    return this._localState[property]
  }

  /**
   * Set the state of an entity field
   *
   * @param property the field name
   * @param value the value of the field to set
   * @protected
   */
  _setState (property, value) {
    const mapping = this.constructor.definition.mappings[property]
    if (!mapping) {
      throw new Error('Unrecognised property mapping')
    }
    if (value !== undefined && value !== null) {
      const setOp = {
        string: this._setString,
        integer: this._setInteger,
        decimal: this._setDecimal,
        boolean: this._setBoolean,
        date: this._setDate,
        datetime: this._setDate,
        optionset: this._setOptionSet
      }
      setOp[mapping.type].bind(this)(property, value)
    } else {
      this._localState[property] = value
    }
  }

  /**
   * Set a field value as a string
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setString (property, value) {
    this._localState[property] = String(value)
  }

  /**
   * Set a field value as an integer
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setInteger (property, value) {
    const valueToSet = Number(value)
    if (Number.isNaN(valueToSet) || valueToSet - Math.floor(valueToSet) !== 0) {
      throw new Error('Value is not an integer')
    }
    this._localState[property] = valueToSet
  }

  /**
   * Set a field value as a decimal
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setDecimal (property, value) {
    const valueToSet = Number(value)
    if (Number.isNaN(valueToSet)) {
      throw new Error('Value is not an decimal')
    }
    this._localState[property] = valueToSet
  }

  /**
   * Set a field value as a boolean
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setBoolean (property, value) {
    if (value !== false && value !== true) {
      throw new Error('Value is not an boolean')
    }
    this._localState[property] = value
  }

  /**
   * Set a field value as a date
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setDate (property, value) {
    if (!moment(value).isValid()) {
      throw new Error('Value is not a valid date')
    }
    this._localState[property] = value
  }

  /**
   * Set a field value as a GlobalOptionSetDefinition
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setOptionSet (property, value) {
    if (
      !(
        Object.prototype.hasOwnProperty.call(value, 'id') &&
        Object.prototype.hasOwnProperty.call(value, 'label') &&
        Object.prototype.hasOwnProperty.call(value, 'description')
      )
    ) {
      throw new Error('Value is not a valid GlobalOptionSetDefinition')
    }
    this._localState[property] = value
  }

  /**
   * Serialize an entity property into the format suitable for a Dynamics request
   *
   * @param property the field name
   * @returns {*} the value that is set
   * @protected
   */
  _toSerialized (property) {
    let value = this._localState[property]
    if (value !== undefined && value !== null) {
      const type = this.constructor.definition.mappings[property].type
      if (type === 'date') {
        value = moment(value).format('YYYY-MM-DD')
      } else if (type === 'datetime') {
        value = moment(value)
          .utc()
          .format('YYYY-MM-DDTHH:mm:ss[Z]')
      } else if (type === 'optionset') {
        value = value.id
      }
    }
    return value
  }

  /**
   * Bind this entity to the given target
   *
   * @param {string} property the binding to use including the @odata.bind directive
   * @param {BaseEntity|string} ref the entity instance, or string identifying the entity to bind this entity to
   * @returns {*}
   * @protected
   */
  _bind (property, ref) {
    if (!ref) {
      throw new Error(`Unable to bind ${this.constructor.definition.localCollection}.${property}, to an undefined or null entity`)
    }
    this._bindings[property] = ref
  }

  /**
   * Bind this entity to the given target using the specified relationship
   *
   * @param {Relationship} relationship the relationship to which the entity should be bound
   * @param {BaseEntity} entity the entity which is the target for the relationship
   */
  bindToEntity (relationship, entity) {
    this._bind(`${relationship.property}@odata.bind`, entity)
  }

  /**
   * Bind this entity to the given target using an alternate key property
   *
   * @param {Relationship} relationship the relationship to which the entity should be bound
   * @param {String} key the value of the alternate key field to use to lookup the appropriate entity to bind with
   */
  bindToAlternateKey (relationship, key) {
    this._bind(
      `${relationship.property}@odata.bind`,
      `/${relationship.entity.definition.dynamicsCollection}(${relationship.entity.definition.alternateKey}='${escapeODataStringValue(
        key
      )}')`
    )
  }

  /**
   * a unique (uuid) identifier for this object instance (useful for batch creation requests)
   * @type {string}
   * @readonly
   */
  get uniqueContentId () {
    return this._contentId
  }

  /**
   * the id of the entity
   * @type {string}
   * @readonly
   */
  get id () {
    return this._getState('id')
  }

  /**
   * @returns {String} a json representation of the entity state
   */
  toString () {
    return JSON.stringify(this.toJSON(), null, 2)
  }

  /**
   * @returns {{}} a json representation of the entity state
   */
  toJSON () {
    return this._localState
  }

  /**
   * Convert the entity into the request body to use in a create/update query to the Dynamics ODATA Web API
   * @returns {{}} the JSON structure to use in a create/update query to the Dynamics ODATA Web API
   */
  toRequestBody () {
    return Object.entries(this.constructor.definition.mappings).reduce(
      (acc, [property, { field }]) => {
        const serialized = this._toSerialized(property)
        if (serialized !== undefined) {
          acc[field] = serialized
        }
        return acc
      },
      Object.entries(this._bindings).reduce((acc, [k, v]) => {
        if (v instanceof BaseEntity) {
          acc[k] = v.id ? `/${v.constructor.definition.dynamicsCollection}(${v.id})` : `$${v.uniqueContentId}`
        } else {
          acc[k] = v
        }
        return acc
      }, {})
    )
  }

  /**
   * Convert the entity into the data structure required to persist via dynamics-web-api.
   * @returns {{}} the JSON structure required by dynamics-web-api.
   */
  toPersistRequest () {
    return {
      ...(!this.isNew() && { key: this.id }),
      collection: this.constructor.definition.dynamicsCollection,
      contentId: this.uniqueContentId,
      entity: this.toRequestBody()
    }
  }

  /**
   * Create a new entity using the response from a query to the Dynamics ODATA Web API
   *
   * @param {string} etag the etag of the entity
   * @param {Object} entityData the data returned from Dynamics
   * @param {Object} optionSetData the global option set data used to resolve option set fields
   * @returns {BaseEntity} an instance of a BaseEntity subclass
   */
  static fromResponse ({ '@odata.etag': etag, ...entityData }, optionSetData) {
    const instance = new this.prototype.constructor()
    instance._etag = etag
    instance._localState = Object.entries(this.definition.mappings).reduce((acc, [property, { field, type, ref }]) => {
      let value = entityData[field]
      if (value !== undefined && value !== null) {
        if (type === 'integer' || type === 'decimal') {
          value = Number(value)
        } else if (type === 'optionset') {
          const optionSetEntries = optionSetData[ref]
          if (optionSetEntries) {
            value = optionSetEntries.options[value]
          } else {
            throw new Error(`Unable to find optionset entries for ${ref}`)
          }
        }
      }
      if (value !== undefined) {
        acc[property] = value
      }
      return acc
    }, {})
    return instance
  }
}

/**
 * @typedef {Object} FieldMapping
 * @property {!string} field the name of the field in Dynamics
 * @property {!string} type the data type of the field
 * @property {string} [ref] for the optionset type, defines the referenced optionset name
 */

/**
 * @typedef {Object} Relationship
 * @property {!string} property the property defining the relationship, may be used for binding and for expands
 * @property {typeof BaseEntity} entity the subclass of BaseEntity which is the target of the relationship
 * @property {boolean} parent if true, the target of the relationship is the parent object (and binding to it is allowed)
 */

/**
 * Schema for entity definitions
 *
 * @typedef {Object} MetadataSchema
 * @property {!string} localCollection the local collection name
 * @property {!string} dynamicsCollection the dynamics collection name
 * @property {string} [defaultFilter] the default filter to use when retrieving records
 * @property {string} [alternateKey] the name of the field to use with alternateKey syntax
 * @property {Object.<string, FieldMapping>} mappings the mappings between the local collection fields and the dynamics fields
 * @property {Object.<string, Relationship>} relationships the relationships to other entities
 */
const metadataSchema = Joi.object({
  // Local entity name
  localName: Joi.string()
    .min(1)
    .required(),
  // Dynamics entity collection name
  dynamicsCollection: Joi.string()
    .min(1)
    .required(),
  // Default filter to apply
  defaultFilter: Joi.string(),
  // Mapping definition used by the mapping functions
  mappings: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      field: Joi.string()
        .min(1)
        .required(),
      type: Joi.string()
        .valid('string', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'optionset')
        .required(),
      ref: Joi.when('type', {
        is: 'optionset',
        then: Joi.string()
          .min(1)
          .required(),
        otherwise: Joi.forbidden()
      })
    })
  ),
  relationships: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      property: Joi.string()
        .min(1)
        .required(),
      entity: Joi.function()
        .class()
        .custom(value => {
          if (!(value.prototype instanceof BaseEntity)) {
            throw new Error('Relationship entity must be a subclass of BaseEntity')
          }
          return value
        }),
      parent: Joi.boolean()
    })
  ),
  alternateKey: Joi.string()
    .min(1)
    .optional()
}).required()

/**
 * Definition metadata for an entity
 * @class
 */
export class EntityDefinition {
  /** @type {MetadataSchema} */
  _metadata

  /***
   * Create a new entity definition
   *
   * @param metadataFactory {function: MetadataSchema} the metadata to be associated with the entity
   */
  constructor (metadataFactory) {
    this._metadataFactory = metadataFactory
  }

  /**
   * Lazy initialiser for metadata to avoid circular dependency problems in relationships which reference the target entity
   *
   * @returns {MetadataSchema}
   */
  getMetadata () {
    if (!this._metadata) {
      const metadata = this._metadataFactory()
      const validation = metadataSchema.validate(metadata)
      if (validation.error) {
        throw validation.error
      }
      const localCollection = pluralize(metadata.localName)
      const fields = Object.values(metadata.mappings)
        .map(({ field }) => field)
        .filter(field => !field.includes('@'))

      this._metadata = { ...metadata, localCollection, fields }
    }
    return this._metadata
  }

  /**
   * @returns {!string} the entity name used locally
   */
  get localName () {
    return this.getMetadata().localName
  }

  /**
   * @returns {!string} the entity collection name used locally
   */
  get localCollection () {
    return this.getMetadata().localCollection
  }

  /**
   * @returns {!string} the entity collection name used by dynamics
   */
  get dynamicsCollection () {
    return this.getMetadata().dynamicsCollection
  }

  /**
   * @returns {string} the default filter string used in any request to dynamics
   */
  get defaultFilter () {
    return this.getMetadata().defaultFilter
  }

  /**
   * @returns {Object.<string, FieldMapping>} the field mappings used to map between the dynamics entity and the local entity
   */
  get mappings () {
    return this.getMetadata().mappings
  }

  /**
   * @returns {Object.<string, Relationship>} the relationships to other entities
   */
  get relationships () {
    return this.getMetadata().relationships
  }

  /**
   * @returns {Object} the alternate key for the entity (if supported)
   */
  get alternateKey () {
    return this.getMetadata().alternateKey
  }

  /**
   * @returns {Array<String>} the fields used to populate the select statement in any retrieve request to dynamics
   */
  get select () {
    return this.getMetadata().fields
  }

  /**
   * Builds a request object to be used with the the dynamics-web-api package
   * as per {@link https://www.npmjs.com/package/dynamics-web-api#advanced-using-request-object-4}
   *
   * @param filterString an optional filter string to use, otherwise defaults to the defaultFilter configured for the entity
   * @returns {{filter: string?, select: Array<String>, collection: !string}}
   */
  toRetrieveRequest (filterString = this.defaultFilter) {
    return {
      collection: this.dynamicsCollection,
      select: this.select,
      ...(filterString && { filter: filterString })
    }
  }
}
