import { PredefinedQuery } from './predefined-query.js'
import { Permission } from '../entities/permission.entity.js'
import { ConcessionProof } from '../entities/concession-proof.entity.js'
import { escapeODataStringValue } from '../client/util.js'

/**
 * Builds a query to retrieve a permission and related entities for a given reference number and related contact information
 *
 * @param permissionReferenceNumber the reference number of the permission used to perform the lookup
 * @param licenseeBirthDate the birth date of the contact associated with the permission
 * @param licenseePostcode the postcode of the contact associated with the permission
 * @returns {PredefinedQuery}
 */
export const permissionForLicensee = (permissionReferenceNumber, licenseeBirthDate, licenseePostcode) => {
  const { licensee, permit, concessionProofs } = Permission.definition.relationships
  const { concession } = ConcessionProof.definition.relationships
  let filter = `endswith(${Permission.definition.mappings.referenceNumber.field}, '${escapeODataStringValue(permissionReferenceNumber)}')`
  filter += ` and ${licensee.property}/${licensee.entity.definition.mappings.postcode.field} eq '${escapeODataStringValue(
    licenseePostcode
  )}'`
  filter += ` and ${licensee.property}/${licensee.entity.definition.mappings.birthDate.field} eq ${licenseeBirthDate}`
  filter += ` and ${Permission.definition.defaultFilter}`
  return new PredefinedQuery({
    root: Permission,
    filter: filter,
    expand: [licensee, permit, { ...concessionProofs, expand: [concession] }]
  })
}
