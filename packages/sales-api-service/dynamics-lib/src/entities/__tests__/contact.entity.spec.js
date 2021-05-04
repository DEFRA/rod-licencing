import { Contact, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('contact entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const contact = Contact.fromResponse(
      {
        '@odata.etag': 'W/"202465000"',
        contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
        firstname: 'Fester',
        lastname: 'Tester',
        birthdate: '1946-01-01',
        emailaddress1: 'fester@tester.com',
        mobilephone: '01234 567890',
        defra_organisation: 'Test Organisation',
        defra_premises: '1',
        defra_street: 'Tester Avenue',
        defra_locality: 'Testville',
        defra_town: 'Tersterton',
        defra_postcode: 'AB12 3CD',
        defra_country: 910400184,
        defra_preferredmethodofconfirmation: 910400002,
        defra_preferredmethodofnewsletter: 910400000,
        defra_preferredmethodofreminder: 910400001,
        defra_postalfulfilment: true
      },
      optionSetData
    )

    const expectedFields = {
      id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
      firstName: 'Fester',
      lastName: 'Tester',
      birthDate: '1946-01-01',
      email: 'fester@tester.com',
      mobilePhone: '01234 567890',
      organisation: 'Test Organisation',
      premises: '1',
      street: 'Tester Avenue',
      locality: 'Testville',
      town: 'Tersterton',
      postcode: 'AB12 3CD',
      country: expect.objectContaining({ id: 910400184, label: 'United Kingdom', description: 'GB' }),
      preferredMethodOfConfirmation: expect.objectContaining({ id: 910400002, label: 'Text', description: 'Text' }),
      preferredMethodOfNewsletter: expect.objectContaining({ id: 910400000, label: 'Email', description: 'Email' }),
      preferredMethodOfReminder: expect.objectContaining({ id: 910400001, label: 'Letter', description: 'Letter' }),
      postalFulfilment: true
    }

    expect(contact).toBeInstanceOf(Contact)
    expect(contact).toMatchObject(expect.objectContaining({ etag: 'W/"202465000"', ...expectedFields }))
    expect(contact.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(contact.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const contact = new Contact()
    contact.firstName = 'Fester'
    contact.lastName = 'Tester'
    contact.birthDate = '1946-01-01'
    contact.email = 'fester@tester.com'
    contact.mobilePhone = '01234 567890'
    contact.organisation = 'Test Organisation'
    contact.premises = '1'
    contact.street = 'Tester Avenue'
    contact.locality = 'Testville'
    contact.town = 'Tersterton'
    contact.postcode = 'AB12 3CD'
    contact.country = optionSetData.defra_country.options['910400184']
    contact.preferredMethodOfConfirmation = optionSetData.defra_preferredcontactmethod.options['910400002']
    contact.preferredMethodOfNewsletter = optionSetData.defra_preferredcontactmethod.options['910400000']
    contact.preferredMethodOfReminder = optionSetData.defra_preferredcontactmethod.options['910400001']
    contact.postalFulfilment = true

    const dynamicsEntity = contact.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        firstname: 'Fester',
        lastname: 'Tester',
        birthdate: '1946-01-01',
        emailaddress1: 'fester@tester.com',
        mobilephone: '01234 567890',
        defra_organisation: 'Test Organisation',
        defra_premises: '1',
        defra_street: 'Tester Avenue',
        defra_locality: 'Testville',
        defra_town: 'Tersterton',
        defra_postcode: 'AB12 3CD',
        defra_country: 910400184,
        defra_preferredmethodofconfirmation: 910400002,
        defra_preferredmethodofnewsletter: 910400000,
        defra_preferredmethodofreminder: 910400001,
        defra_postalfulfilment: true
      })
    )
  })
})
