import Project from '../../project.cjs'
import { createTransactions } from '../create-transactions.js'
import { RECORD_STAGE, MAX_CREATE_TRANSACTION_BATCH_SIZE } from '../constants.js'
import * as db from '../../io/db.js'
import { v4 as uuidv4 } from 'uuid'
import { salesApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    ...Object.keys(jest.requireActual('@defra-fish/connectors-lib').salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn() }), {}),
    ...['permits', 'concessions'].reduce((acc, m) => ({ ...acc, [m]: { find: jest.fn(() => ({ id: 'test' })) } }), {})
  }
}))
jest.mock('../../io/db.js', () => ({
  updateRecordStagingTable: jest.fn(),
  getProcessedRecords: jest.fn(() => [])
}))

describe('create-transactions', () => {
  beforeAll(() => {
    process.env.POCL_FILE_STAGING_TABLE = 'TestFileTable'
    process.env.POCL_RECORD_STAGING_TABLE = 'TestRecordTable'
  })
  beforeEach(jest.clearAllMocks)

  it('stages the 2 record test file (under batch-size boundary)', async () => {
    salesApi.createTransactions.mockReturnValue(generateApiSuccessResponse(2))
    await createTransactions(`${Project.root}/src/__mocks__/test-2-records.xml`)
    expectCreateTransactionCalls(2)
    expect(db.updateRecordStagingTable.mock.calls).toHaveLength(2)
    // First call to update records which were successfully created
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toHaveLength(2)
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createTransactionId: expect.any(String),
          stage: RECORD_STAGE.TransactionCreated
        })
      ])
    )
    // Second call to update records which failed (there shouldn't be any for this test)
    expect(db.updateRecordStagingTable.mock.calls[1][1]).toHaveLength(0)
  })

  it('stages the 25 record test file (on batch-size boundary)', async () => {
    salesApi.createTransactions.mockReturnValue(generateApiSuccessResponse(MAX_CREATE_TRANSACTION_BATCH_SIZE))
    await createTransactions(`${Project.root}/src/__mocks__/test-25-records.xml`)
    expectCreateTransactionCalls(MAX_CREATE_TRANSACTION_BATCH_SIZE)
    // First call to update records which were successfully created
    expect(db.updateRecordStagingTable.mock.calls).toHaveLength(2)
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toHaveLength(MAX_CREATE_TRANSACTION_BATCH_SIZE)
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createTransactionId: expect.any(String),
          stage: RECORD_STAGE.TransactionCreated
        })
      ])
    )
    // Second call to update records which failed (there shouldn't be any for this test)
    expect(db.updateRecordStagingTable.mock.calls[1][1]).toHaveLength(0)
  })

  it('stages the 30 record test file (over batch-size boundary)', async () => {
    salesApi.createTransactions.mockReturnValue(generateApiSuccessResponse(30))
    await createTransactions(`${Project.root}/src/__mocks__/test-30-records.xml`)
    expectCreateTransactionCalls(MAX_CREATE_TRANSACTION_BATCH_SIZE, 5)
    expect(db.updateRecordStagingTable.mock.calls).toHaveLength(4)
    // First call of first batch to update records which were successfully created
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toHaveLength(MAX_CREATE_TRANSACTION_BATCH_SIZE)
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createTransactionId: expect.any(String),
          stage: RECORD_STAGE.TransactionCreated
        })
      ])
    )
    // Second call of first batch to update records which failed (there shouldn't be any for this test)
    expect(db.updateRecordStagingTable.mock.calls[1][1]).toHaveLength(0)

    // First call of second batch to update records which were successfully created
    expect(db.updateRecordStagingTable.mock.calls[2][1]).toHaveLength(5)
    expect(db.updateRecordStagingTable.mock.calls[2][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createTransactionId: expect.any(String),
          stage: RECORD_STAGE.TransactionCreated
        })
      ])
    )
    // Second call of second batch to update records which failed (there shouldn't be any for this test)
    expect(db.updateRecordStagingTable.mock.calls[3][1]).toHaveLength(0)
  })

  it('resumes from the second record of the 2 record test file if the first record has already been processed successfully', async () => {
    salesApi.createTransactions.mockReturnValue(generateApiSuccessResponse(1))
    db.getProcessedRecords.mockReturnValueOnce([{ id: 'SERIAL 1', stage: RECORD_STAGE.TransactionCreated }])
    await createTransactions(`${Project.root}/src/__mocks__/test-2-records.xml`)
    expectCreateTransactionCalls(1)
    expect(db.updateRecordStagingTable.mock.calls).toHaveLength(2)
    // First call to update records which were successfully created
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toHaveLength(1)
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createTransactionId: expect.any(String),
          stage: RECORD_STAGE.TransactionCreated
        })
      ])
    )
    // Second call to update records which failed (there shouldn't be any for this test)
    expect(db.updateRecordStagingTable.mock.calls[1][1]).toHaveLength(0)
  })

  it('resumes from the second record of the 2 record test file if the first record has already been processed and failed', async () => {
    salesApi.createTransactions.mockReturnValue(generateApiSuccessResponse(1))
    db.getProcessedRecords.mockReturnValueOnce([{ id: 'SERIAL 1', stage: RECORD_STAGE.TransactionCreationFailed }])
    await createTransactions(`${Project.root}/src/__mocks__/test-2-records.xml`)
    expectCreateTransactionCalls(1)
    expect(db.updateRecordStagingTable.mock.calls).toHaveLength(2)
    // First call to update records which were successfully created
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toHaveLength(1)
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createTransactionId: expect.any(String),
          stage: RECORD_STAGE.TransactionCreated
        })
      ])
    )
    // Second call to update records which failed (there shouldn't be any for this test)
    expect(db.updateRecordStagingTable.mock.calls[1][1]).toHaveLength(0)
  })

  it('handles exceptions', async () => {
    salesApi.createTransactions.mockReturnValue(generateApiResponses(201, 422))
    const fakeApiError = { statusCode: 422, error: 'Fake error', message: 'Fake error message' }
    await createTransactions(`${Project.root}/src/__mocks__/test-2-records.xml`)
    expectCreateTransactionCalls(2)
    expect(db.updateRecordStagingTable.mock.calls).toHaveLength(2)
    expect(db.updateRecordStagingTable.mock.calls[0][1]).toHaveLength(1)
    expect(db.updateRecordStagingTable.mock.calls[0][1][0]).toEqual(
      expect.objectContaining({
        createTransactionId: expect.any(String),
        stage: RECORD_STAGE.TransactionCreated
      })
    )
    expect(db.updateRecordStagingTable.mock.calls[1][1][0]).toEqual(
      expect.objectContaining({
        createTransactionError: fakeApiError,
        createTransactionPayload: expect.objectContaining({}),
        stage: RECORD_STAGE.TransactionCreationFailed
      })
    )
    expect(salesApi.createStagingException).toMatchSnapshot()
  })
})

const expectCreateTransactionCalls = (...arrayLengths) => {
  expect(salesApi.createTransactions).toHaveBeenCalledTimes(arrayLengths.length)
  for (let i = 0; i < arrayLengths.length; i++) {
    const argumentPassedToCreateTransactions = salesApi.createTransactions.mock.calls[i][0]
    expect(argumentPassedToCreateTransactions).toBeInstanceOf(Array)
    expect(argumentPassedToCreateTransactions).toHaveLength(arrayLengths[i])
  }
}

const generateApiSuccessResponse = count => {
  const successResponses = Array(count).fill(201)
  return generateApiResponses(...successResponses)
}
const generateApiResponses = (...responseCodes) => {
  const response = []
  for (let i = 0; i < responseCodes.length; i++) {
    const isSuccess = Math.floor(responseCodes[i] / 100) === 2
    response.push({
      statusCode: responseCodes[i],
      ...(isSuccess ? { response: { id: uuidv4() } } : { error: 'Fake error', message: 'Fake error message' })
    })
  }
  return response
}
