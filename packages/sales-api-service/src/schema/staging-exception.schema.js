import Joi from 'joi'
import { buildJoiOptionSetValidator, createAlternateKeyValidator } from './validators/validators.js'
import { PoclFile, PoclStagingException } from '@defra-fish/dynamics-lib'

const schemaObject = {
  stagingException: Joi.object({
    stagingId: Joi.string().required(),
    description: Joi.string().required(),
    transactionJson: Joi.string().required(),
    exceptionJson: Joi.string().required()
  }),
  transactionFileException: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    json: Joi.string().required(),
    notes: Joi.string(),
    type: buildJoiOptionSetValidator(PoclStagingException.definition.mappings.type.ref, 'Failure'),
    transactionFile: Joi.string()
      .external(createAlternateKeyValidator(PoclFile))
      .required(),
    permissionId: Joi.string()
  }),
  record: Joi.object({
    id: Joi.string(),
    createTransactionPayload: Joi.object({
      dataSource: Joi.string(),
      serialNumber: Joi.string(),
      permissions: Joi.array()
    }),
    finaliseTransactionPayload: Joi.object({
      payment: Joi.object({
        timestamp: Joi.string(),
        amount: Joi.number(),
        source: Joi.string(),
        channelId: Joi.string(),
        method: Joi.string()
      })
    }),
    stage: Joi.string(),
    createTransactionError: Joi.object({
      statusCode: Joi.number(),
      error: Joi.string(),
      message: Joi.string()
    })
  }).optional()
}

/**
 * Schema for the create staging exception request
 * @type {Joi.AnySchema}
 */
export const createStagingExceptionRequestSchema = Joi.object(schemaObject)
  .or('stagingException', 'transactionFileException')
  .label('create-staging-exception-request')

/**
 * Schema for the create staging exception response
 * @type {Joi.AnySchema}
 */
export const createStagingExceptionResponseSchema = Joi.object(schemaObject).label('create-staging-exception-response')
