import {
  getGlobalOptionSetValue,
  getReferenceDataForEntity,
  getReferenceDataForEntityAndId
} from '../../services/reference-data.service.js'
import { findById, findByAlternateKey, PermitConcession, CacheableOperation } from '@defra-fish/dynamics-lib'
import Joi from 'joi'

export function buildJoiOptionSetValidator (optionSetName, exampleValue) {
  return Joi.string()
    .trim()
    .required()
    .external(createOptionSetValidator(optionSetName))
    .description(`See ${optionSetName} option-set for available options`)
    .example(exampleValue)
}

export function createOptionSetValidator (optionSetName) {
  return async value => {
    if (value) {
      const option = await getGlobalOptionSetValue(optionSetName, value)
      if (!option) {
        throw new Error(`Value provided is not a recognised ${optionSetName}`)
      }
    }
    return undefined
  }
}

export function createReferenceDataEntityValidator (entityType) {
  return async value => {
    if (value) {
      const entity = await getReferenceDataForEntityAndId(entityType, value)
      if (!entity) {
        throw new Error(`Unrecognised ${entityType.definition.localName} identifier`)
      }
    }
    return undefined
  }
}

/**
 * Create a validator which checks if an entity exists using a primary key lookup
 *
 * @param {typeof BaseEntity} entityType the type of entity to check
 * @param {boolean|number} [cache] if falsy, do not cache the result.  a positive numeric value specifies the time to cache the validation result
 * @param {boolean} [negate] if true then validates that the entity does not exist, defaults to false
 * @returns {function: Promise<>}
 */
export function createEntityIdValidator (entityType, { cache, negate } = { cache: false, negate: false }) {
  return async value => {
    if (value) {
      const check = new CacheableOperation(
        `createEntityIdValidator-${entityType.definition.localName}-${value}`,
        async () => !!(await findById(entityType, value)),
        result => result,
        result => !!result // only cache the result if the entity exists
      )

      const exists = cache ? await check.cached({ ttl: cache }) : await check.execute()
      if (!negate && !exists) {
        throw new Error(`Unrecognised ${entityType.definition.localName} identifier`)
      } else if (negate && exists) {
        throw new Error(`Entity for ${entityType.definition.localName} identifier already exists`)
      }
    }
    return undefined
  }
}

/**
 * Create a validator which checks if an entity exists using an alternate key lookup
 *
 * @param {typeof BaseEntity} entityType the type of entity to check
 * @param {boolean|number} [cache] if falsy, do not cache the result.  a positive numeric value specifies the time to cache the validation result
 * @param {boolean} [negate] if true then validates that the entity does not exist, defaults to false
 * @returns {function: Promise<>}
 */
export function createAlternateKeyValidator (entityType, { cache, negate } = { cache: false, negate: false }) {
  if (!entityType.definition.alternateKey) {
    throw new Error(`The entity ${entityType.name} does not support alternate key lookups`)
  }
  return async value => {
    if (value) {
      const check = new CacheableOperation(
        `createAlternateKeyValidator-${entityType.definition.localName}-${value}`,
        async () => !!(await findByAlternateKey(entityType, value)),
        result => result,
        result => !!result // only cache the result if the entity exists
      )

      const exists = cache ? await check.cached({ ttl: cache }) : await check.execute()
      if (!negate && !exists) {
        throw new Error(`Unrecognised ${entityType.definition.localName} identifier`)
      } else if (negate && exists) {
        throw new Error(`Entity for ${entityType.definition.localName} identifier already exists`)
      }
    }
    return undefined
  }
}

/**
 * Create a validator that will check that the provided concessionId (if present) is valid for the given permitId
 * @returns {function(*): undefined}
 */
export function createPermitConcessionValidator () {
  return async transaction => {
    if (transaction) {
      for (const permission of transaction.permissions) {
        await validatePermissionConcession(permission, transaction)
      }
    }
    return undefined
  }
}

/**
 * Validate that a permission referencing a concession contains the required concession proof
 *
 * @param permission the permission to be validated
 * @returns {Promise<void>}
 * @throws {Error} on validation error
 */
const validatePermissionConcession = async (permission, transaction) => {
  const permitConcessions = await getReferenceDataForEntity(PermitConcession)
  const concessionsRequiredForPermit = permitConcessions.filter(pc => pc.permitId === permission.permitId)
  const hasConcessionProofs = permission.concessions && permission.concessions.length
  // Check that the concession is valid for the given permitId and that if a permit requires a concession reference that one is defined
  if (
    concessionsRequiredForPermit.length &&
    !hasConcessionProofs &&
    transaction.dataSource !== 'Post Office Sales' &&
    transaction.dataSource !== 'DDE File'
  ) {
    throw new Error(`The permit '${permission.permitId}' requires proof of concession however none were supplied`)
  } else if (!concessionsRequiredForPermit.length && hasConcessionProofs) {
    throw new Error(`The permit '${permission.permitId}' does not allow concessions but concession proofs were supplied`)
  } else if (permission.concessions) {
    validateConcessionList(permission, concessionsRequiredForPermit)
  }
}

/**
 * Validate that the supplied concessions list does not contain duplicates and are valid for the respective permit
 *
 * @param permission the permission containing the concessions to be validated
 * @param concessionsRequiredForPermit the concessions allowed for the target permit
 * @throws {Error} on validation error
 */
const validateConcessionList = (permission, concessionsRequiredForPermit) => {
  // Check list for duplicates
  const counts = permission.concessions.reduce((acc, c) => ({ ...acc, [c.id]: (acc[c.id] || 0) + 1 }), {})
  const duplicates = Object.keys(counts).filter(k => counts[k] > 1)
  if (duplicates.length) {
    throw new Error(`The concession ids '${duplicates}' appear more than once, duplicates are not permitted`)
  }

  // Check concession allowed for permit
  permission.concessions.forEach(concession => {
    if (!concessionsRequiredForPermit.find(pc => concession.id === pc.concessionId)) {
      throw new Error(`The concession '${concession.id}' is not valid with respect to the permit '${permission.permitId}'`)
    }
  })
}
