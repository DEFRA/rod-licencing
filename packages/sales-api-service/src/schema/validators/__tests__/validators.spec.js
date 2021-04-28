import TestEntity from '@defra-fish/dynamics-lib/src/__mocks__/TestEntity.js'
import { PermitConcession } from '@defra-fish/dynamics-lib'
import { BaseEntity, EntityDefinition } from '@defra-fish/dynamics-lib/src/entities/base.entity.js'
import {
  buildJoiOptionSetValidator,
  createAlternateKeyValidator,
  createOptionSetValidator,
  createEntityIdValidator,
  createPermitConcessionValidator,
  createReferenceDataEntityValidator
} from '../validators.js'

const referenceData = jest.requireActual('../../../services/reference-data.service.js')
const entityManager = jest.requireActual('@defra-fish/dynamics-lib/src/client/entity-manager.js')

describe('validators', () => {
  beforeEach(jest.resetAllMocks)

  describe('buildJoiOptionSetValidator', () => {
    it('returns a Joi validator returning undefined when an optionset is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => 'success')
      const schema = buildJoiOptionSetValidator('testOptionSet', 'Test Example')
      await expect(schema.validateAsync('testValue')).resolves.toEqual('testValue')
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })

    it('returns a Joi validator that requires a value to be present', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue')
      const schema = buildJoiOptionSetValidator('testOptionSet', 'Test Example')
      await expect(schema.validateAsync(undefined)).rejects.toThrow('"value" is required')
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a Joi validator throwing an error when no optionset found', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => null)
      const schema = buildJoiOptionSetValidator('testOptionSet', 'Test Example')
      await expect(schema.validateAsync('testValue')).rejects.toThrow('Value provided is not a recognised testOptionSet')
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })
  })

  describe('createOptionSetValidator', () => {
    it('returns a validation function returning undefined when an optionset is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => 'success')
      const validationFunction = createOptionSetValidator('testOptionSet')
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => 'success')
      const validationFunction = createOptionSetValidator('testOptionSet')
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function throwing an error when no optionset found', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => null)
      const validationFunction = createOptionSetValidator('testOptionSet')
      await expect(validationFunction('testValue')).rejects.toThrow('Value provided is not a recognised testOptionSet')
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })
  })

  describe('createReferenceDataEntityValidator', () => {
    it('returns a validation function returning undefined when a cached reference data entity is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntityAndId').mockImplementation(async () => 'success')
      const validationFunction = createReferenceDataEntityValidator(TestEntity)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntityAndId')
      const validationFunction = createReferenceDataEntityValidator(TestEntity)
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function throwing an error when no reference data entity found', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntityAndId').mockImplementation(async () => null)
      const validationFunction = createReferenceDataEntityValidator(TestEntity)
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised entityTest identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })
  })

  describe('createEntityIdValidator', () => {
    it('returns a validation function returning undefined when an entity is successfully resolved', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = createEntityIdValidator(TestEntity)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('allows the validation result to be cached', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = createEntityIdValidator(TestEntity, { cache: 1 })
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(entityManager, 'findById')
      const validationFunction = createEntityIdValidator(TestEntity, { negate: true })
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function returning undefined when an entity is not resolved and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = createEntityIdValidator(TestEntity, { negate: true })
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when no entity is found', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = createEntityIdValidator(TestEntity)
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised entityTest identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when an entity is found and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = createEntityIdValidator(TestEntity, { negate: true })
      await expect(validationFunction('testValue')).rejects.toThrow('Entity for entityTest identifier already exists')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })
  })

  describe('createAlternateKeyValidator', () => {
    it('returns a validation function returning undefined when an entity is successfully resolved', async () => {
      const spy = jest.spyOn(entityManager, 'findByAlternateKey').mockImplementation(async () => 'success')
      const validationFunction = createAlternateKeyValidator(TestEntity)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('allows the validation result to be cached', async () => {
      const spy = jest.spyOn(entityManager, 'findByAlternateKey').mockImplementation(async () => 'success')
      const validationFunction = createAlternateKeyValidator(TestEntity, { cache: 1 })
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(entityManager, 'findByAlternateKey')
      const validationFunction = createAlternateKeyValidator(TestEntity, { negate: true })
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function returning undefined when an entity is not resolved and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findByAlternateKey').mockImplementation(async () => null)
      const validationFunction = createAlternateKeyValidator(TestEntity, { negate: true })
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when no entity is found', async () => {
      const spy = jest.spyOn(entityManager, 'findByAlternateKey').mockImplementation(async () => null)
      const validationFunction = createAlternateKeyValidator(TestEntity)
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised entityTest identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when an entity is found and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findByAlternateKey').mockImplementation(async () => 'success')
      const validationFunction = createAlternateKeyValidator(TestEntity, { negate: true })
      await expect(validationFunction('testValue')).rejects.toThrow('Entity for entityTest identifier already exists')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('throws if attempting to create an alternate key validator using an object which does not support it', async () => {
      class TestNonAlternateKeyEntity extends BaseEntity {
        static get definition () {
          return new EntityDefinition(() => ({
            localName: 'TestNonAlternateKeyEntity',
            dynamicsCollection: 'TestNonAlternateKeyEntity',
            mappings: { id: { field: 'idval', type: 'string' } }
          }))
        }
      }
      expect(() => createAlternateKeyValidator(TestNonAlternateKeyEntity, true)).toThrow(
        /The entity TestNonAlternateKeyEntity does not support alternate key lookups/
      )
    })
  })

  describe('createPermitConcessionValidator', () => {
    it('returns a validation function returning undefined when the permit and concession are successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [
        {
          permitId: 'test-1',
          concessionId: 'test-1'
        }
      ])
      const validationFunction = createPermitConcessionValidator()
      await expect(
        validationFunction({
          dataSource: 'Web Sales',
          permissions: [
            {
              permitId: 'test-1',
              concessions: [
                {
                  id: 'test-1'
                }
              ]
            }
          ]
        })
      ).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })

    it('returns a validation function throwing an error if the permit and concession are not successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [
        {
          permitId: 'test-1',
          concessionId: 'test-1'
        }
      ])
      const validationFunction = createPermitConcessionValidator()
      await expect(
        validationFunction({
          dataSource: 'Web Sales',
          permissions: [
            {
              permitId: 'test-1',
              concessions: [
                {
                  id: 'test-2'
                }
              ]
            }
          ]
        })
      ).rejects.toThrow("The concession 'test-2' is not valid with respect to the permit 'test-1'")
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })

    it('returns a validation function throwing an error if the permit does not allow concessions but they are supplied', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [{}])
      const validationFunction = createPermitConcessionValidator()
      await expect(
        validationFunction({
          dataSource: 'Web Sales',
          permissions: [
            {
              permitId: 'test-1',
              concessions: [
                {
                  id: 'test-2'
                }
              ]
            }
          ]
        })
      ).rejects.toThrow("The permit 'test-1' does not allow concessions but concession proofs were supplied")
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })

    it('returns a validation function throwing an error if the permission contains duplicate concession proofs', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [
        { permitId: 'test-1', concessionId: 'test-1' },
        { permitId: 'test-1', concessionId: 'test-2' }
      ])
      const validationFunction = createPermitConcessionValidator()
      await expect(
        validationFunction({
          dataSource: 'Web Sales',
          permissions: [
            {
              permitId: 'test-1',
              concessions: [{ id: 'test-1' }, { id: 'test-1' }, { id: 'test-2' }, { id: 'test-2' }]
            }
          ]
        })
      ).rejects.toThrow("The concession ids 'test-1,test-2' appear more than once, duplicates are not permitted")
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })

    it('returns a validation function which skips concession list validation if no concessions are supplied and none are required', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [])
      const validationFunction = createPermitConcessionValidator()
      await expect(
        validationFunction({
          dataSource: 'Web Sales',
          permissions: [
            {
              permitId: 'test-1'
            }
          ]
        })
      ).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [
        {
          dataSource: 'Web Sales',
          permissions: [
            {
              permitId: 'test-1',
              concessionId: 'test-1'
            }
          ]
        }
      ])
      const validationFunction = createPermitConcessionValidator()
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function throwing an error if the permit requires a concession and none is supplied', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [
        {
          permitId: 'test-1',
          concessionId: 'test-1'
        }
      ])
      const validationFunction = createPermitConcessionValidator()
      await expect(
        validationFunction({
          dataSource: 'Web Sales',
          permissions: [
            {
              permitId: 'test-1'
            }
          ]
        })
      ).rejects.toThrow("The permit 'test-1' requires proof of concession however none were supplied")
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })

    it('returns a validation function which does not throw an error for Post Office Sales even if the permit requires a concession and none is supplied', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [
        {
          permitId: 'test-1',
          concessionId: 'test-1'
        }
      ])
      const validationFunction = createPermitConcessionValidator()
      await expect(
        validationFunction({
          dataSource: 'Post Office Sales',
          permissions: [
            {
              permitId: 'test-1'
            }
          ]
        })
      ).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })

    it('returns a validation function which does not throw an error for DDE File even if the permit requires a concession and none is supplied', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntity').mockImplementation(async () => [
        {
          permitId: 'test-1',
          concessionId: 'test-1'
        }
      ])
      const validationFunction = createPermitConcessionValidator()
      await expect(
        validationFunction({
          dataSource: 'DDE File',
          permissions: [
            {
              permitId: 'test-1'
            }
          ]
        })
      ).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })
  })
})
