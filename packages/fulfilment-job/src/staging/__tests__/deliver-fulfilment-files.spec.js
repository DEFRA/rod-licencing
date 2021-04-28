import { Readable, PassThrough } from 'stream'
import { deliverFulfilmentFiles } from '../deliver-fulfilment-files.js'
import { createS3WriteStream, readS3PartFiles } from '../../transport/s3.js'
import { createFtpWriteStream } from '../../transport/ftp.js'
import { FULFILMENT_FILE_STATUS_OPTIONSET, getOptionSetEntry } from '../staging-common.js'
import { FulfilmentRequestFile, executeQuery, persist } from '@defra-fish/dynamics-lib'

jest.mock('../../config.js')
jest.mock('../../transport/s3.js')
jest.mock('../../transport/ftp.js')
jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(),
  persist: jest.fn()
}))

describe('deliverFulfilmentFiles', () => {
  beforeEach(jest.clearAllMocks)

  it('delivers all fulfilment files marked with the Exported status to the fulfilment provider', async () => {
    const mockFulfilmentRequestFile1 = Object.assign(new FulfilmentRequestFile(), {
      fileName: 'EAFF202006180001.json',
      date: '2020-06-18T11:47:32.982Z',
      notes: 'The fulfilment file finished exporting at 2020-06-18T11:47:32.982Z',
      numberOfRequests: 2,
      status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported')
    })
    const mockFulfilmentRequestFile2 = Object.assign(new FulfilmentRequestFile(), {
      fileName: 'EAFF202006180002.json',
      date: '2020-06-18T11:47:33.982Z',
      notes: 'The fulfilment file finished exporting at 2020-06-18T11:47:33.982Z',
      numberOfRequests: 2,
      status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported')
    })
    // Reverse order to ensure files are sent in ascending order according to their sequence number
    executeQuery.mockResolvedValue([{ entity: mockFulfilmentRequestFile2 }, { entity: mockFulfilmentRequestFile1 }])

    // Part file data for all files
    readS3PartFiles.mockImplementation(jest.fn(async () => [Readable.from(['{"part": 0}']), Readable.from(['{"part": 1}'])]))

    // Streams for file1
    const s3DataStreamFile1 = createTestableStream()
    const ftpDataStreamFile1 = createTestableStream()
    createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3DataStreamFile1, managedUpload: Promise.resolve() })
    createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpDataStreamFile1, managedUpload: Promise.resolve() })
    const s3HashStreamFile1 = createTestableStream()
    const ftpHashStreamFile1 = createTestableStream()
    createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3HashStreamFile1, managedUpload: Promise.resolve() })
    createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpHashStreamFile1, managedUpload: Promise.resolve() })

    // Streams for file2
    const s3DataStreamFile2 = createTestableStream()
    const ftpDataStreamFile2 = createTestableStream()
    createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3DataStreamFile2, managedUpload: Promise.resolve() })
    createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpDataStreamFile2, managedUpload: Promise.resolve() })
    const s3HashStreamFile2 = createTestableStream()
    const ftpHashStreamFile2 = createTestableStream()
    createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3HashStreamFile2, managedUpload: Promise.resolve() })
    createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpHashStreamFile2, managedUpload: Promise.resolve() })

    // Run the delivery
    await expect(deliverFulfilmentFiles()).resolves.toBeUndefined()

    expect(readS3PartFiles).toHaveBeenCalledWith(mockFulfilmentRequestFile1)

    // File 1 expectations
    expect(createS3WriteStream).toHaveBeenNthCalledWith(1, 'EAFF202006180001.json')
    expect(createS3WriteStream).toHaveBeenNthCalledWith(2, 'EAFF202006180001.json.sha256')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(1, 'EAFF202006180001.json')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(2, 'EAFF202006180001.json.sha256')
    expect(JSON.parse(s3DataStreamFile1.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(JSON.parse(ftpDataStreamFile1.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(s3HashStreamFile1.dataProcessed).toEqual('f89f5dd268a8b02758e08d3b806d0695da94b84978954e281ccaba7eb838791a') // validated
    expect(ftpHashStreamFile1.dataProcessed).toEqual('f89f5dd268a8b02758e08d3b806d0695da94b84978954e281ccaba7eb838791a') // validated

    // File 2 expectations
    expect(createS3WriteStream).toHaveBeenNthCalledWith(3, 'EAFF202006180002.json')
    expect(createS3WriteStream).toHaveBeenNthCalledWith(4, 'EAFF202006180002.json.sha256')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(3, 'EAFF202006180002.json')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(4, 'EAFF202006180002.json.sha256')
    expect(JSON.parse(s3DataStreamFile2.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(JSON.parse(ftpDataStreamFile2.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(s3HashStreamFile2.dataProcessed).toEqual('f89f5dd268a8b02758e08d3b806d0695da94b84978954e281ccaba7eb838791a') // validated
    expect(ftpHashStreamFile2.dataProcessed).toEqual('f89f5dd268a8b02758e08d3b806d0695da94b84978954e281ccaba7eb838791a') // validated

    // Persist to dynamics for file 1
    expect(persist).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({
        fileName: 'EAFF202006180001.json',
        date: '2020-06-18T11:47:32.982Z',
        deliveryTimestamp: expect.any(String),
        notes: expect.stringMatching(/The fulfilment file was successfully delivered at .+/),
        numberOfRequests: 2,
        status: expect.objectContaining({
          description: 'Delivered',
          id: 910400001,
          label: 'Delivered'
        })
      })
    ])
    // Persist to dynamics for file 2
    expect(persist).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({
        fileName: 'EAFF202006180002.json',
        date: '2020-06-18T11:47:33.982Z',
        deliveryTimestamp: expect.any(String),
        notes: expect.stringMatching(/The fulfilment file was successfully delivered at .+/),
        numberOfRequests: 2,
        status: expect.objectContaining({
          description: 'Delivered',
          id: 910400001,
          label: 'Delivered'
        })
      })
    ])
  })
})

const createTestableStream = () => {
  const stream = new PassThrough()
  stream.dataProcessed = ''
  stream.on('data', data => {
    stream.dataProcessed += data
  })
  return stream
}
