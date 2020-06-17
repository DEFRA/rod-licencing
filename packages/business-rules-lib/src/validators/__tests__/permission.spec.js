import Joi from '@hapi/joi'
import each from 'jest-each'
import * as permissionValidation from '../permission.js'

describe('permission validators', () => {
  describe('permissionNumberValidator', () => {
    each(['00310321-2DC3FAS-F4A315', ' 00310321-2DC3FAS-F4Z315 ']).it('validates the permission number "%s"', async number => {
      await expect(permissionValidation.createPermissionNumberValidator(Joi).validateAsync(number)).resolves.toEqual(number.trim())
    })
  })
  describe('permissionNumberUniqueComponentValidator', () => {
    each(['F4A315', ' F4Z315 ']).it('validates the permission number "%s"', async number => {
      await expect(permissionValidation.permissionNumberUniqueComponentValidator(Joi).validateAsync(number)).resolves.toEqual(number.trim())
    })
  })
})
