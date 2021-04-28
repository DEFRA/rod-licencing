import moment from 'moment'
import { createPartFiles } from '../create-part-files.js'
import { writeS3PartFile } from '../../transport/s3.js'
import config from '../../config.js'
import { FulfilmentRequestFile, FulfilmentRequest, executePagedQuery, executeQuery, persist } from '@defra-fish/dynamics-lib'
import {
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY
} from '../../../../sales-api-service/src/__mocks__/test-data.js'
import { FULFILMENT_FILE_STATUS_OPTIONSET, getOptionSetEntry } from '../staging-common.js'
const EXECUTION_DATE = moment()

jest.mock('../../config.js', () => ({
  file: {
    size: 1,
    partFileSize: 1
  }
}))

jest.mock('../../transport/s3.js')
jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(),
  executePagedQuery: jest.fn(),
  persist: jest.fn()
}))

const mockFulfilmentRequest = Object.assign(new FulfilmentRequest(), {
  referenceNumber: `test${MOCK_EXISTING_PERMISSION_ENTITY.referenceNumber.substring(
    MOCK_EXISTING_PERMISSION_ENTITY.referenceNumber.lastIndexOf('-')
  )}`,
  requestTimestamp: EXECUTION_DATE.toISOString(),
  notes: 'Initial fulfilment request created at point of sale',
  status: { id: 910400000, label: 'Pending', description: 'Pending' }
})

const mockFulfilmentRequestQueryResult = {
  entity: Object.assign(new FulfilmentRequest(), mockFulfilmentRequest),
  expanded: {
    permission: {
      entity: MOCK_EXISTING_PERMISSION_ENTITY,
      expanded: {
        licensee: {
          entity: MOCK_EXISTING_CONTACT_ENTITY
        },
        permit: {
          entity: MOCK_12MONTH_SENIOR_PERMIT
        }
      }
    }
  }
}

