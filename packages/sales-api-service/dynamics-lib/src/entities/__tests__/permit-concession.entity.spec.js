import { PermitConcession } from '../../index'

describe('permit-concession entity', () => {
  it('maps from dynamics', async () => {
    const permitConcessionMapping = PermitConcession.fromResponse(
      {
        defra_defra_concession_defra_permitid: '42690276-a9c3-e611-80eb-c4346bad01b4',
        defra_concessionid: 'd0ece997-ef65-e611-80dc-c4346bad4004',
        defra_permitid: 'c9c85894-62b2-e611-80e6-c4346bac9e04'
      },
      {}
    )
    const expectedFields = {
      id: '42690276-a9c3-e611-80eb-c4346bad01b4',
      concessionId: 'd0ece997-ef65-e611-80dc-c4346bad4004',
      permitId: 'c9c85894-62b2-e611-80e6-c4346bac9e04'
    }

    expect(permitConcessionMapping).toBeInstanceOf(PermitConcession)
    expect(permitConcessionMapping).toMatchObject(expect.objectContaining(expectedFields))
    expect(permitConcessionMapping.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(permitConcessionMapping.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })
})
