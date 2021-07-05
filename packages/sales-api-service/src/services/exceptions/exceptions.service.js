import { persist, StagingException, PoclStagingException } from '@defra-fish/dynamics-lib'
import db from 'debug'
import { getGlobalOptionSetValue } from '../reference-data.service.js'

// @IWTF-2174: Remove after testing
import { PoclValidationError } from './temp/index.js'

const BLUE_BADGE = 'Blue Badge'
const NATIONAL_INSURANCE_NUMBER = 'National Insurance Number'

const debug = db('sales:exceptions')

/**
 * Create a new staging exception
 *
 * @typedef {Object} ExceptionData
 * @property {!string} stagingId the staging identifier associated with the exception
 * @property {!string} description the description of the exception that occurred
 * @property {!string} transactionJson the transaction JSON data which caused the exception to occur
 * @property {!string} exceptionJson the exception JSON data for diagnosis purposes
 *
 * @param {ExceptionData} exceptionData the data with which to create the staging exception
 * @returns {Promise<StagingException>}
 */
export const createStagingException = async exceptionData => {
  debug('Adding staging exception: %o', exceptionData)
  const exception = Object.assign(new StagingException(), exceptionData)
  await persist([exception])
  return exception
}

/**
 * Create a new staging exception from a JS {@link Error} object which has been thrown during processing
 *
 * @param {!string} stagingId the staging identifier associated with the exception
 * @param {!Error} exception the exception object thrown when the error occurred
 * @param {Object} transaction the transaction data which caused the exception to occur
 * @returns {Promise<StagingException>}
 */
export const createStagingExceptionFromError = async (stagingId, exception, transaction) => {
  return createStagingException({
    stagingId: stagingId,
    description: (exception.error && exception.error.message) || String(exception),
    transactionJson: JSON.stringify(transaction, null, 2),
    exceptionJson: JSON.stringify({ ...exception, stack: exception.stack.split('\n') }, null, 2)
  })
}

/**
 * @typedef {Object} TransactionFileError
 * @property {!string} name the transaction error name
 * @property {!string} description the description of the exception that occurred
 * @property {!string} json the transaction JSON data which caused the exception to occur
 * @property {!string} notes any additional notes to associated with the error
 * @property {!string} type the error type (Failure|Warning)
 * @property {!string} transactionFile the filename of the transaction file containing the error
 *
 * @param {TransactionFileError} transactionFileError
 * @returns {Promise<PoclStagingException>}
 */
export const createTransactionFileException = async transactionFileError => {
  debug('Adding exception for transaction file: %o', transactionFileError)
  const stagingException = Object.assign(new PoclStagingException(), {
    ...transactionFileError,
    type: await getGlobalOptionSetValue(PoclStagingException.definition.mappings.type.ref, transactionFileError.type),
    status: await getGlobalOptionSetValue(PoclStagingException.definition.mappings.status.ref, 'Open')
  })
  stagingException.bindToAlternateKey(PoclStagingException.definition.relationships.poclFile, transactionFileError.transactionFile)
  console.log('------ABOUT TO CREATE FILE EXCEPTION-------', { stagingException })
  await persist([stagingException])
  return stagingException
}

const getJSONString = obj => JSON.stringify(obj, null, 2)

const getConcessions = (concessions) => {
  const blueBadgeConcession = getJSONString(concessions.find(c => c.type === BLUE_BADGE))
  const pipConcession = getJSONString(concessions.find(c => c.type === NATIONAL_INSURANCE_NUMBER))
  // all other types of concessions are classified as senior concessions
  const seniorConcession = getJSONString(concessions.find(c => ![BLUE_BADGE, NATIONAL_INSURANCE_NUMBER].includes(c.type)))

  return {
    ...blueBadgeConcession && { blueBadgeConcession },
    ...pipConcession && { pipConcession },
    ...seniorConcession && { seniorConcession }
  }
}

/**
 * @typedef {Object} TransactionValidationError
 * @property {!object} createTransactionPayload the data used to create a transaction
 * @property {!object} finaliseTransactionPayload the transaction data
 *
 * @param {TransactionValidationError} record
 * @returns {Promise<PoclValidationError>}
 */
export const createDataValidationError = async record => {
  debug('Adding exception for POCL record: %o', record)
  const { dataSource, serialNumber, permissions: [permission] } = record.createTransactionPayload
  console.log(permission)
  const { licensee, issueDate: transactionDate, concessions, ...otherPermissionData } = permission
  const validationErrorRecord = Object.assign(new PoclValidationError(), {
    serialNumber,
    transactionDate,
    ...licensee,
    ...otherPermissionData,
    ...getConcessions(concessions),
    ...record.finaliseTransactionPayload.payment,
    paymentSource: record.finaliseTransactionPayload.payment.source,
    status: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.status.ref, 'Needs Review'),
    dataSource: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.dataSource.ref, dataSource),
    preferredMethodOfConfirmation: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.preferredMethodOfConfirmation.ref, licensee.preferredMethodOfConfirmation),
    preferredMethodOfNewsletter: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.preferredMethodOfNewsletter.ref, licensee.preferredMethodOfNewsletter),
    preferredMethodOfReminder: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.preferredMethodOfReminder.ref, licensee.preferredMethodOfReminder),
    methodOfPayment: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.methodOfPayment.ref, record.finaliseTransactionPayload.payment.method)
  })
  console.log('------VALIDATION ERROR TO BE CREATED-------', { validationErrorRecord })

  await persist([validationErrorRecord])
  return validationErrorRecord
}
