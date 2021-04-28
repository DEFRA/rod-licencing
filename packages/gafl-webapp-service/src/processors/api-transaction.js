import { advancePurchaseDateMoment } from './date-and-time-display.js'
import moment from 'moment'
import { TRANSACTION_SOURCE, PAYMENT_TYPE } from '@defra-fish/business-rules-lib'
import * as mappings from './mapping-constants.js'
import * as concessionHelper from '../processors/concession-helper.js'
import { countries } from './refdata-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { licenceToStart } from '../pages/licence-details/licence-to-start/update-transaction.js'

export const prepareApiTransactionPayload = async request => {
  const transactionCache = await request.cache().helpers.transaction.get()
  const concessions = await salesApi.concessions.getAll()
  const countryList = await countries.getAll()

  return {
    dataSource: process.env.CHANNEL === 'telesales' ? mappings.DATA_SOURCE.telesales : mappings.DATA_SOURCE.web,
    permissions: transactionCache.permissions.map(p => {
      const permission = {
        permitId: p.permit.id,
        licensee: Object.assign((({ countryCode, ...l }) => l)(p.licensee), {
          country: countryList.find(c => c.code === p.licensee.countryCode).name
        }),
        issueDate: null,
        startDate: null,
        ...(p.licenceToStart === licenceToStart.ANOTHER_DATE && {
          startDate: advancePurchaseDateMoment(p)
            .utc()
            .toISOString()
        })
      }

      // Calculate the concession (proof entry) - disabled takes precedence
      if (concessionHelper.hasDisabled(p)) {
        permission.concessions = [
          {
            id: concessions.find(c => c.name === mappings.CONCESSION.DISABLED).id,
            proof: p.concessions.find(c => c.type === mappings.CONCESSION.DISABLED).proof
          }
        ]
      } else if (concessionHelper.hasSenior(p)) {
        permission.concessions = [
          {
            id: concessions.find(c => c.name === mappings.CONCESSION.SENIOR).id,
            proof: {
              type: mappings.CONCESSION_PROOF.none
            }
          }
        ]
      } else if (concessionHelper.hasJunior(p)) {
        permission.concessions = [
          {
            id: concessions.find(c => c.name === mappings.CONCESSION.JUNIOR).id,
            proof: {
              type: mappings.CONCESSION_PROOF.none
            }
          }
        ]
      }

      return permission
    }),
    createdBy:
      request.state && request.state[process.env.OIDC_SESSION_COOKIE_NAME]
        ? request.state[process.env.OIDC_SESSION_COOKIE_NAME].oid
        : undefined
  }
}

export const prepareApiFinalisationPayload = async request => {
  const transaction = await request.cache().helpers.transaction.get()
  return {
    payment: {
      amount: transaction.cost,
      timestamp: moment().toISOString(),
      source: TRANSACTION_SOURCE.govPay,
      method: PAYMENT_TYPE.debit
    }
  }
}
