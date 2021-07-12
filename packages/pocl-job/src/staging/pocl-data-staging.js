import { DYNAMICS_IMPORT_STAGE, FILE_STAGE, POST_OFFICE_DATASOURCE } from './constants.js'
import { getFileRecord, updateFileStagingTable } from '../io/db.js'
import { createTransactions } from './create-transactions.js'
import { finaliseTransactions } from './finalise-transactions.js'
import Path from 'path'
import md5File from 'md5-file'
import filesize from 'filesize'
import moment from 'moment'
import db from 'debug'
import { salesApi } from '@defra-fish/connectors-lib'
import fs from 'fs'
const debug = db('pocl:staging')

/**
 * Process the POCL file at the given path, staging all data into Dynamics via the Sales API
 *
 * @param xmlFilePath the path to the file to process
 * @returns {Promise<void>}
 */
export const stage = async xmlFilePath => {
  const filename = Path.basename(xmlFilePath)
  let fileRecord = await getFileRecord(filename)
  const dynamicsRecord = await salesApi.getTransactionFile(filename)
  if (dynamicsRecord && DYNAMICS_IMPORT_STAGE.isAlreadyProcessed(dynamicsRecord.status.description)) {
    console.error(
      'A file was retrieved but is already marked as processed in Dynamics, ignoring.  Dynamics record: %o, DynamoDB record: %o',
      dynamicsRecord,
      fileRecord
    )
    return
  } else {
    const fileSize = filesize(fs.statSync(xmlFilePath).size)
    await salesApi.upsertTransactionFile(filename, {
      status: DYNAMICS_IMPORT_STAGE.InProgress,
      dataSource: POST_OFFICE_DATASOURCE,
      fileSize: fileSize,
      notes: `Started processing at ${moment().toISOString()}`
    })
  }

  if (!fileRecord || fileRecord.stage === FILE_STAGE.Pending) {
    console.log('Import file %s not previously processed, processing now', filename)
    const md5 = await md5File(xmlFilePath)
    fileRecord = { ...fileRecord, ...{ filename, md5, stage: FILE_STAGE.Staging } }
    await updateFileStagingTable({ filename, md5, stage: FILE_STAGE.Staging })
  } else if (fileRecord.stage === FILE_STAGE.Completed) {
    console.log('Import file %s has already been staged, skipping', filename)
  } else {
    console.log('Resuming staging process for file %s', filename)
  }

  if (fileRecord.stage === FILE_STAGE.Staging) {
    debug('Staging records for file %s.', filename)
    const { succeeded, failed } = await createTransactions(xmlFilePath)
    await updateFileStagingTable({ filename, stage: FILE_STAGE.Finalising, stagingSucceeded: succeeded, stagingFailed: failed })
    fileRecord.stage = FILE_STAGE.Finalising
    debug('Finished staging records for file %s. Succeeded: %s, Failed: %s', filename, succeeded, failed)
  }

  if (fileRecord.stage === FILE_STAGE.Finalising) {
    debug('Finalising all staged transactions for file %s.', filename)
    const { succeeded, failed } = await finaliseTransactions(xmlFilePath)
    await updateFileStagingTable({ filename, stage: FILE_STAGE.Completed, finalisationSucceeded: succeeded, finalisationFailed: failed })
    fileRecord.stage = FILE_STAGE.Completed
    debug('Finished finalising records for file %s. Succeeded: %s, Failed: %s', filename, succeeded, failed)
  }

  fileRecord = await getFileRecord(filename)
  const successCount = fileRecord.finalisationSucceeded
  const errorCount = fileRecord.stagingFailed + fileRecord.finalisationFailed
  const totalCount = successCount + errorCount
  await salesApi.upsertTransactionFile(filename, {
    totalCount,
    successCount,
    errorCount,
    status: (errorCount && DYNAMICS_IMPORT_STAGE.ProcessedWithWarnings) || DYNAMICS_IMPORT_STAGE.Processed,
    notes: `Completed processing at ${moment().toISOString()}`
  })
}
