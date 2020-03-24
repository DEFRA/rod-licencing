import transactionHelper from '../../lib/transaction-helper.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache['licence-length']
  await transactionHelper.setPermission(request, { licenceLength: payload['licence-length'] })
}
