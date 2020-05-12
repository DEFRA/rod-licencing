import { permitsOperations } from '../services/sales-api/sales-api-service.js'

const filterPermits = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const permits = await permitsOperations.fetchPermits()
  const permitConcessions = await permitsOperations.fetchPermitConcessions()
  const concessions = await permitsOperations.fetchConcessions()
  const licenseeConcessions = permission.concessions || []

  const permitsJoinPermitConcessions = permits.map(p => ({
    ...p,
    concessions: permitConcessions.filter(pc => pc.permitId === p.permitId).map(pc => concessions.find(c => c.id === pc.concessionId))
  }))

  // Filter the joined list to include every and only those concessions in licenseeConcessions
  const filteredPermitsJoinPermitConcessions = permitsJoinPermitConcessions.filter(
    pjpc =>
      licenseeConcessions.map(lc => lc.type).every(t => pjpc.concessions.map(c => c.name).includes(t)) &&
      pjpc.concessions.length === licenseeConcessions.length
  )

  // Filter by the licence length
  const byLicenceLength = filteredPermitsJoinPermitConcessions.filter(
    p => String(p.durationMagnitude + p.durationDesignator.description) === permission.licenceLength
  )

  // Filter by the licence (sub) type
  const byLicenceType = byLicenceLength.filter(p => p.permitSubtype.label === permission.licenceType)

  // Filter by the number of rods
  const byNumberOfRods = byLicenceType.filter(r => String(r.numberOfRods) === permission.numberOfRods)

  return byNumberOfRods[0]
}

export default filterPermits