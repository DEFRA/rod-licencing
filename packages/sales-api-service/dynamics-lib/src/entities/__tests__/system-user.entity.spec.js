import { SystemUser } from '../../index.js'

describe('system user entity', () => {
  it('maps from dynamics', async () => {
    const transaction = SystemUser.fromResponse({
      '@odata.etag': 'W/"64761636"',
      systemuserid: '26449770-5e67-e911-a988-000d3ab9df39',
      azureactivedirectoryobjectid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
      lastname: 'Gardner-Dell',
      firstname: 'Sam',
      isdisabled: false
    })

    const expectedFields = {
      id: '26449770-5e67-e911-a988-000d3ab9df39',
      oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
      lastName: 'Gardner-Dell',
      firstName: 'Sam',
      isDisabled: false
    }

    expect(transaction).toBeInstanceOf(SystemUser)
    expect(transaction).toMatchObject(expect.objectContaining({ etag: 'W/"64761636"', ...expectedFields }))
    expect(transaction.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(transaction.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const role = Object.assign(new SystemUser(), {
      oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
      lastName: 'Gardner-Dell',
      firstName: 'Sam',
      isDisabled: false
    })

    const dynamicsEntity = role.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        azureactivedirectoryobjectid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
        lastname: 'Gardner-Dell',
        firstname: 'Sam',
        isdisabled: false
      })
    )
  })
})
