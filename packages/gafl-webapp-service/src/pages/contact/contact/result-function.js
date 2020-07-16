import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { CommonResults, CONTACT_SUMMARY_SEEN } from '../../../constants.js'

/**
 * Returns rod license type troutAndCourse or salmonAndSeaTrout
 * @param request
 * @returns {Promise<string>}
 */
export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  let result = CommonResults.YES

  if (status.fromSummary && status.fromSummary === CONTACT_SUMMARY_SEEN) {
    result = CommonResults.SUMMARY
  } else if ([HOW_CONTACTED.letter, HOW_CONTACTED.none].includes(licensee.preferredMethodOfConfirmation)) {
    result = CommonResults.NO
  }

  return result
}
