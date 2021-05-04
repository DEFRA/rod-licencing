import { Transaction, TransactionJournal, retrieveGlobalOptionSets, TransactionCurrency } from '../../index.js'

let optionSetData
describe('transaction journal entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const journal = TransactionJournal.fromResponse(
      {
        '@odata.etag': 'W/"53051764"',
        defra_transactionjournalid: '268b6080-f37f-ea11-a811-000d3a64905b',
        defra_name: 'Test Reference Number',
        defra_description: 'Test Description',
        defra_timestamp: '2020-12-13T23:59:59Z',
        defra_transactiontype: 910400000,
        defra_total: 123.45
      },
      optionSetData
    )

    const expectedFields = {
      id: '268b6080-f37f-ea11-a811-000d3a64905b',
      referenceNumber: 'Test Reference Number',
      description: 'Test Description',
      timestamp: '2020-12-13T23:59:59Z',
      type: expect.objectContaining({ id: 910400000, label: 'Payment', description: 'Payment' }),
      total: 123.45
    }

    expect(journal).toBeInstanceOf(TransactionJournal)
    expect(journal).toMatchObject(expect.objectContaining({ etag: 'W/"53051764"', ...expectedFields }))
    expect(journal.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(journal.toString())).toMatchObject(expect.objectContaining(expectedFields))
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
    const transaction = new Transaction()

    const journal = new TransactionJournal()
    journal.referenceNumber = 'Test Reference Number'
    journal.description = 'Test Description'
    journal.timestamp = '2020-12-13T23:59:59Z'
    journal.type = optionSetData.defra_financialtransactiontype.options['910400000']
    journal.total = 123.45
    journal.bindToEntity(TransactionJournal.definition.relationships.transaction, transaction)
    journal.bindToEntity(TransactionJournal.definition.relationships.transactionCurrency, currency)

    const dynamicsEntity = journal.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'Test Reference Number',
        defra_description: 'Test Description',
        defra_timestamp: '2020-12-13T23:59:59Z',
        defra_transactiontype: 910400000,
        defra_total: 123.45,
        'transactioncurrencyid@odata.bind': `/${TransactionCurrency.definition.dynamicsCollection}(${currency.id})`,
        'defra_Transaction@odata.bind': `$${transaction.uniqueContentId}`
      })
    )
  })
})
