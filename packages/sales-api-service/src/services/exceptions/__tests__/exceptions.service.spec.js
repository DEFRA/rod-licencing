import { createStagingException, createStagingExceptionFromError, createTransactionFileException, createDataValidationError } from '../exceptions.service.js'
import { persist, PoclStagingException, StagingException } from '@defra-fish/dynamics-lib'
import { PoclDataValidationError } from '../temp'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  persist: jest.fn()
}))

const getDataValidationError = () => ({
  id: 'test-id',
  createTransactionPayload: {
    dataSource: 'Post Office Sales',
    serialNumber: '14345-48457J',
    permissions: [{
      licensee: {
        firstName: 'Daniel',
        lastName: 'Ricciardo',
        organisation: 'Fishy Endeavours',
        premises: '14 Howecroft Court',
        street: 'Eastmead Lane',
        town: 'Bristol',
        postcode: 'BS9 1HJ',
        country: 'GB',
        birthDate: '1989-07-01',
        email: 'daniel-ricc@example.com',
        mobilePhone: '07722 123456',
        preferredMethodOfNewsletter: 'Prefer not to be contacted',
        preferredMethodOfConfirmation: 'Email',
        preferredMethodOfReminder: 'Text'
      },
      permitId: 'test-permit-id',
      startDate: '2021-06-15',
      concessions: [{ type: 'Blue Badge', referenceNumber: '123456789' }]
    }]
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
})

expect.extend({
  jsonMatching (received, ...matchers) {
    try {
      const obj = JSON.parse(received)
      for (const matcher of matchers) {
        if (!matcher.asymmetricMatch(obj)) {
          return {
            message: () => `expected ${matcher.toString()} to pass`,
            pass: false
          }
        }
      }
      return {
        pass: true
      }
    } catch (e) {
      return {
        message: () => 'expected a valid json structure',
        pass: false
      }
    }
  }
})

describe('exceptions service', () => {
  describe('createStagingException', () => {
    it('creates a staging exception entity in Dynamics', async () => {
      const stagingException = {
        stagingId: 'string',
        description: 'string',
        transactionJson: 'string',
        exceptionJson: 'string'
      }
      const result = await createStagingException(stagingException)
      expect(persist).toHaveBeenCalledWith([expect.objectContaining(stagingException)])
      expect(result).toBeInstanceOf(StagingException)
    })
  })

  describe('createStagingExceptionFromError', () => {
    it('creates a staging exception entity in Dynamics by parsing the error message', async () => {
      const expectedErrorMessage = 'Error: Fake test error'
      const testError = new Error('Fake test error')
      const testTransaction = { some: 'data' }
      const result = await createStagingExceptionFromError('testStagingId', testError, testTransaction)
      expect(persist).toHaveBeenCalledWith([
        expect.objectContaining({
          stagingId: 'testStagingId',
          description: expectedErrorMessage,
          transactionJson: expect.jsonMatching(expect.objectContaining(testTransaction)),
          exceptionJson: expect.jsonMatching(
            expect.objectContaining({
              stack: expect.arrayContaining([expectedErrorMessage, ...testError.stack.split('\n')])
            })
          )
        })
      ])
      expect(result).toBeInstanceOf(StagingException)
    })

    it('applies different error parsing rules to exceptions originating from a Dynamics call', async () => {
      const expectedErrorMessage = 'Custom dynamics error message'
      const testError = Object.assign(new Error(), { error: { message: expectedErrorMessage } })
      const testTransaction = { some: 'data' }
      const result = await createStagingExceptionFromError('testStagingId', testError, testTransaction)
      expect(persist).toHaveBeenCalledWith([
        expect.objectContaining({
          stagingId: 'testStagingId',
          description: expectedErrorMessage,
          transactionJson: expect.jsonMatching(expect.objectContaining(testTransaction)),
          exceptionJson: expect.jsonMatching(
            expect.objectContaining({
              error: expect.objectContaining({ message: expectedErrorMessage }),
              stack: expect.arrayContaining([...testError.stack.split('\n')])
            })
          )
        })
      ])
      expect(result).toBeInstanceOf(StagingException)
    })
  })

  describe('createTransactionFileException', () => {
    it('creates a pocl staging exception entity in Dynamics', async () => {
      const transactionFileException = {
        name: 'string',
        description: 'string',
        json: 'string',
        notes: 'string',
        type: 'Failure',
        transactionFile: 'string',
        permissionId: 'string'
      }
      const result = await createTransactionFileException(transactionFileException)
      expect(persist).toHaveBeenCalledWith([
        expect.objectContaining({
          ...transactionFileException,
          type: expect.objectContaining({ id: 910400001, label: 'Failure', description: 'Failure' }),
          status: expect.objectContaining({ id: 910400000, label: 'Open', description: 'Open' })
        })
      ])
      expect(result).toBeInstanceOf(PoclStagingException)
    })
  })

  describe('createDataValidationError', () => {
    let record, result
    beforeEach(async () => {
      record = getDataValidationError()
      result = await createDataValidationError(record)
    })

    it('maps the record to an instance of PoclDataValidationError', () => {
      expect(result).toBeInstanceOf(PoclDataValidationError)
    })

    it('maps the record data correctly', () => {
      expect(result).toMatchSnapshot()
    })
  })
})
