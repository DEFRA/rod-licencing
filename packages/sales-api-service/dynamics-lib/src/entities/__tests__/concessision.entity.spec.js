import { Concession } from '../../index'

describe('concession entity', () => {
  it('maps from dynamics', async () => {
    const concession = Concession.fromResponse(
      {
        '@odata.etag': 'W/"22638892"',
        defra_name: 'Junior',
        defra_concessionid: '3230c68f-ef65-e611-80dc-c4346bad4004'
      },
      {}
    )
    const expectedFields = {
      id: '3230c68f-ef65-e611-80dc-c4346bad4004',
      name: 'Junior'
    }

    expect(concession).toBeInstanceOf(Concession)
    expect(concession).toMatchObject(expect.objectContaining({ etag: 'W/"22638892"', ...expectedFields }))
    expect(concession.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(concession.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })
})
