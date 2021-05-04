import { TransactionCurrency } from '../../index'

describe('transaction-currency entity', () => {
  it('maps from dynamics', async () => {
    const transactionCurrency = TransactionCurrency.fromResponse(
      {
        '@odata.etag': 'W/"596274"',
        transactioncurrencyid: '77d7c824-b080-e611-80df-c4346bac7ed4',
        currencyname: 'Pound Sterling',
        currencysymbol: '£',
        isocurrencycode: 'GBP'
      },
      {}
    )

    const expectedFields = {
      id: '77d7c824-b080-e611-80df-c4346bac7ed4',
      name: 'Pound Sterling',
      code: 'GBP',
      symbol: '£'
    }
    expect(transactionCurrency).toBeInstanceOf(TransactionCurrency)
    expect(transactionCurrency).toMatchObject(expect.objectContaining({ etag: 'W/"596274"', ...expectedFields }))
    expect(transactionCurrency.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(transactionCurrency.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })
})
