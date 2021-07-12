import { salesApi } from '@defra-fish/connectors-lib'
import Path from 'path'
import { MAX_CREATE_TRANSACTION_BATCH_SIZE, RECORD_STAGE } from './constants.js'
import { transform } from '../transform/pocl-transform-stream.js'
import { getProcessedRecords, updateRecordStagingTable } from '../io/db.js'
import db from 'debug'
const debug = db('pocl:staging')

/**
 * Create the transactions in the Sales API by processing the file at the given path
 *
 * @param xmlFilePath the full file path to the POCL XML file
 * @returns {Promise<{failed: number, succeeded: number}>}
 */
export const createTransactions = async xmlFilePath => {
  const filename = Path.basename(xmlFilePath)
  const state = await getInitialState(filename)

  await transform(xmlFilePath, async function * (source) {
    for await (const data of source) {
      if (!state.processedIds.has(data.id)) {
        state.processedIds.add(data.id)
        state.buffer.push(data)
        if (state.buffer.length === MAX_CREATE_TRANSACTION_BATCH_SIZE) {
          await createTransactionsInSalesApi(filename, state)
        }
      }
    }
  })
  // Process any remaining content of the buffer
  await createTransactionsInSalesApi(filename, state)
  return { succeeded: state.succeeded, failed: state.failed }
}

/**
 * Get the inital state (supports resuming an interrupted process)
 *
 * @typedef TransactionCreationState
 * @property {Array<Object>} buffer the current buffer being processed
 * @property {number} succeeded the number of records which were successfully created in the Sales Api
 * @property {number} failed the number of records which failed to be created in the Sales Api
 * @property {Set<string>} processedIds the ID's of records that were successfully processed
 *
 * @param filename the name of the file being processed (not including path)
 * @returns {Promise<TransactionCreationState>}
 */
const getInitialState = async filename => {
  const processedRecords = await getProcessedRecords(filename)
  processedRecords.length && debug('File partially processed, resuming from record %s', processedRecords.length)
  return processedRecords.reduce(
    (acc, record) => {
      if (record.stage === RECORD_STAGE.TransactionCreationFailed) {
        acc.failed++
      } else {
        acc.succeeded++
      }
      acc.processedIds.add(record.id)
      return acc
    },
    { buffer: [], succeeded: 0, failed: 0, processedIds: new Set() }
  )
}

/**
 * Create the given records in the Sales API, updating properties as appropriate based on whether the record was successfully created or not
 *
 * @param {string} filename the name of the file being processed
 * @param {TransactionCreationState} state the current state of the process
 * @returns {Promise<void>}
 */
const createTransactionsInSalesApi = async (filename, state) => {
  if (state.buffer.length) {
    const createResults = await salesApi.createTransactions(state.buffer.map(item => item.createTransactionPayload))

    const succeeded = []
    const failed = []
    state.buffer.forEach((record, idx) => {
      const result = createResults[idx]
      ;(result.statusCode === 201 ? succeeded : failed).push({ record, result })
    })

    await processSucceeded(filename, succeeded)
    await processFailed(filename, failed)

    state.succeeded += succeeded.length
    state.failed += failed.length
    state.buffer = []
  }
}

/**
 * Update the status of records which were successfully created in the sales API
 *
 * @param {string} filename the name of the file being processed
 * @param {Array<Object>} succeeded An array of objects.  Each object shall contain a record key and a result key
 * @returns {Promise<void>}
 */
const processSucceeded = async (filename, succeeded) => {
  const recordUpdates = succeeded.map(({ record, result }) => {
    record.stage = RECORD_STAGE.TransactionCreated
    record.createTransactionId = result.response.id
    debug('Successfully created transaction for record: %o', record)
    return record
  })
  await updateRecordStagingTable(filename, recordUpdates)
}

/**
 * Update the status of records which failed to be created in the sales API
 *
 * @param {string} filename the name of the file being processed
 * @param {Array<Object>} failed An array of objects.  Each object shall contain a record key and a result key
 * @returns {Promise<void>}
 */
const processFailed = async (filename, failed) => {
  // For record data errors, update the record status to be failed and insert a staging exception into Dynamics
  // We don't need to deal with individual 5xx system errors here as we use the batch endpoint of the sales API
  for (const { record, result } of failed) {
    record.stage = RECORD_STAGE.TransactionCreationFailed
    record.createTransactionError = result
    debug('Failed to create transaction for record: %o', record)
    await salesApi.createStagingException({
      transactionFileException: {
        name: `${filename}: FAILED-CREATE-${record.id}`,
        description: JSON.stringify(result, null, 2),
        json: JSON.stringify(record, null, 2),
        notes: 'Failed to create the transaction in the Sales API',
        type: 'Failure',
        transactionFile: filename
      },
      record
    })
  }

  const recordUpdates = failed.map(({ record }) => record)
  await updateRecordStagingTable(filename, recordUpdates)
}
