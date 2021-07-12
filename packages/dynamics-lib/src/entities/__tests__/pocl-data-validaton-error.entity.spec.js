import { PoclDataValidationError } from '../pocl-data-validation-error.entity.js'
import { retrieveGlobalOptionSets } from '../..'

describe('pocl staging exception entity', () => {
  let optionSetData
  beforeEach(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })
  describe('maps from dynamics', () => {
    let exception
    beforeEach(() => {
      exception = PoclDataValidationError.fromResponse(
        {
          '@odata.etag': 'W/"56351087"',
          defra_poclvalidationerrorid: '91f15d18-0aa4-ea11-a812-000d3a64905b',
          defra_firstname: 'Daniel',
          defra_name: 'Ricciardo',
          defra_organisation: 'Fishy Endeavours',
          defra_premises: '14 Howecroft Court',
          defra_street: 'Eastmead Lane',
          defra_town: 'Bristol',
          defra_postcode: 'BS9 1HJ',
          defra_country: 'GB',
          defra_birthdate: '1989-07-01',
          defra_emailaddress: 'daniel-ricc@example.com',
          defra_mobilenumber: '07722 123456',
          defra_preferredmethodofnewsletter: 910400003,
          defra_preferredmethodofconfirmation: 910400000,
          defra_preferredmethodofreminder: 910400002,
          defra_concessions: '[{"type":"Blue Badge","referenceNumber":"123456789"}]',
          defra_startdate: '2021-06-15',
          defra_serialnumber: '14345-48457J',
          defra_permitid: 'test-permit-id',
          defra_transactiondate: '2020-01-01T14:00:00Z',
          defra_amount: 30,
          defra_paymentsource: 'Post Office Sales',
          defra_channelid: '948594',
          defra_methodofpayment: 910400001,
          defra_status: 910400000,
          defra_datasource: 910400000
        },
        optionSetData
      )
    })

    it('returns a PoclValidationError instance', () => {
      expect(exception).toBeInstanceOf(PoclDataValidationError)
    })

    it('has the expected data', () => {
      expect(exception).toMatchSnapshot()
    })
  })

  it('maps to dynamics', async () => {
    const validationError = new PoclDataValidationError()
    validationError.firstName = 'Daniel'
    validationError.lastName = 'Ricciardo'
    validationError.organisation = 'Fishy Endeavours'
    validationError.premises = '14 Howecroft Court'
    validationError.street = 'Eastmead Lane'
    validationError.town = 'Bristol'
    validationError.postcode = 'BS9 1HJ'
    validationError.country = 'GB'
    validationError.birthDate = '1989-07-01'
    validationError.email = 'daniel-ricc@example.com'
    validationError.mobilePhone = '07722 123456'
    validationError.preferredMethodOfConfirmation = optionSetData.defra_preferredcontactmethod.options['910400000']
    validationError.preferredMethodOfNewsletter = optionSetData.defra_preferredcontactmethod.options['910400003']
    validationError.preferredMethodOfReminder = optionSetData.defra_preferredcontactmethod.options['910400002']
    validationError.concessions = '[{"type":"Blue Badge","referenceNumber":123456789}]'
    validationError.startDate = '2021-06-15'
    validationError.serialNumber = '14345-48457J'
    validationError.permitId = 'test-permit-id'
    validationError.transactionDate = '2020-01-01T14:00:00Z'
    validationError.amount = 30
    validationError.paymentSource = 'Post Office Sales'
    validationError.channelId = '948594'
    validationError.methodOfPayment = optionSetData.defra_paymenttype.options['910400001']
    validationError.status = optionSetData.defra_poclvalidationerrorstatus.options['910400000']
    validationError.dataSource = optionSetData.defra_datasource.options['910400000']

    const dynamicsEntity = validationError.toRequestBody()
    expect(dynamicsEntity).toMatchSnapshot()
  })
})
