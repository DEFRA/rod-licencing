import { Contact, RecurringPayment, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('recurring payment entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const recurringPayment = RecurringPayment.fromResponse(
      {
        '@odata.etag': 'W/"53585133"',
        defra_recurringpaymentid: 'b5b24adf-2e83-ea11-a811-000d3a649213',
        defra_name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
        defra_mandate: 'c9267c6e-573d-488b-99ab-ea18431fc472',
        defra_inceptionday: 2,
        defra_inceptionmonth: 1
      },
      optionSetData
    )

    const expectedFields = {
      id: 'b5b24adf-2e83-ea11-a811-000d3a649213',
      referenceNumber: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
      mandate: 'c9267c6e-573d-488b-99ab-ea18431fc472',
      inceptionDay: 2,
      inceptionMonth: 1
    }

    expect(recurringPayment).toBeInstanceOf(RecurringPayment)
    expect(recurringPayment).toMatchObject(expect.objectContaining({ etag: 'W/"53585133"', ...expectedFields }))
    expect(recurringPayment.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(recurringPayment.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const contact = new Contact()

    const recurringPayment = new RecurringPayment()
    recurringPayment.referenceNumber = 'Test Reference Number'
    recurringPayment.mandate = 'Test mandate'
    recurringPayment.inceptionDay = 28
    recurringPayment.inceptionMonth = 2
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.payer, contact)

    const dynamicsEntity = recurringPayment.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'Test Reference Number',
        defra_mandate: 'Test mandate',
        defra_inceptionday: 28,
        defra_inceptionmonth: 2,
        'defra_Contact@odata.bind': `$${contact.uniqueContentId}`
      })
    )
  })
})
