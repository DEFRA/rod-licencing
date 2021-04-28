import Joi from 'joi'
import { PoclFile } from '@defra-fish/dynamics-lib'
import { finalisePermissionResponseSchema, stagedPermissionSchema } from './permission.schema.js'
import { contactRequestSchema } from './contact.schema.js'
import { createAlternateKeyValidator, buildJoiOptionSetValidator, createPermitConcessionValidator } from './validators/validators.js'
import { MAX_PERMISSIONS_PER_TRANSACTION } from '@defra-fish/business-rules-lib'

import { v4 as uuidv4 } from 'uuid'

/**
 * Maximum number of items that can be created in a batch - limited by DynamoDB max batch size
 * @type {number}
 */
export const BATCH_CREATE_MAX_COUNT = 25

/**
 * Allow the existence of a transaction file to be cached for a period of time to reduce calls to Dynamics when processing POCL files
 * @type {number}
 */
export const TRANSACTION_FILE_VALIDATION_CACHE_TTL = 60 * 15 // 15 minutes

const createTransactionRequestSchemaContent = {
  permissions: Joi.array()
    .min(1)
    .max(MAX_PERMISSIONS_PER_TRANSACTION)
    .items(stagedPermissionSchema)
    .required()
    .label('create-transaction-request-permissions'),
  dataSource: buildJoiOptionSetValidator('defra_datasource', 'Web Sales'),
  createdBy: Joi.string().optional()
}

/**
 * Schema for the create transaction request
 * @type {Joi.AnySchema}
 */
export const createTransactionSchema = Joi.object(createTransactionRequestSchemaContent)
  .external(createPermitConcessionValidator())
  .label('create-transaction-request')

/**
 * Validates a request to create transactions in batch.
 * Does not reference the createTransactionSchema as validation of objects in the array is applied manually in the request handler
 * so that a batch response can be formed (otherwise the entire batch will fail if any one of the create-requests contains a validation error)
 * @type {Joi.AnySchema}
 */
export const createTransactionBatchSchema = Joi.array()
  .min(1)
  .max(BATCH_CREATE_MAX_COUNT)
  .items(
    Joi.object()
      .required()
      .label('create-transaction-batch-item')
      .description('See create-transaction-request for proper structure')
  )
  .required()
  .label('create-transaction-batch-request')

const createTransactionResponseSchemaContent = {
  id: Joi.string()
    .trim()
    .guid()
    .required(),
  expires: Joi.number().required(),
  ...createTransactionRequestSchemaContent,
  permissions: Joi.array()
    .min(1)
    .items(stagedPermissionSchema)
    .required()
    .label('create-transaction-response-permissions'),
  cost: Joi.number().required(),
  isRecurringPaymentSupported: Joi.boolean().required(),
  status: Joi.object({
    id: Joi.string()
      .valid('STAGED')
      .required()
  })
    .label('create-transaction-status')
    .required()
}

/**
 * Schema for the create transaction response
 * @type {Joi.AnySchema}
 */
export const createTransactionResponseSchema = Joi.object(createTransactionResponseSchemaContent).label('create-transaction-response')

/**
 * Schema for the create transaction batch response
 * @type {Joi.AnySchema}
 */
export const createTransactionBatchResponseSchema = Joi.array()
  .items(
    Joi.object({
      statusCode: Joi.number().required(),
      response: Joi.object(createTransactionResponseSchemaContent)
        .label('create-transaction-batch-item-response')
        .optional(),
      error: Joi.string().optional(),
      message: Joi.string().optional()
    }).label('create-transaction-batch-response-item')
  )
  .label('create-transaction-batch-response')

const finaliseTransactionRequestSchemaContent = {
  transactionFile: Joi.string()
    .optional()
    .external(createAlternateKeyValidator(PoclFile, { cache: TRANSACTION_FILE_VALIDATION_CACHE_TTL })),
  payment: Joi.object({
    amount: Joi.number().required(),
    timestamp: Joi.string()
      .isoDate()
      .required()
      .description('An ISO8601 compatible date string defining when the transaction was completed')
      .example(new Date().toISOString()),
    source: buildJoiOptionSetValidator('defra_financialtransactionsource', 'Gov Pay'),
    channelId: Joi.string()
      .trim()
      .optional()
      .description('Channel specific identifier'),
    method: buildJoiOptionSetValidator('defra_paymenttype', 'Debit card'),
    recurring: Joi.object({
      payer: contactRequestSchema,
      referenceNumber: Joi.string()
        .required()
        .description('The reference number associated with the recurring payment')
        .example(uuidv4()),
      mandate: Joi.string()
        .required()
        .description('The mandate identifier associated with the recurring payment')
        .example(uuidv4())
    })
      .label('finalise-transaction-recurring-payment-details')
      .description('Used to establish a recurring payment (e.g. via Direct Debit)')
      .optional()
  })
    .label('finalise-transaction-payment-details')
    .required()
}

/**
 * Schema for the finalise transaction request
 * @type {Joi.AnySchema}
 */
export const finaliseTransactionRequestSchema = Joi.object(finaliseTransactionRequestSchemaContent).label('finalise-transaction-request')

export const finaliseTransactionResponseSchema = Joi.object({
  ...createTransactionResponseSchemaContent,
  ...finaliseTransactionRequestSchemaContent,
  permissions: Joi.array()
    .min(1)
    .items(finalisePermissionResponseSchema)
    .required()
    .label('finalise-transaction-response-permissions'),
  status: Joi.object({
    id: Joi.string()
      .valid('FINALISED')
      .required(),
    messageId: Joi.string().required()
  })
    .required()
    .label('finalise-transaction-status')
}).label('finalise-transaction-response')
