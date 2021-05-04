import { Role } from '../../index.js'

describe('roles entity', () => {
  it('maps from dynamics', async () => {
    const transaction = Role.fromResponse({
      '@odata.etag': 'W/"58552853"',
      roleid: 'c30c8811-9519-e911-817c-000d3a0718d1',
      name: 'Test role'
    })

    const expectedFields = {
      id: 'c30c8811-9519-e911-817c-000d3a0718d1',
      name: 'Test role'
    }

    expect(transaction).toBeInstanceOf(Role)
    expect(transaction).toMatchObject(expect.objectContaining({ etag: 'W/"58552853"', ...expectedFields }))
    expect(transaction.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(transaction.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const role = Object.assign(new Role(), {
      name: 'Test role'
    })

    const dynamicsEntity = role.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        name: 'Test role'
      })
    )
  })
})
