import initialiseServer from '../../server.js'
import { createStagingException, createTransactionFileException, createDataValidationError } from '../../../services/exceptions/exceptions.service.js'

jest.mock('../../../services/exceptions/exceptions.service.js')
jest.mock('../../../schema/validators/validators.js', () => ({
  ...jest.requireActual('../../../schema/validators/validators.js'),
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
}))

let server = null

describe('staging exceptions handler', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(jest.clearAllMocks)

  describe('addStagingException', () => {
    it('adds a staging exception if the payload contains a stagingException object', async () => {
      const stagingException = {
        stagingId: 'string',
        description: 'string',
        transactionJson: 'string',
        exceptionJson: 'string'
      }
      createStagingException.mockResolvedValueOnce(stagingException)
      const result = await server.inject({ method: 'POST', url: '/stagingExceptions', payload: { stagingException } })
      expect(createStagingException).toHaveBeenCalledWith(stagingException)
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({ stagingException })
    })

    describe('if the payload contains a transactionFileException object', () => {
      let transactionFileException
      beforeEach(() => {
        transactionFileException = {
          name: 'string',
          description: '{ "json": "string" }',
          json: 'string',
          notes: 'string',
          type: 'Failure',
          transactionFile: 'string',
          permissionId: 'string'
        }
        createTransactionFileException.mockResolvedValueOnce(transactionFileException)
        createDataValidationError.mockResolvedValue()
      })

      it('adds a transaction file exception', async () => {
        const result = await server.inject({ method: 'POST', url: '/stagingExceptions', payload: { transactionFileException } })
        expect(createTransactionFileException).toHaveBeenCalledWith(transactionFileException)
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.payload)).toMatchObject({ transactionFileException })
      })

      describe('if the error is a 422', () => {
        it('and record is not in payload, does not creates a data validation error', async () => {
          await server.inject({ method: 'POST', url: '/stagingExceptions', payload: { statusCode: 422, transactionFileException } })
          expect(createDataValidationError).not.toHaveBeenCalled()
        })

        it('and record is in payload, creates a data validation error', async () => {
          const record = {
            id: 'test-id',
            createTransactionPayload: {
              dataSource: 'Post Office Sales',
              serialNumber: '14345-48457J',
              permissions: []
            },
            finaliseTransactionPayload: {
              payment: {
                timestamp: '2020-01-01T14:00:00Z',
                amount: 30,
                source: 'Post Office Sales',
                channelId: '948594',
                method: 'Cash'
              }
            },
            stage: 'Staging',
            createTransactionError: {
              statusCode: 422,
              error: 'Data validation error',
              message: 'Error'
            }
          }
          await server.inject({ method: 'POST', url: '/stagingExceptions', payload: { statusCode: 422, transactionFileException, record } })
          expect(createDataValidationError).toHaveBeenCalledWith(record)
        })
      })
    })

    it('throws 422 errors if the payload was invalid', async () => {
      const result = await server.inject({ method: 'POST', url: '/stagingExceptions', payload: {} })
      expect(result.statusCode).toBe(422)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unprocessable Entity',
        message:
          'Invalid payload: "create-staging-exception-request" must contain at least one of [stagingException, transactionFileException]',
        statusCode: 422
      })
    })
  })
})
