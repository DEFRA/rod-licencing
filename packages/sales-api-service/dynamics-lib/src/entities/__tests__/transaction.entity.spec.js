import { Transaction, PoclFile, retrieveGlobalOptionSets, TransactionCurrency } from '../../index.js'

let optionSetData
describe('transaction entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const transaction = Transaction.fromResponse(
      {
        '@odata.etag': 'W/"53051262"',
        defra_transactionid: '21ed6f33-e47f-ea11-a811-000d3a64905b',
        defra_name: 'Test Reference Number',
        defra_description: 'Test Description',
        defra_fadcode: 'Test ChannelId',
        defra_timestamp: '2020-12-13T23:59:59Z',
        defra_paymenttype: 910400000,
        defra_transactionsource: 910400000,
        defra_total: 123.45
      },
      optionSetData
    )

    const expectedFields = {
      id: '21ed6f33-e47f-ea11-a811-000d3a64905b',
      referenceNumber: 'Test Reference Number',
      description: 'Test Description',
      channelId: 'Test ChannelId',
      timestamp: '2020-12-13T23:59:59Z',
      paymentType: expect.objectContaining({ id: 910400000, label: 'Other', description: 'Other' }),
      source: expect.objectContaining({ id: 910400000, label: 'Gov Pay', description: 'Gov Pay' }),
      total: 123.45
    }

    expect(transaction).toBeInstanceOf(Transaction)
    expect(transaction).toMatchObject(expect.objectContaining({ etag: 'W/"53051262"', ...expectedFields }))
    expect(transaction.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(transaction.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const currency = TransactionCurrency.fromResponse(
      {
        '@odata.etag': 'W/"556963"',
        currencyname: 'Pound Sterling',
        isocurrencycode: 'GBP',
        currencysymbol: '£',
        transactioncurrencyid: 'd0d0b0f4-f5e0-e711-810d-5065f38a8bc1'
      },
      optionSetData
    )
    const poclFile = new PoclFile()

    const transaction = new Transaction()
    transaction.referenceNumber = 'Test Reference Number'
    transaction.description = 'Test Description'
    transaction.channelId = 'Test ChannelId'
    transaction.timestamp = '2020-12-13T23:59:59Z'
    transaction.paymentType = optionSetData.defra_paymenttype.options['910400000']
    transaction.source = optionSetData.defra_financialtransactionsource.options['910400000']
    transaction.total = 123.45
    transaction.bindToEntity(Transaction.definition.relationships.transactionCurrency, currency)
    transaction.bindToEntity(Transaction.definition.relationships.poclFile, poclFile)

    const dynamicsEntity = transaction.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'Test Reference Number',
        defra_description: 'Test Description',
        defra_fadcode: 'Test ChannelId',
        defra_timestamp: '2020-12-13T23:59:59Z',
        defra_paymenttype: 910400000,
        defra_transactionsource: 910400000,
        defra_total: 123.45,
        'transactioncurrencyid@odata.bind': `/${TransactionCurrency.definition.dynamicsCollection}(${currency.id})`,
        'defra_POCLFile@odata.bind': `$${poclFile.uniqueContentId}`
      })
    )
  })
})
