import { SystemUserRole } from '../../index.js'

describe('system user role entity', () => {
  it('maps from dynamics', async () => {
    const transaction = SystemUserRole.fromResponse({
      '@odata.etag': 'W/"39334973"',
      systemuserroleid: 'ce5c129a-4f0c-ea11-a811-000d3a64905b',
      roleid: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
      systemuserid: '26449770-5e67-e911-a988-000d3ab9df39'
    })

    const expectedFields = {
      id: 'ce5c129a-4f0c-ea11-a811-000d3a64905b',
      roleId: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
      systemUserId: '26449770-5e67-e911-a988-000d3ab9df39'
    }

    expect(transaction).toBeInstanceOf(SystemUserRole)
    expect(transaction).toMatchObject(expect.objectContaining({ etag: 'W/"39334973"', ...expectedFields }))
    expect(transaction.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(transaction.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const role = Object.assign(new SystemUserRole(), {
      roleId: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
      systemUserId: '26449770-5e67-e911-a988-000d3ab9df39'
    })

    const dynamicsEntity = role.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        roleid: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
        systemuserid: '26449770-5e67-e911-a988-000d3ab9df39'
      })
    )
  })
})
