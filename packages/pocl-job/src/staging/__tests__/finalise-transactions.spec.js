import { finaliseTransactions } from '../finalise-transactions.js'
import { RECORD_STAGE, MAX_BATCH_SIZE } from '../constants.js'
import * as db from '../db.js'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    ...Object.keys(jest.requireActual('@defra-fish/connectors-lib').salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn() }), {})
  }
}))
jest.mock('../db.js', () => ({
  updateRecordStagingTable: jest.fn(),
  getProcessedRecords: jest.fn(() => [])
}))
const salesApi = require('@defra-fish/connectors-lib').salesApi

describe('finalise-transactions', () => {
  const TEST_FILENAME = 'testfile.xml'
  beforeAll(() => {
    process.env.POCL_FILE_STAGING_TABLE = 'TestFileTable'
    process.env.POCL_RECORD_STAGING_TABLE = 'TestRecordTable'
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('updates records appropriately if a finalisation error occurs', async () => {
    const fakeError = { statusCode: 422, error: 'Fake error', message: 'Fake error message' }
    db.getProcessedRecords.mockReturnValueOnce([
      { id: 'test1', stage: RECORD_STAGE.TransactionCreated },
      { id: 'test2', stage: RECORD_STAGE.TransactionCreated }
    ])
    salesApi.finaliseTransaction.mockResolvedValueOnce({ messageId: 'message1' })
    salesApi.finaliseTransaction.mockRejectedValueOnce(fakeError)
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(2)
    expect(db.updateRecordStagingTable).toHaveBeenCalledWith(TEST_FILENAME, [
      { id: 'test1', stage: RECORD_STAGE.TransactionFinalised, finaliseTransactionId: 'message1' },
      { id: 'test2', stage: RECORD_STAGE.TransactionFinalisationFailed, finaliseTransactionError: fakeError }
    ])
  })

  it('will resume finalising records if the process was previously interrupted', async () => {
    db.getProcessedRecords.mockReturnValueOnce([
      { id: 'test1', stage: RECORD_STAGE.TransactionFinalised },
      { id: 'test2', stage: RECORD_STAGE.TransactionFinalisationFailed },
      { id: 'test3', stage: RECORD_STAGE.TransactionCreated }
    ])
    salesApi.finaliseTransaction.mockResolvedValue({ messageId: `message-${Math.random()}`, status: 'queued' })
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(1)
    expect(db.updateRecordStagingTable).toHaveBeenCalledTimes(1)
    expect(db.updateRecordStagingTable).toHaveBeenCalledWith(TEST_FILENAME, [
      { id: 'test3', stage: RECORD_STAGE.TransactionFinalised, finaliseTransactionId: expect.any(String) }
    ])
  })

  it(`calls finalisation in batches of ${MAX_BATCH_SIZE}`, async () => {
    db.getProcessedRecords.mockReturnValueOnce(
      Array(MAX_BATCH_SIZE + 1).fill({ id: `test-${Math.random()}`, stage: RECORD_STAGE.TransactionCreated })
    )
    salesApi.finaliseTransaction.mockResolvedValue({ messageId: `message-${Math.random()}`, status: 'queued' })
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(MAX_BATCH_SIZE + 1)
    expect(db.updateRecordStagingTable).toHaveBeenCalledTimes(2)
  })

  it('is a no-op if no records require finalisation', async () => {
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).not.toHaveBeenCalled()
    expect(db.updateRecordStagingTable).not.toHaveBeenCalled()
  })
})