describe('createPartFiles', () => {
  beforeEach(jest.clearAllMocks)

  it('queries dynamics for data and writes a part file', async () => {
    const fulfilmentFileExpectations = expect.objectContaining({
      fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`,
      date: expect.anything(),
      notes: expect.stringMatching(/^The fulfilment file finished exporting at .+/),
      numberOfRequests: 1,
      status: expect.objectContaining({ id: 910400004, label: 'Exported', description: 'Exported' })
    })
    const fulfilmentRequestExpectations = expect.objectContaining(
      Object.assign(mockFulfilmentRequest.toJSON(), {
        status: expect.objectContaining({ id: 910400001, label: 'Sent', description: 'Sent' })
      })
    )

    executePagedQuery.mockImplementation(jest.fn(async (query, onPageReceived) => onPageReceived([mockFulfilmentRequestQueryResult])))
    executeQuery.mockImplementation(jest.fn(async () => []))
    await expect(createPartFiles()).resolves.toBeUndefined()
    expect(writeS3PartFile).toHaveBeenCalledWith(
      fulfilmentFileExpectations,
      0,
      expect.arrayContaining([
        {
          fulfilmentRequest: fulfilmentRequestExpectations,
          licensee: MOCK_EXISTING_CONTACT_ENTITY,
          permission: MOCK_EXISTING_PERMISSION_ENTITY,
          permit: MOCK_12MONTH_SENIOR_PERMIT
        }
      ])
    )
    expect(persist).toHaveBeenCalledTimes(1)
    expect(persist).toHaveBeenCalledWith([fulfilmentFileExpectations, fulfilmentRequestExpectations])
  })

  it('calculates the next file in the sequence correctly', async () => {
    const fulfilmentFileExpectations = expect.objectContaining({
      fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}1010.json`,
      date: expect.anything(),
      notes: expect.stringMatching(/^The fulfilment file finished exporting at .+/),
      numberOfRequests: 1,
      status: expect.objectContaining({ id: 910400004, label: 'Exported', description: 'Exported' })
    })
    const fulfilmentRequestExpectations = expect.objectContaining(
      Object.assign(mockFulfilmentRequest.toJSON(), {
        status: expect.objectContaining({ id: 910400001, label: 'Sent', description: 'Sent' })
      })
    )

    executePagedQuery.mockImplementation(jest.fn(async (query, onPageReceived) => onPageReceived([mockFulfilmentRequestQueryResult])))
    executeQuery.mockImplementation(
      jest.fn(async () => [
        { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0003.json`, status: { label: 'Delivered' } } },
        { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0002.json`, status: { label: 'Delivered' } } },
        { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}1009.json`, status: { label: 'Delivered' } } },
        { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`, status: { label: 'Delivered' } } },
        { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0006.json`, status: { label: 'Delivered' } } }
      ])
    )
    await expect(createPartFiles()).resolves.toBeUndefined()
    expect(writeS3PartFile).toHaveBeenCalledWith(
      fulfilmentFileExpectations,
      0,
      expect.arrayContaining([
        {
          fulfilmentRequest: fulfilmentRequestExpectations,
          licensee: MOCK_EXISTING_CONTACT_ENTITY,
          permission: MOCK_EXISTING_PERMISSION_ENTITY,
          permit: MOCK_12MONTH_SENIOR_PERMIT
        }
      ])
    )
    expect(persist).toHaveBeenCalledTimes(1)
    expect(persist).toHaveBeenCalledWith([fulfilmentFileExpectations, fulfilmentRequestExpectations])
  })

  it('will write multiple part files as necessary', async () => {
    config.file.size = 2
    const fulfilmentRequestExpectations = expect.objectContaining(
      Object.assign(mockFulfilmentRequest.toJSON(), {
        status: expect.objectContaining({ id: 910400001, label: 'Sent', description: 'Sent' })
      })
    )

    executePagedQuery.mockImplementation(
      jest.fn(async (query, onPageReceived) => {
        // Simulate multiple pages of data
        await onPageReceived([mockFulfilmentRequestQueryResult])
        await onPageReceived([mockFulfilmentRequestQueryResult])
      })
    )
    executeQuery.mockImplementationOnce(jest.fn(async () => []))
    executeQuery.mockImplementationOnce(jest.fn(async () => [await createMockFulfilmentFileQueryResult(1, 'Pending', 1)]))
    executeQuery.mockImplementationOnce(jest.fn(async () => [await createMockFulfilmentFileQueryResult(1, 'Pending', 2)]))
    await expect(createPartFiles()).resolves.toBeUndefined()
    expect(writeS3PartFile).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`,
        date: expect.anything(),
        notes: expect.stringMatching(/^The fulfilment file is currently being populated prior to exporting.$/),
        numberOfRequests: 1,
        status: expect.objectContaining({ id: 910400000, label: 'Pending', description: 'Pending' })
      }),
      0,
      expect.arrayContaining([
        {
          fulfilmentRequest: fulfilmentRequestExpectations,
          licensee: MOCK_EXISTING_CONTACT_ENTITY,
          permission: MOCK_EXISTING_PERMISSION_ENTITY,
          permit: MOCK_12MONTH_SENIOR_PERMIT
        }
      ])
    )
    expect(writeS3PartFile).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`,
        date: expect.anything(),
        notes: expect.stringMatching(/^The fulfilment file finished exporting at .+/),
        numberOfRequests: 2,
        status: expect.objectContaining({ id: 910400004, label: 'Exported', description: 'Exported' })
      }),
      1,
      expect.arrayContaining([
        {
          fulfilmentRequest: fulfilmentRequestExpectations,
          licensee: MOCK_EXISTING_CONTACT_ENTITY,
          permission: MOCK_EXISTING_PERMISSION_ENTITY,
          permit: MOCK_12MONTH_SENIOR_PERMIT
        }
      ])
    )
    expect(persist).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({
        fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`,
        date: expect.anything(),
        notes: expect.stringMatching(/^The fulfilment file is currently being populated prior to exporting.$/),
        numberOfRequests: 1,
        status: expect.objectContaining({ id: 910400000, label: 'Pending', description: 'Pending' })
      }),
      fulfilmentRequestExpectations
    ])
    expect(persist).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({
        fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`,
        date: expect.anything(),
        notes: expect.stringMatching(/^The fulfilment file finished exporting at .+/),
        numberOfRequests: 2,
        status: expect.objectContaining({ id: 910400004, label: 'Exported', description: 'Exported' })
      }),
      fulfilmentRequestExpectations
    ])
    expect(persist).toHaveBeenNthCalledWith(3, [
      expect.objectContaining({
        fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`,
        date: expect.anything(),
        notes: expect.stringMatching(/^The fulfilment file finished exporting at .+/),
        numberOfRequests: 2,
        status: expect.objectContaining({ id: 910400004, label: 'Exported', description: 'Exported' })
      })
    ])
  })
})

const createMockFulfilmentFileQueryResult = async (sequenceNo, statusLabel, numberOfRequests = 0) => ({
  entity: Object.assign(new FulfilmentRequestFile(), {
    fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}${String(sequenceNo).padStart(4, '0')}.json`,
    date: EXECUTION_DATE.toISOString(),
    notes: 'The fulfilment file is currently being populated prior to exporting.',
    numberOfRequests: numberOfRequests,
    status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, statusLabel)
  })
})
