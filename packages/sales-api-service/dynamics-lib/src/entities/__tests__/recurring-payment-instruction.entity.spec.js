import { Contact, RecurringPayment, RecurringPaymentInstruction, Permit, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('recurring payment instruction entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const instruction = RecurringPaymentInstruction.fromResponse(
      {
        '@odata.etag': 'W/"53585154"',
        defra_recurringpaymentinstructionid: 'bfb24adf-2e83-ea11-a811-000d3a649213'
      },
      optionSetData
    )

    const expectedFields = {
      id: 'bfb24adf-2e83-ea11-a811-000d3a649213'
    }

    expect(instruction).toBeInstanceOf(RecurringPaymentInstruction)
    expect(instruction).toMatchObject(expect.objectContaining({ etag: 'W/"53585154"', ...expectedFields }))
    expect(instruction.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(instruction.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const contact = new Contact()
    const permit = new Permit()
    const recurringPayment = new RecurringPayment()

    const instruction = new RecurringPaymentInstruction()
    instruction.bindToEntity(RecurringPaymentInstruction.definition.relationships.licensee, contact)
    instruction.bindToEntity(RecurringPaymentInstruction.definition.relationships.permit, permit)
    instruction.bindToEntity(RecurringPaymentInstruction.definition.relationships.recurringPayment, recurringPayment)

    const dynamicsEntity = instruction.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        'defra_Contact@odata.bind': `$${contact.uniqueContentId}`,
        'defra_Permit@odata.bind': `$${permit.uniqueContentId}`,
        'defra_RecurringPayment@odata.bind': `$${recurringPayment.uniqueContentId}`
      })
    )
  })
})
