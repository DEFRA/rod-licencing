import Joi from 'joi'
import { buildJoiOptionSetValidator, createEntityIdValidator } from './validators/validators.js'
import { Contact } from '@defra-fish/dynamics-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { optionSetOption } from './option-set.schema.js'

const commonContactSchema = {
  id: Joi.string()
    .guid()
    .optional()
    .external(createEntityIdValidator(Contact))
    .description('the contact identifier of an existing contact record to be updated')
    .example('1329a866-d175-ea11-a811-000d3a64905b'),
  firstName: validation.contact.createFirstNameValidator(Joi, { minimumLength: 1 }),
  lastName: validation.contact.createLastNameValidator(Joi, { minimumLength: 1 }),
  birthDate: validation.contact.createBirthDateValidator(Joi),
  email: validation.contact.createEmailValidator(Joi).allow(null),
  mobilePhone: validation.contact.createMobilePhoneValidator(Joi).allow(null),
  organisation: Joi.string()
    .trim()
    .min(1)
    .optional()
    .allow(null)
    .example('Example Organisation'),
  premises: validation.contact.createPremisesValidator(Joi),
  street: validation.contact.createStreetValidator(Joi).allow(null),
  locality: validation.contact.createLocalityValidator(Joi).allow(null),
  town: validation.contact.createTownValidator(Joi),
  postcode: Joi.when(Joi.ref('/dataSource'), {
    is: Joi.string().valid('Post Office Sales'),
    otherwise: Joi.alternatives().conditional('country', {
      is: Joi.string().valid('GB', 'United Kingdom'),
      then: validation.contact.createUKPostcodeValidator(Joi),
      otherwise: validation.contact.createOverseasPostcodeValidator(Joi)
    })
  }).example('AB12 3CD')
}

export const contactRequestSchema = Joi.object({
  ...commonContactSchema,
  country: buildJoiOptionSetValidator('defra_country', 'GB'),
  preferredMethodOfConfirmation: buildJoiOptionSetValidator('defra_preferredcontactmethod', 'Text'),
  preferredMethodOfNewsletter: buildJoiOptionSetValidator('defra_preferredcontactmethod', 'Email'),
  preferredMethodOfReminder: buildJoiOptionSetValidator('defra_preferredcontactmethod', 'Letter')
})
  .required()
  .description('Details of the associated contact')
  .label('contact')

export const contactResponseSchema = Joi.object({
  ...commonContactSchema,
  country: optionSetOption,
  preferredMethodOfConfirmation: optionSetOption,
  preferredMethodOfNewsletter: optionSetOption,
  preferredMethodOfReminder: optionSetOption
})
  .required()
  .label('contact-response')
