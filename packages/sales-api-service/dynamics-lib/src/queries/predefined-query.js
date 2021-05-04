/**
 * Build an expand structure for the request
 * Allows multi-level expand statements by recursively building additional expand elements for any additional nested {Relationship} structures
 *
 * @param expand
 * @returns {{}}
 */
const buildExpands = expand => ({
  ...(expand && {
    expand: expand.map(e => ({
      property: e.property,
      ...buildExpands(e.expand)
    }))
  })
})

/**
 * Parse the response, recursively processing any multi-level expands
 *
 * @param {typeof BaseEntity} entity The entity being parsed
 * @param {Object} data The response data pertaining to the entity
 * @param optionSetData The global option-set data
 * @returns {{entity: (Array<Object>|BaseEntity)}}
 */
const parseResponse = (entity, data, optionSetData) => ({
  entity: entity.fromResponse(data, optionSetData),
  ...(entity.definition.relationships && {
    expanded: {
      ...Object.entries(entity.definition.relationships).reduce((acc, [relationName, relationDefinition]) => {
        if (data[relationDefinition.property]) {
          if (relationDefinition.parent) {
            acc[relationName] = parseResponse(relationDefinition.entity, data[relationDefinition.property], optionSetData)
          } else {
            acc[relationName] = data[relationDefinition.property].map(entry =>
              parseResponse(relationDefinition.entity, entry, optionSetData)
            )
          }
        }
        return acc
      }, {})
    }
  })
})

/**
 * @template {!BaseEntity} T
 *
 * @typedef PredefinedQuery<T>
 * @typedef PredefinedQueryResult<T>
 * @property {T} entity The entity class instance that was found
 * @property {QueryResponseExpands} expanded Any relationships that were expanded
 * @template {!BaseEntity} T
 *
 * @typedef QueryResponseExpands<string, PredefinedQueryResult<?>>
 * @type PredefinedQuery<T>
 */
export class PredefinedQuery {
  /**
   * Create a new PredefinedQuery
   *
   * @param {typeof BaseEntity} root the entity class acting as the root of the query
   * @param {string} filter the ODATA filter to apply to the query
   * @param {Array<Relationship>} [expand] optional relationships to be expanded when the query is executed
   * @param {Array<string>} [orderBy] Allows the order in which results are returned to be specified
   */
  constructor ({ root, filter, expand, orderBy }) {
    this._root = root
    this._retrieveRequest = {
      ...root.definition.toRetrieveRequest(filter),
      ...buildExpands(expand),
      ...(orderBy && orderBy.length && { orderBy: orderBy })
    }
  }

  /**
   * @returns {{filter: string?, expands: Array<Expand>, select: Array<String>, collection: !string}}
   */
  toRetrieveRequest () {
    return this._retrieveRequest
  }

  /**
   *
   *
   * @param results
   * @param optionSetData
   * @returns {Array<PredefinedQueryResult<T>>}
   */
  fromResponse (results, optionSetData) {
    return results.map(data => parseResponse(this._root, data, optionSetData))
  }
}
