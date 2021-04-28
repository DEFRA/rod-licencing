import { findByAlternateKey, persist, PoclFile } from '@defra-fish/dynamics-lib'
import initialiseServer from '../../server.js'
import { getGlobalOptionSetValue } from '../../../services/reference-data.service.js'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  persist: jest.fn(),
  findByAlternateKey: jest.fn()
}))

let server = null

describe('transaction files handler', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('getTransactionFile', () => {
    it('retrieves an transaction file for a given filename', async () => {
      const testPoclFile = new PoclFile()
      testPoclFile.fileName = 'test.xml'
      testPoclFile.fileSize = '5 KB'
      testPoclFile.status = await getGlobalOptionSetValue(PoclFile.definition.mappings.status.ref, 'Received and Pending')
      findByAlternateKey.mockResolvedValueOnce(testPoclFile)
      const result = await server.inject({ method: 'GET', url: '/transaction-files/test.xml' })
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({
        fileName: 'test.xml',
        fileSize: '5 KB',
        status: {
          id: 910400000,
          label: 'Received and Pending',
          description: 'Received and Pending'
        }
      })
    })

    it('throws 404 errors if the specified transaction file could not be found', async () => {
      findByAlternateKey.mockResolvedValueOnce(null)
      const result = await server.inject({ method: 'GET', url: '/transaction-files/test.xml' })
      expect(result.statusCode).toBe(404)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Not Found',
        message: 'An transaction file with the given identifier could not be found',
        statusCode: 404
      })
    })
  })

  describe('putTransactionFile', () => {
    it('inserts an transaction file for a given filename', async () => {
      findByAlternateKey.mockResolvedValueOnce(null)
      const result = await server.inject({
        method: 'PUT',
        url: '/transaction-files/testnew.xml',
        payload: { status: 'Received and Pending', fileSize: '5 KB' }
      })
      // expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({
        fileName: 'testnew.xml',
        fileSize: '5 KB'
      })
      expect(persist).toHaveBeenCalledWith([
        expect.objectContaining({
          fileName: 'testnew.xml',
          fileSize: '5 KB',
          status: expect.objectContaining(await getGlobalOptionSetValue(PoclFile.definition.mappings.status.ref, 'Received and Pending'))
        })
      ])
    })

    it('updates an transaction file for a given filename', async () => {
      const testPoclFile = new PoclFile()
      testPoclFile.fileName = 'test.xml'
      testPoclFile.fileSize = '5 KB'
      findByAlternateKey.mockResolvedValueOnce(testPoclFile)
      const result = await server.inject({ method: 'PUT', url: '/transaction-files/test.xml', payload: { status: 'Received and Pending' } })
      // expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({
        fileName: 'test.xml',
        fileSize: '5 KB'
      })
      expect(persist).toHaveBeenCalledWith([testPoclFile])
    })

    it('throws 422 errors if the payload was invalid', async () => {
      findByAlternateKey.mockResolvedValueOnce(null)
      const result = await server.inject({ method: 'PUT', url: '/transaction-files/test.xml', payload: {} })
      expect(result.statusCode).toBe(422)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unprocessable Entity',
        message: 'Invalid payload: "status" is required',
        statusCode: 422
      })
    })
  })
})
