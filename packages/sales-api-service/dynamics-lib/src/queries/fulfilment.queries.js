import moment from 'moment'
import { PredefinedQuery } from './predefined-query.js'
import { FulfilmentRequest } from '../entities/fulfilment-request.entity.js'
import { FulfilmentRequestFile } from '../entities/fulfilment-request-file.entity.js'

/**
 * Builds a query to retrieve all fulfilment data which has not yet been associated with a fulfilment file
 *
 * @returns {PredefinedQuery<FulfilmentRequest>}
 */
export const findUnassociatedFulfilmentRequests = () => {
  const { permission } = FulfilmentRequest.definition.relationships
  const filter = `${FulfilmentRequest.definition.relationships.fulfilmentRequestFile.property} eq null and ${FulfilmentRequest.definition.defaultFilter}`
  return new PredefinedQuery({
    root: FulfilmentRequest,
    filter: filter,
    expand: [
      {
        ...permission,
        expand: [permission.entity.definition.relationships.licensee, permission.entity.definition.relationships.permit]
      }
    ],
    orderBy: [`${FulfilmentRequest.definition.mappings.requestTimestamp.field} asc`]
  })
}

/**
 * Builds a query to retrieve fulfilment files optionally filtering by a given date and status
 *
 *
 * @param {moment.Moment|string|Date} [date] Filter results by the given moment parseable date
 * @param {GlobalOptionSetDefinition} [status] Filter results by the given status
 * @returns {PredefinedQuery<FulfilmentRequestFile>}
 */
export const findFulfilmentFiles = ({ date, status } = {}) => {
  const filters = []
  if (date) {
    const targetDate = moment(date).format('YYYY-MM-DD')
    filters.push(
      `Microsoft.Dynamics.CRM.On(PropertyName='${FulfilmentRequestFile.definition.mappings.date.field}', PropertyValue=${targetDate})`
    )
  }
  status && filters.push(`${FulfilmentRequestFile.definition.mappings.status.field} eq ${status.id}`)
  filters.push(FulfilmentRequestFile.definition.defaultFilter)
  return new PredefinedQuery({ root: FulfilmentRequestFile, filter: filters.join(' and ') })
}
