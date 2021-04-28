import {
  Contact,
  Permission,
  persist,
  retrieveMultiple,
  findById,
  findByAlternateKey,
  findByExample,
  executePagedQuery,
  executeQuery,
  retrieveMultipleAsMap,
  retrieveGlobalOptionSets
} from '../../index.js'
import TestEntity from '../../__mocks__/TestEntity.js'
import { v4 as uuidv4 } from 'uuid'
import MockDynamicsWebApi from 'dynamics-web-api'
import { PredefinedQuery } from '../../queries/predefined-query.js'
import { BaseEntity, EntityDefinition } from '../../entities/base.entity.js'

describe('entity manager', () => {
  beforeEach(async () => {
    MockDynamicsWebApi.__reset()
  })

  describe('persist', () => {
    it('persists a new entity using the create operation', async () => {
      const resultUuid = uuidv4()
      MockDynamicsWebApi.__setResponse('executeBatch', [resultUuid])

      const t = new TestEntity()
      t.strVal = 'Fester'
      t.intVal = 1
      t.boolVal = true

      const result = await persist([t])
      expect(MockDynamicsWebApi.prototype.createRequest).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(resultUuid)
    })

    it('persists an existing entity using the update operation', async () => {
      const resultUuid = uuidv4()
      MockDynamicsWebApi.__setResponse('executeBatch', [resultUuid])

      const t = TestEntity.fromResponse(
        {
          '@odata.etag': 'W/"202465000"',
          idval: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          strval: 'Fester',
          intval: 1,
          boolval: true
        },
        {}
      )

      const result = await persist([t])
      expect(MockDynamicsWebApi.prototype.updateRequest).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(resultUuid)
    })

    it('persists a new entity by impersonating the user', async () => {
      const resultUuid = uuidv4()
      MockDynamicsWebApi.__setResponse('executeBatch', [resultUuid])

      const t = new TestEntity()
      t.strVal = 'Fester'
      t.intVal = 1
      t.boolVal = true

      const result = await persist([t], 'foo')
      expect(MockDynamicsWebApi.prototype.createRequest).toHaveBeenCalled()
      expect(MockDynamicsWebApi.prototype.executeBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          impersonateAAD: 'foo'
        })
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(resultUuid)
    })

    it('throws an error object on failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      MockDynamicsWebApi.__throwWithErrorsOnBatchExecute()
      const newEntity = Object.assign(new TestEntity(), { strVal: 'test', intVal: 0 })
      const existingEntity = TestEntity.fromResponse(
        {
          '@odata.etag': 'W/"202465000"',
          idval: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          strval: 'Fester',
          intval: 1,
          boolval: true
        },
        {}
      )
      await expect(persist([newEntity, existingEntity])).rejects.toThrow('Test error')
      // Expect the console error to contain details of the batch data (one createRequest, one updateRequest plus the exception object)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching('Error persisting batch. Data: %j, Exception: %o'),
        expect.arrayContaining([{ createRequest: expect.any(Object) }, { updateRequest: expect.any(Object) }]),
        expect.any(Error)
      )
    })

    it('throws an error on implementation failure', async () => {
      await expect(persist([null])).rejects.toThrow("Cannot read property 'isNew' of null")
    })
  })

  describe('retrieveMultiple', () => {
    it('retrieves a single entity type', async () => {
      MockDynamicsWebApi.__setResponse('executeBatch', [
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_CONTACT',
              contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
              firstname: 'Fester',
              lastname: 'Tester',
              birthdate: '1946-01-01',
              emailaddress1: 'fester@tester.com'
            }
          ]
        }
      ])

      const result = await retrieveMultiple(Contact).execute()
      expect(result).toHaveLength(1)
      const contact = result[0]
      expect(contact).toBeInstanceOf(Contact)
      expect(contact).toMatchObject(
        expect.objectContaining({
          etag: 'EXAMPLE_CONTACT',
          id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          firstName: 'Fester',
          lastName: 'Tester',
          birthDate: '1946-01-01',
          email: 'fester@tester.com'
        })
      )
    })

    it('retrieves a multiple entity types', async () => {
      MockDynamicsWebApi.__setResponse('executeBatch', [
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_CONTACT',
              contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
              firstname: 'Fester',
              lastname: 'Tester',
              birthdate: '1946-01-01',
              emailaddress1: 'fester@tester.com'
            }
          ]
        },
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_PERMISSION',
              defra_permissionid: '347a9083-361e-ea11-a810-000d3a25c5d6',
              defra_name: '00000000-2WC3FDR-CD379B',
              defra_issuedate: '2019-12-13T09:00:00Z',
              defra_startdate: '2019-12-14T00:00:00Z',
              defra_enddate: '2020-12-13T23:59:59Z',
              defra_stagingid: '71ad9a25-2a03-406b-a0e3-f4ff37799374'
            }
          ]
        }
      ])

      const result = await retrieveMultiple(Contact, Permission).execute()
      expect(result).toHaveLength(2)
      const contact = result[0][0]
      expect(contact).toBeInstanceOf(Contact)
      expect(contact).toMatchObject(
        expect.objectContaining({
          etag: 'EXAMPLE_CONTACT',
          id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          firstName: 'Fester',
          lastName: 'Tester',
          birthDate: '1946-01-01',
          email: 'fester@tester.com'
        })
      )

      const permission = result[1][0]
      expect(permission).toBeInstanceOf(Permission)
      expect(permission).toMatchObject(
        expect.objectContaining({
          etag: 'EXAMPLE_PERMISSION',
          id: '347a9083-361e-ea11-a810-000d3a25c5d6',
          referenceNumber: '00000000-2WC3FDR-CD379B',
          issueDate: '2019-12-13T09:00:00Z',
          startDate: '2019-12-14T00:00:00Z',
          endDate: '2020-12-13T23:59:59Z',
          stagingId: '71ad9a25-2a03-406b-a0e3-f4ff37799374'
        })
      )
    })

    it('throws an error object on failure', async () => {
      MockDynamicsWebApi.__throwWithErrorsOnBatchExecute()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(retrieveMultiple(TestEntity).execute()).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('throws an error on implementation failure', async () => {
      MockDynamicsWebApi.__throwWithErrorOn('executeBatch')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(retrieveMultiple(TestEntity).execute()).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('retrieveMultipleAsMap', () => {
    it('retrieves a multiple entity types as a map', async () => {
      MockDynamicsWebApi.__setResponse('executeBatch', [
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_CONTACT',
              contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
              firstname: 'Fester',
              lastname: 'Tester',
              birthdate: '1946-01-01',
              emailaddress1: 'fester@tester.com'
            }
          ]
        },
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_PERMISSION',
              defra_permissionid: '347a9083-361e-ea11-a810-000d3a25c5d6',
              defra_name: '00000000-2WC3FDR-CD379B',
              defra_issuedate: '2019-12-13T09:00:00Z',
              defra_startdate: '2019-12-14T00:00:00Z',
              defra_enddate: '2020-12-13T23:59:59Z',
              defra_stagingid: '71ad9a25-2a03-406b-a0e3-f4ff37799374'
            }
          ]
        }
      ])

      const result = await retrieveMultipleAsMap(Contact, Permission).execute()
      expect(result).toMatchObject({
        contacts: expect.arrayContaining([
          expect.objectContaining({
            etag: 'EXAMPLE_CONTACT',
            id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
            firstName: 'Fester',
            lastName: 'Tester',
            birthDate: '1946-01-01',
            email: 'fester@tester.com'
          })
        ]),
        permissions: expect.arrayContaining([
          expect.objectContaining({
            etag: 'EXAMPLE_PERMISSION',
            id: '347a9083-361e-ea11-a810-000d3a25c5d6',
            referenceNumber: '00000000-2WC3FDR-CD379B',
            issueDate: '2019-12-13T09:00:00Z',
            startDate: '2019-12-14T00:00:00Z',
            endDate: '2020-12-13T23:59:59Z',
            stagingId: '71ad9a25-2a03-406b-a0e3-f4ff37799374'
          })
        ])
      })
    })

    it('throws an error object on failure', async () => {
      MockDynamicsWebApi.__throwWithErrorsOnBatchExecute()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(retrieveMultipleAsMap(TestEntity).execute()).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('throws an error on implementation failure', async () => {
      MockDynamicsWebApi.__throwWithErrorOn('executeBatch')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(retrieveMultipleAsMap(TestEntity).execute()).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  const optionSetInstance = {
    name: expect.stringMatching(/^[a-z]+_?[a-z]+$/),
    options: expect.objectContaining({
      910400000: expect.objectContaining({
        id: 910400000,
        label: expect.anything(),
        description: expect.anything()
      })
    })
  }

  describe('retrieveGlobalOptionSets', () => {
    it('retrieves a full listing', async () => {
      const result = await retrieveGlobalOptionSets().execute()
      expect(result).toMatchObject({
        defra_concessionproof: expect.objectContaining(optionSetInstance),
        defra_country: expect.objectContaining(optionSetInstance),
        defra_datasource: expect.objectContaining(optionSetInstance),
        defra_datatype: expect.objectContaining(optionSetInstance),
        defra_daymonthyear: expect.objectContaining(optionSetInstance),
        defra_duration: expect.objectContaining(optionSetInstance),
        defra_environmentagencyarea: expect.objectContaining(optionSetInstance),
        defra_financialtransactionsource: expect.objectContaining(optionSetInstance),
        defra_financialtransactiontype: expect.objectContaining(optionSetInstance),
        defra_fulfilmentrequestfilestatus: expect.objectContaining(optionSetInstance),
        defra_fulfilmentrequeststatus: expect.objectContaining(optionSetInstance),
        defra_notificationstatus: expect.objectContaining(optionSetInstance),
        defra_paymenttype: expect.objectContaining(optionSetInstance),
        defra_permitsubtype: expect.objectContaining(optionSetInstance),
        defra_permittype: expect.objectContaining(optionSetInstance),
        defra_poclfiledataerrorstatus: expect.objectContaining(optionSetInstance),
        defra_poclfiledataerrortype: expect.objectContaining(optionSetInstance),
        defra_poclfilestatus: expect.objectContaining(optionSetInstance),
        defra_preferredcontactmethod: expect.objectContaining(optionSetInstance)
      })
    })

    it('throws an error object on failure', async () => {
      MockDynamicsWebApi.__throwWithErrorOn('retrieveGlobalOptionSets')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(retrieveGlobalOptionSets().execute()).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('finds by a primary key guid', async () => {
      MockDynamicsWebApi.__setResponse('retrieveRequest', {
        '@odata.etag': 'W/"202465000"',
        idval: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
        strval: 'example'
      })

      const result = await findById(TestEntity, '9f1b34a0-0c66-e611-80dc-c4346bad0190')
      expect(MockDynamicsWebApi.prototype.retrieveRequest).toBeCalledWith({
        key: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select
      })
      expect(result).toBeInstanceOf(TestEntity)
    })

    it('returns null if not found', async () => {
      const notFoundError = new Error('Not found')
      notFoundError.status = 404
      MockDynamicsWebApi.__throwWithErrorOn('retrieveRequest', notFoundError)
      const result = await findById(TestEntity, '9f1b34a0-0c66-e611-80dc-c4346bad0190')
      expect(result).toEqual(null)
    })

    it('throws an exception on general errors', async () => {
      MockDynamicsWebApi.__throwWithErrorOn('retrieveRequest')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(findById(TestEntity, '9f1b34a0-0c66-e611-80dc-c4346bad0190')).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('findByAlternateKey', () => {
    it('finds by an alternate key', async () => {
      MockDynamicsWebApi.__setResponse('retrieveRequest', {
        '@odata.etag': 'W/"202465000"',
        idval: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
        strval: 'example'
      })
      const result = await findByAlternateKey(TestEntity, 'example')
      expect(MockDynamicsWebApi.prototype.retrieveRequest).toBeCalledWith({
        key: "strval='example'",
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select
      })

      expect(result).toBeInstanceOf(TestEntity)
    })

    it('escapes special characters in the key', async () => {
      MockDynamicsWebApi.__setResponse('retrieveRequest', {
        '@odata.etag': 'W/"202465000"',
        idval: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
        strval: 'example'
      })
      const result = await findByAlternateKey(TestEntity, "test & example'")
      expect(MockDynamicsWebApi.prototype.retrieveRequest).toBeCalledWith({
        key: "strval='test %26 example'''",
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select
      })

      expect(result).toBeInstanceOf(TestEntity)
    })
  })

  describe('findByExample', () => {
    it('builds a select statement appropriate to the type definition for each field', async () => {
      MockDynamicsWebApi.__setResponse('retrieveMultipleRequest', { value: [{}] })

      const lookup = new TestEntity()
      lookup.strVal = 'StringData'
      lookup.intVal = 123
      lookup.decVal = 123.45
      lookup.boolVal = true
      lookup.dateVal = '1946-01-01'
      lookup.dateTimeVal = '1946-01-01T01:02:03Z'
      lookup.optionSetVal = { id: 910400000, label: 'test', description: 'test' }
      const expectedLookupSelect =
        "strval eq 'StringData' and intval eq 123 and decval eq 123.45 and boolval eq true and dateval eq 1946-01-01 and datetimeval eq 1946-01-01T01:02:03Z and optionsetval eq 910400000"
      const result = await findByExample(lookup)
      expect(MockDynamicsWebApi.prototype.retrieveMultipleRequest).toBeCalledWith({
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select,
        filter: expect.stringMatching(`${TestEntity.definition.defaultFilter} and ${expectedLookupSelect}`)
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(TestEntity)
    })

    it('does not require the entity to define a default filter', async () => {
      MockDynamicsWebApi.__setResponse('retrieveMultipleRequest', { value: [{}] })

      class SameEntity extends BaseEntity {
        static _definition = new EntityDefinition(() => ({
          localName: 'sampleEntity',
          dynamicsCollection: 'sample',
          mappings: {
            id: { field: 'idval', type: 'string' },
            testVal: { field: 'testval', type: 'string' }
          }
        }))

        /**
         * @returns {EntityDefinition} the definition providing mappings between Dynamics entity and the local entity
         */
        static get definition () {
          return SameEntity._definition
        }

        /**
         * The testVal field
         * @type {string}
         */
        get testVal () {
          return super._getState('testVal')
        }

        set testVal (testVal) {
          super._setState('testVal', testVal)
        }
      }

      const lookup = new SameEntity()
      lookup.testVal = 'StringData'
      const expectedLookupSelect = "testval eq 'StringData'"
      const result = await findByExample(lookup)
      expect(MockDynamicsWebApi.prototype.retrieveMultipleRequest).toBeCalledWith({
        collection: SameEntity.definition.dynamicsCollection,
        select: SameEntity.definition.select,
        filter: expect.stringMatching(`${expectedLookupSelect}`)
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(SameEntity)
    })

    it('only serializes fields into the select statement if they are set', async () => {
      MockDynamicsWebApi.__setResponse('retrieveMultipleRequest', { value: [{}] })

      const lookup = new TestEntity()
      lookup.strVal = 'StringData'
      const expectedLookupSelect = "strval eq 'StringData'"
      const result = await findByExample(lookup)
      expect(MockDynamicsWebApi.prototype.retrieveMultipleRequest).toBeCalledWith({
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select,
        filter: expect.stringMatching(`${TestEntity.definition.defaultFilter} and ${expectedLookupSelect}`)
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(TestEntity)
    })

    it('throws an error object on failure', async () => {
      MockDynamicsWebApi.__throwWithErrorOn('retrieveMultipleRequest')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(findByExample(new TestEntity())).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('executeQuery', () => {
    it('calls retrieveMultipleRequest on the Dynamics API with the request data', async () => {
      MockDynamicsWebApi.__setResponse('retrieveMultipleRequest', {
        value: [
          {
            '@odata.etag': 'W/"202465000"',
            idval: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
            strval: 'example'
          }
        ]
      })

      const result = await executeQuery(new PredefinedQuery({ root: TestEntity, filter: "strval eq 'example'" }))
      expect(MockDynamicsWebApi.prototype.retrieveMultipleRequest).toBeCalledWith({
        collection: TestEntity.definition.dynamicsCollection,
        filter: "strval eq 'example'",
        select: TestEntity.definition.select
      })
      expect(result).toContainEqual({
        entity: expect.any(TestEntity),
        expanded: {}
      })
    })

    it('throws an error object on failure', async () => {
      MockDynamicsWebApi.__throwWithErrorOn('retrieveMultipleRequest')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(executeQuery(new PredefinedQuery({ root: TestEntity, filter: "strval eq 'example'" }))).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('executePagedQuery', () => {
    beforeEach(async () => {
      MockDynamicsWebApi.__reset()
      MockDynamicsWebApi.__setNextResponses(
        'retrieveMultipleRequest',
        {
          value: [
            {
              '@odata.etag': 'RECORD 1',
              idval: 'RECORD 1'
            },
            {
              '@odata.etag': 'RECORD 2',
              idval: 'RECORD 2'
            }
          ],
          oDataNextLink: 'http://example.com/nextlink1'
        },
        {
          value: [
            {
              '@odata.etag': 'RECORD 3',
              idval: 'RECORD 3'
            }
          ]
        }
      )
    })

    it('makes successive requests to retrieve all records while oDataNextLink is returned in the response', async () => {
      const results = []
      /**
       * @param {Array<PredefinedQueryResult<TestEntity>>} page
       * @returns {Promise<void>}
       */
      const onPageReceived = async page => {
        results.push(...page)
      }
      await executePagedQuery(new PredefinedQuery({ root: TestEntity, filter: "strval eq 'example'" }), onPageReceived)
      expect(results).toHaveLength(3)
      expect(results).toStrictEqual(
        expect.arrayContaining([
          { entity: expect.objectContaining({ id: 'RECORD 1' }), expanded: {} },
          { entity: expect.objectContaining({ id: 'RECORD 2' }), expanded: {} },
          { entity: expect.objectContaining({ id: 'RECORD 3' }), expanded: {} }
        ])
      )
    })

    it('allows the maximum number of pages to be capped', async () => {
      const results = []
      /**
       * @param {Array<PredefinedQueryResult<TestEntity>>} page
       * @returns {Promise<void>}
       */
      const onPageReceived = async page => {
        results.push(...page)
      }
      await executePagedQuery(new PredefinedQuery({ root: TestEntity, filter: "strval eq 'example'" }), onPageReceived, 1)
      expect(results).toHaveLength(2)
      expect(results).toStrictEqual(
        expect.arrayContaining([
          { entity: expect.objectContaining({ id: 'RECORD 1' }), expanded: {} },
          { entity: expect.objectContaining({ id: 'RECORD 2' }), expanded: {} }
        ])
      )
    })

    it('throws an error object on failure', async () => {
      MockDynamicsWebApi.__throwWithErrorOn('retrieveMultipleRequest')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      await expect(
        executePagedQuery(new PredefinedQuery({ root: TestEntity, filter: "strval eq 'example'" }), () => {}, 1)
      ).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
