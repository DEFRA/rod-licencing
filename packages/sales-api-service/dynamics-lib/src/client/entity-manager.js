import { dynamicsClient } from '../client/dynamics-client.js'
import { escapeODataStringValue } from './util.js'
import { CacheableOperation } from './cache.js'
/**
 * Persist the provided entities.  Uses a create or update request as appropriate based on the state of the entity.
 *
 * @param {Object<BaseEntity[]>} entities the entities which shall be persisted
 * @param {string} createdBy the oid of the active directory user that is creating the entities
 * @returns {Promise<string[]>} resolving to the ids of the persisted entities
 */
export async function persist (entities, createdBy) {
  try {
    dynamicsClient.startBatch()
    entities.forEach(entity => {
      if (entity.isNew()) {
        dynamicsClient.createRequest(entity.toPersistRequest())
      } else {
        dynamicsClient.updateRequest(entity.toPersistRequest())
      }
    })
    return await dynamicsClient.executeBatch({
      impersonateAAD: createdBy
    })
  } catch (e) {
    const error = e.length ? e[0] : e
    const requestDetails = entities.map(entity => ({ [entity.isNew() ? 'createRequest' : 'updateRequest']: entity.toPersistRequest() }))
    console.error('Error persisting batch. Data: %j, Exception: %o', requestDetails, error)
    throw error
  }
}

const retrieveMultipleFetchOperation = async entityClasses => {
  try {
    dynamicsClient.startBatch()
    entityClasses.forEach(cls => dynamicsClient.retrieveMultipleRequest(cls.definition.toRetrieveRequest()))
    return await dynamicsClient.executeBatch()
  } catch (e) {
    const error = e.length ? e[0] : e
    console.error('Unable to retrieveMultiple:', error)
    throw error
  }
}

/**
 * Sends an asynchronous request to retrieve records.  The number of records retrieved is determined by the configured page size in Dynamics (5000)
 *
 * Records are returned as:
 *  - an array of records if only a single entity class is provided
 *  - a 2-dimensional array of records if multiple entity classes are provided
 *
 * @param {typeof BaseEntity} entityClasses the entity classes to perform a retrieve operation on
 * @returns {CacheableOperation}
 */
export function retrieveMultiple (...entityClasses) {
  const entityClsKeys = entityClasses.map(e => e.definition.localCollection).join('_')
  return new CacheableOperation(
    `dynamics_${entityClsKeys}`,
    async () => retrieveMultipleFetchOperation(entityClasses),
    async data => {
      const optionSetData = await retrieveGlobalOptionSets().cached()
      const results = data.map((result, i) => result.value.map(v => entityClasses[i].fromResponse(v, optionSetData)))
      return (results.length === 1 && results[0]) || results
    }
  )
}

/**
 * Sends an asynchronous request to retrieve records.  The number of records retrieved is determined by the configured page size in Dynamics (5000)
 *
 * Records are returned as an object containing keys determined by the localCollection property of the definition for each entity class provided
 *
 * @param {typeof BaseEntity} entityClasses the entity classes to perform a retrieve operation on
 * @returns {CacheableOperation}
 */
export function retrieveMultipleAsMap (...entityClasses) {
  const entityClsKeys = entityClasses.map(e => e.definition.localCollection).join('_')
  return new CacheableOperation(
    `dynamics_${entityClsKeys}`,
    async () => retrieveMultipleFetchOperation(entityClasses),
    async data => {
      const optionSetData = await retrieveGlobalOptionSets().cached()
      return data.reduce((acc, item, idx) => {
        acc[entityClasses[idx].definition.localCollection] = item.value.map(v => entityClasses[idx].fromResponse(v, optionSetData))
        return acc
      }, {})
    }
  )
}

/**
 * Retrieve the available GlobalOptionSets from Dynamics, optionally filtered by the provided names
 *
 * @returns {CacheableOperation}
 */
export function retrieveGlobalOptionSets () {
  return new CacheableOperation(
    'dynamics_optionsetmap',
    async () => {
      try {
        const data = await dynamicsClient.retrieveGlobalOptionSets('Microsoft.Dynamics.CRM.OptionSetMetadata', ['Name', 'Options'])
        return data.value.reduce((acc, { Name: name, Options: options }) => {
          acc[name] = {
            name,
            options: options.reduce((optionSetMapping, o) => {
              const id = o.Value
              const label = o.Label?.UserLocalizedLabel?.Label
              const description = o.Description?.UserLocalizedLabel?.Label || label
              optionSetMapping[id] = { id, label, description }
              return optionSetMapping
            }, {})
          }
          return acc
        }, {})
      } catch (e) {
        console.error('Error attempting to retrieveGlobalOptionSets', e)
        throw e
      }
    },
    data => data
  )
}

