import { permissionForLicensee } from '../permission.queries.js'

describe('Permission Queries', () => {
  describe('permissionForLicensee', () => {
    it('builds a filter to run a query for a permission with a given licensee date of birth and postcode', async () => {
      const query = permissionForLicensee('ABC123', '2000-01-01', 'AB12 3CD')
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_permissions',
        expand: expect.arrayContaining([
          expect.objectContaining({ property: 'defra_ContactId' }),
          expect.objectContaining({ property: 'defra_PermitId' }),
          expect.objectContaining({ property: 'defra_defra_permission_defra_concessionproof_PermissionId' })
        ]),
        filter:
          "endswith(defra_name, 'ABC123') and defra_ContactId/defra_postcode eq 'AB12 3CD' and defra_ContactId/birthdate eq 2000-01-01 and statecode eq 0",
        select: expect.any(Array)
      })
    })
  })
})
