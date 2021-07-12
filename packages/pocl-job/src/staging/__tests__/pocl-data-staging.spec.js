import { salesApi } from '@defra-fish/connectors-lib'
import Project from '../../project.cjs'
import { DYNAMICS_IMPORT_STAGE, FILE_STAGE, POST_OFFICE_DATASOURCE } from '../constants.js'
import { stage } from '../pocl-data-staging.js'
import { createTransactions } from '../create-transactions.js'
import { finaliseTransactions } from '../finalise-transactions.js'
import { getFileRecord, updateFileStagingTable } from '../../io/db.js'
import fs from 'fs'

jest.mock('../create-transactions.js')
jest.mock('../finalise-transactions.js')
jest.mock('../../io/db.js')
jest.mock('fs')
jest.mock('md5-file', () => () => 'test-md5')

jest.mock('@defra-fish/connectors-lib', () => {
  const actual = jest.requireActual('@defra-fish/connectors-lib')
  return {
    AWS: actual.AWS,
    salesApi: {
      ...Object.keys(actual.salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn(async () => {}) }), {})
    }
  }
})

describe('pocl data staging', () => {
  const TEST_FILE_NAME = 'test-2-records.xml'
  const TEST_FILE_PATH = `${Project.root}/src/__mocks__/${TEST_FILE_NAME}`

  beforeAll(() => {
    process.env.POCL_FILE_STAGING_TABLE = 'TestFileTable'
  })
  beforeEach(jest.clearAllMocks)

  describe('it runs all stages if...', () => {
    it.each([
      ['the file has not previously been processed', undefined],
      ['the file has pending state', { stage: FILE_STAGE.Pending }]
    ])('%s', async (desc, val) => {
      getFileRecord.mockResolvedValueOnce(val)
      getFileRecord.mockResolvedValueOnce({
        stagingSucceeded: 5,
        stagingFailed: 1,
        finalisationSucceeded: 3,
        finalisationFailed: 2
      })
      salesApi.getTransactionFile.mockResolvedValueOnce({ status: { description: DYNAMICS_IMPORT_STAGE.Pending } })
      fs.statSync.mockReturnValueOnce({ size: 1024 })
      createTransactions.mockResolvedValue({ succeeded: 5, failed: 1 })
      finaliseTransactions.mockResolvedValue({ succeeded: 3, failed: 2 })
      await stage(TEST_FILE_PATH)
      expect(getFileRecord).toHaveBeenCalledWith(TEST_FILE_NAME)
      expect(createTransactions).toHaveBeenCalledWith(TEST_FILE_PATH)
      expect(finaliseTransactions).toHaveBeenCalledWith(TEST_FILE_PATH)
      expect(updateFileStagingTable).toHaveBeenNthCalledWith(1, {
        filename: TEST_FILE_NAME,
        md5: 'test-md5',
        stage: FILE_STAGE.Staging
      })
      expect(updateFileStagingTable).toHaveBeenNthCalledWith(2, {
        filename: TEST_FILE_NAME,
        stage: FILE_STAGE.Finalising,
        stagingSucceeded: 5,
        stagingFailed: 1
      })
      expect(updateFileStagingTable).toHaveBeenNthCalledWith(3, {
        filename: TEST_FILE_NAME,
        stage: FILE_STAGE.Completed,
        finalisationSucceeded: 3,
        finalisationFailed: 2
      })
      expect(salesApi.upsertTransactionFile).toHaveBeenNthCalledWith(1, TEST_FILE_NAME, {
        status: DYNAMICS_IMPORT_STAGE.InProgress,
        dataSource: POST_OFFICE_DATASOURCE,
        fileSize: '1 KB',
        notes: expect.stringMatching(/Started processing at .*/)
      })

      expect(salesApi.upsertTransactionFile).toHaveBeenNthCalledWith(2, TEST_FILE_NAME, {
        totalCount: 6,
        successCount: 3,
        errorCount: 3,
        status: DYNAMICS_IMPORT_STAGE.ProcessedWithWarnings,
        notes: expect.stringMatching(/Completed processing at .*/)
      })
    })
  })

  it('only runs finalisation if the creation phase has previously been completed', async () => {
    getFileRecord.mockResolvedValue({ stage: FILE_STAGE.Finalising })
    fs.statSync.mockReturnValueOnce({ size: 1024 })
    salesApi.getTransactionFile.mockResolvedValueOnce({ status: { description: DYNAMICS_IMPORT_STAGE.InProgress } })
    finaliseTransactions.mockResolvedValue({ succeeded: 3, failed: 2 })
    await stage(TEST_FILE_PATH)
    expect(getFileRecord).toHaveBeenCalledWith(TEST_FILE_NAME)
    expect(createTransactions).not.toHaveBeenCalled()
    expect(finaliseTransactions).toHaveBeenCalledWith(TEST_FILE_PATH)
    expect(updateFileStagingTable).toHaveBeenCalledWith({
      filename: TEST_FILE_NAME,
      stage: FILE_STAGE.Completed,
      finalisationSucceeded: 3,
      finalisationFailed: 2
    })
  })

  it('updates the status in Dynamics if the Dynamics returns InProgress but now marked completed in DynamoDB', async () => {
    salesApi.getTransactionFile.mockResolvedValueOnce({ status: { description: DYNAMICS_IMPORT_STAGE.InProgress } })
    getFileRecord.mockResolvedValue({ stage: FILE_STAGE.Completed })
    fs.statSync.mockReturnValueOnce({ size: 1024 })
    await stage(TEST_FILE_PATH)
    expect(getFileRecord).toHaveBeenCalledWith(TEST_FILE_NAME)
    expect(createTransactions).not.toHaveBeenCalled()
    expect(finaliseTransactions).not.toHaveBeenCalled()
    expect(updateFileStagingTable).not.toHaveBeenCalled()
    expect(salesApi.upsertTransactionFile).toHaveBeenCalled()
  })

  it('is a no-op if the file is marked as processed in Dynamics', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    salesApi.getTransactionFile.mockResolvedValueOnce({ status: { description: DYNAMICS_IMPORT_STAGE.ProcessedWithWarnings } })
    getFileRecord.mockResolvedValue({ stage: FILE_STAGE.Completed })
    fs.statSync.mockReturnValueOnce({ size: 1024 })
    await stage(TEST_FILE_PATH)
    expect(getFileRecord).toHaveBeenCalledWith(TEST_FILE_NAME)
    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(createTransactions).not.toHaveBeenCalled()
    expect(finaliseTransactions).not.toHaveBeenCalled()
    expect(updateFileStagingTable).not.toHaveBeenCalled()
  })
})
