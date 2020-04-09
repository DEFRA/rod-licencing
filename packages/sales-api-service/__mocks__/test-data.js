import { Concession, Contact, GlobalOptionSetDefinition, Permit } from '@defra-fish/dynamics-lib'
import { readFileSync } from 'fs'
import Project from '../src/project.cjs'
import Path from 'path'
import dotProp from 'dot-prop'

const optionSetDataPath = Path.join(Project.root, '..', 'dynamics-lib', '__mocks__', 'option-set-data.json')
const optionSetData = JSON.parse(readFileSync(optionSetDataPath, { encoding: 'UTF-8' }))
  .value.map(({ Name: name, Options: options }) => ({
    name,
    options: options.map(o => ({
      id: o.Value,
      label: dotProp.get(o, 'Label.UserLocalizedLabel.Label', ''),
      description: dotProp.get(o, 'Description.UserLocalizedLabel.Label', '')
    }))
  }))
  .reduce((acc, { name, options }) => {
    acc[name] = {
      name,
      options: options.reduce((optionSetMapping, o) => {
        optionSetMapping[o.id] = new GlobalOptionSetDefinition(name, o)
        return optionSetMapping
      }, {})
    }
    return acc
  }, {})

export const mockContactPayload = () => ({
  firstName: 'Fester',
  lastName: 'Tester',
  birthDate: '2000-01-01',
  email: 'person@example.com',
  mobilePhone: '+44 7700 900088',
  premises: 'Example House',
  street: 'Example Street',
  locality: 'Near Sample',
  town: 'Exampleton',
  postcode: 'AB12 3CD',
  country: 'United Kingdom',
  preferredMethodOfConfirmation: 'Text',
  preferredMethodOfNewsletter: 'Email',
  preferredMethodOfReminder: 'Letter'
})

export const mockContactWithIdPayload = () => ({
  contactId: '1329a866-d175-ea11-a811-000d3a64905b',
  ...mockContactPayload()
})

export const mockPermissionPayload = () => ({
  permitId: 'cb1b34a0-0c66-e611-80dc-c4346bad0190',
  licensee: mockContactPayload(),
  concession: {
    concessionId: 'd0ece997-ef65-e611-80dc-c4346bad4004',
    proof: {
      type: 'National Insurance Number',
      referenceNumber: 'AB 01 02 03 CD'
    }
  },
  issueDate: '2020-04-09T08:51:26.825Z',
  startDate: '2020-04-09T08:51:26.825Z'
})

export const mockTransactionPayload = () => ({
  permissions: [mockPermissionPayload()],
  dataSource: 'Web Sales'
})

export const MOCK_PERMISSION_NUMBER = '11100420-2WT1SFT-KPMW2C'
export const MOCK_END_DATE = '2020-04-10T09:52:50.609Z'
export const mockPermissionRecord = () => ({
  ...mockPermissionPayload(),
  referenceNumber: MOCK_PERMISSION_NUMBER,
  endDate: MOCK_END_DATE
})

export const mockTransactionRecord = () => ({
  ...mockTransactionPayload(),
  id: 'b364c12f-ce62-4c62-b4bd-4a06fd57e256',
  expires: 1586512428,
  permissions: [mockPermissionRecord()]
})

export const MOCK_CONCESSION = Concession.fromResponse(
  {
    '@odata.etag': 'W/"22638892"',
    defra_name: 'Senior',
    defra_concessionid: 'd0ece997-ef65-e611-80dc-c4346bad4004'
  },
  optionSetData
)

export const MOCK_1DAY_PERMIT = Permit.fromResponse(
  {
    '@odata.etag': 'W/"51026144"',
    defra_availablefrom: '2017-03-31T23:00:00Z',
    defra_availableto: '2021-03-31T22:59:00Z',
    defra_durationnumericpart: 1,
    defra_durationdaymonthyearpart: 910400000,
    defra_numberofrods: 2,
    defra_duration: 910400000,
    defra_permittype: 910400000,
    defra_advertisedprice: 6.0,
    defra_datasource: 910400002,
    defra_permitid: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
    defra_name: 'Coarse 1 day 2 Rod Licence (Senior)',
    defra_permitsubtype: 910400001,
    defra_equipment: 910400000,
    defra_isforfulfilment: false,
    defra_iscountersales: true,
    defra_advertisedprice_base: 6.0,
    defra_itemid: '42290'
  },
  optionSetData
)

export const MOCK_12MONTH_PERMIT = Permit.fromResponse(
  {
    '@odata.etag': 'W/"51026180"',
    defra_availablefrom: '2017-03-31T23:00:00Z',
    defra_availableto: '2021-03-31T22:59:00Z',
    defra_durationnumericpart: 12,
    defra_durationdaymonthyearpart: 910400001,
    defra_numberofrods: 3,
    defra_duration: 910400003,
    defra_permittype: 910400000,
    defra_advertisedprice: 30.0,
    defra_datasource: 910400002,
    defra_permitid: 'cb1b34a0-0c66-e611-80dc-c4346bad0190',
    defra_name: 'Coarse 12 month 3 Rod Licence (Senior, Disabled)',
    defra_permitsubtype: 910400001,
    defra_equipment: 910400001,
    defra_isforfulfilment: true,
    defra_iscountersales: true,
    defra_advertisedprice_base: 30.0,
    defra_itemid: '42347'
  },
  optionSetData
)

export const MOCK_NEW_CONTACT_ENTITY = new Contact()

export const MOCK_EXISTING_CONTACT_ENTITY = Contact.fromResponse(
  {
    '@odata.etag': 'W/"202465000"',
    contactid: '1329a866-d175-ea11-a811-000d3a64905b',
    firstname: 'Fester',
    lastname: 'Tester',
    birthdate: '1946-01-01',
    emailaddress1: 'fester@tester.com',
    mobilephone: '01234 567890',
    defra_premises: '1',
    defra_street: 'Tester Avenue',
    defra_locality: 'Testville',
    defra_town: 'Tersterton',
    defra_postcode: 'AB12 3CD'
  },
  optionSetData
)