/**
 * Retrieve a record from Dynamics by its ID
 *
 * @template T<typeof BaseEntity>
 *
 * @param {T} entityType the example entity to construct a query from
 * @param {string} key the ID of the record to retrieve
 * @returns {Promise<T>} the record matching the given id or null if not found
 */
export async function findById (entityType, key) {
  try {
    const record = await dynamicsClient.retrieveRequest({ key: key, ...entityType.definition.toRetrieveRequest(null) })
    const optionSetData = await retrieveGlobalOptionSets().cached()
    return entityType.fromResponse(record, optionSetData)
  } catch (e) {
    if (e.status === 404) {
      return null
    }
    console.error('Unable to findById:', e)
    throw e
  }
}

/**
 * Retrieve a record from Dynamics by its alternate key
 *
 * @template T<typeof BaseEntity>
 *
 * @param {T} entityType the example entity to construct a query from
 * @param {string} alternateKey the alternate key value to use to retrieve the corresponding entity
 * @returns {Promise<T>} the record matching the given id or null if not found
 */
export async function findByAlternateKey (entityType, alternateKey) {
  return findById(entityType, `${entityType.definition.alternateKey}='${escapeODataStringValue(alternateKey)}'`)
}

/**
 * Retrieve records from Dynamics which match each of the fields populated in the example entity
 *
 * @template T<BaseEntity>
 *
 * @param {T} entity the example entity to construct a query from
 * @returns {Promise<Array<T>>} an array of matching records
 */
export async function findByExample (entity) {
  try {
    const filter = [
      ...(entity.constructor.definition.defaultFilter ? [entity.constructor.definition.defaultFilter] : []),
      ...Object.entries(entity.constructor.definition.mappings).reduce((acc, [property, { field, type }]) => {
        let serialized = entity._toSerialized(property)
        if (serialized !== undefined) {
          if (type === 'string') {
            serialized = `'${escapeODataStringValue(serialized)}'`
          }
          acc[acc.length] = `${field} eq ${serialized}`
        }
        return acc
      }, [])
    ].join(' and ')
    const results = await dynamicsClient.retrieveMultipleRequest(entity.constructor.definition.toRetrieveRequest(filter))
    const optionSetData = await retrieveGlobalOptionSets().cached()
    return results.value.map(result => entity.constructor.fromResponse(result, optionSetData))
  } catch (e) {
    console.error('Unable to findByExample:', e)
    throw e
  }
}

/**
 * Execute a predefined query
 *
 * @param {!PredefinedQuery<T>} query the query to execute
 * @returns {Promise<Array<PredefinedQueryResult<T>>>} an array of matching records
 *
 * @template {!BaseEntity} T
 */
export async function executeQuery (query) {
  try {
    const response = await dynamicsClient.retrieveMultipleRequest(query.toRetrieveRequest())
    const optionSetData = await retrieveGlobalOptionSets().cached()
    return query.fromResponse(response.value, optionSetData)
  } catch (e) {
    console.error('Failed to execute query: ', e)
    throw e
  }
}

/**
 * Execute a predefined query with pagination support
 *
 * NOTE: This method will make repeated requests to Dynamics and could take several minutes to execute depending on the nature of the query
 *
 * @template T<BaseEntity>
 * @param {!PredefinedQuery<T>} query the query to execute
 * @param {function(Array<PredefinedQueryResult<T>>): Promise<any>} onPageReceived
 *    Asynchronous callback function invoked with an array of objects containing the response to the predefined query
 * @param {number} [maxPages} limit the number of pages that will be retrieved
 * @returns {Promise<number>} the count of records that were processed
 */
export async function executePagedQuery (query, onPageReceived, maxPages) {
  let processed = 0
  try {
    const optionSetData = await retrieveGlobalOptionSets().cached()
    let nextLink = null
    do {
      const response = await dynamicsClient.retrieveMultipleRequest(query.toRetrieveRequest(), nextLink)
      nextLink = response.oDataNextLink
      await onPageReceived(query.fromResponse(response.value, optionSetData))
      processed += response.value.length
      if (maxPages) {
        maxPages--
      }
    } while (nextLink && maxPages !== 0)
  } catch (e) {
    console.error('Failed to execute query: ', e)
    throw e
  }
  return processed
}
