import { orderConfirmationPdf } from '../confirmation-pdf.js'

const disabledPermission = {
  licensee: {
    birthDate: '1970-01-01',
    firstName: 'Graham',
    lastName: 'Willis',
    premises: '3',
    town: 'BRISTOL',
    postcode: 'BS9 4PT',
    countryCode: 'GB',
    street: 'CROFT VIEW',
    preferredMethodOfNewsletter: 'Prefer not to be contacted',
    preferredMethodOfConfirmation: 'Letter',
    preferredMethodOfReminder: 'Letter'
  },
  licenceStartTime: null,
  licenceLength: '12M',
  licenceType: 'Trout and coarse',
  numberOfRods: '3',
  licenceToStart: 'another-date-or-time',
  licenceStartDate: '2020-05-23',
  concessions: [
    {
      type: 'Disabled',
      proof: {
        type: 'National Insurance Number',
        referenceNumber: 'QQ 12 34 56 C'
      }
    }
  ],
  referenceNumber: '01230521-3WC3FGW-43Y0BP',
  endDate: '2021-05-22T23:00:00.000Z',
  permit: {
    cost: 0
  }
}

describe('The PDF generator', () => {
  it('completes for a trout and coarse licence', () => {
    const result = orderConfirmationPdf(disabledPermission)
    expect(result.content[5].table.body[1][1].text).toBe('Disabled, Trout and coarse, 3 rod')
  })

  it('completes for a salmon and sea trout licence', () => {
    const permission = Object.assign({}, disabledPermission)
    permission.licenceType = 'Salmon and sea trout'
    permission.concessions = []
    const result = orderConfirmationPdf(permission)
    expect(result.content[5].table.body[1][1].text).toBe('Salmon and sea trout')
  })

  it('completes for a 1 Day licence', () => {
    const permission = Object.assign({}, disabledPermission)
    permission.licenceLength = '1D'
    permission.numberOfRods = '2'
    permission.concessions = []
    const result = orderConfirmationPdf(permission)
    expect(result.content[5].table.body[2][1].text).toBe('1 day')
  })

  it('completes for an 8 Day licence', () => {
    const permission = Object.assign({}, disabledPermission)
    permission.licenceLength = '8D'
    permission.numberOfRods = '2'
    permission.concessions = []
    const result = orderConfirmationPdf(permission)
    expect(result.content[5].table.body[2][1].text).toBe('8 days')
  })
})
