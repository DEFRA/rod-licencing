import Joi from '@hapi/joi'
import { createOptionSetValidator, createEntityIdValidator } from './validators/validators.js'
import { Contact } from '@defra-fish/dynamics-lib'
import { validation } from '@defra-fish/business-rules-lib'

export const contactSchema = Joi.object({
  contactId: Joi.string()
    .guid()
    .optional()
    .external(createEntityIdValidator(Contact))
    .description('the contact identifier of an existing contact record to be updated')
    .example('1329a866-d175-ea11-a811-000d3a64905b'),
  firstName: validation.contact.createFirstNameValidator(Joi),
  lastName: validation.contact.createLastNameValidator(Joi),
  birthDate: validation.contact.createBirthDateValidator(Joi),
  email: validation.contact.createEmailValidator(Joi),
  mobilePhone: validation.contact.createMobilePhoneValidator(Joi),
  premises: validation.contact.createPremisesValidator(Joi),
  street: validation.contact.createStreetValidator(Joi),
  locality: validation.contact.createLocalityValidator(Joi),
  town: validation.contact.createTownValidator(Joi),
  postcode: Joi.alternatives().conditional('country', {
    is: Joi.string().valid('GB', 'United Kingdom'),
    then: validation.contact.createUKPostcodeValidator(Joi),
    otherwise: Joi.string()
      .trim()
      .required()
  }),
  country: createOptionSetValidator('defra_country', 'GB'),
  preferredMethodOfConfirmation: createOptionSetValidator('defra_preferredcontactmethod', 'Text'),
  preferredMethodOfNewsletter: createOptionSetValidator('defra_preferredcontactmethod', 'Email'),
  preferredMethodOfReminder: createOptionSetValidator('defra_preferredcontactmethod', 'Letter')
})
  .required()
  .description('Details of the associated contact')
  .label('contact')
