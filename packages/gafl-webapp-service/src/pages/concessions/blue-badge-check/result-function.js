import { BLUE_BADGE_CHECK } from '../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BLUE_BADGE_CHECK.page)
  return status.fromSummary ? 'summary' : payload['blue-badge-check']
}
