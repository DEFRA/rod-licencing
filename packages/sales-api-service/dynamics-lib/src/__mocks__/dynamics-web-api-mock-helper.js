import Project from '../project.cjs'
const { readFileSync } = jest.requireActual('fs')
const Path = jest.requireActual('path')
const optionSetDataPath = Path.join(Project.root, 'src', '__mocks__', 'option-set-data.json')

export const configureDynamicsWebApiMock = (DynamicsWebApi = jest.genMockFromModule('dynamics-web-api')) => {
  let expectedResponse = {}
  let nextResponses = {}
  let callError = {}
  let inBatchMode = false

  DynamicsWebApi.__reset = () => {
    expectedResponse = {}
    nextResponses = {}
    callError = {}
    inBatchMode = false
  }

  DynamicsWebApi.__setResponse = (methodName, value) => {
    expectedResponse[methodName] = value
  }
  DynamicsWebApi.__setNextResponses = (methodName, ...responses) => {
    nextResponses[methodName] = responses
  }

  DynamicsWebApi.__throwWithErrorOn = (methodName, error = new Error('Test error')) => {
    callError[methodName] = error
  }
  DynamicsWebApi.__throwWithErrorsOnBatchExecute = (...errors) => {
    // Batch calls may throw multiple exceptions
    errors = errors.length ? errors : [new Error('Test error')]
    callError.executeBatch = errors
  }

  const respond = methodName => {
    if (methodName === 'retrieveGlobalOptionSets' && !expectedResponse.retrieveGlobalOptionSets) {
      return JSON.parse(readFileSync(optionSetDataPath, { encoding: 'UTF-8' }))
    }
    if (nextResponses[methodName] && nextResponses[methodName].length) {
      return nextResponses[methodName].shift()
    }

    return expectedResponse[methodName]
  }

  const responseCapableMethod = async methodName => {
    if (callError && callError[methodName]) {
      throw callError[methodName]
    }

    if (!inBatchMode) {
      return respond(methodName)
    }
  }

  DynamicsWebApi.prototype.retrieveRequest = jest.fn(async () => responseCapableMethod('retrieveRequest'))
  DynamicsWebApi.prototype.createRequest = jest.fn(async () => responseCapableMethod('createRequest'))
  DynamicsWebApi.prototype.updateRequest = jest.fn(async () => responseCapableMethod('updateRequest'))
  DynamicsWebApi.prototype.retrieveMultipleRequest = jest.fn(async () => responseCapableMethod('retrieveMultipleRequest'))
  DynamicsWebApi.prototype.retrieveGlobalOptionSets = jest.fn(async () => responseCapableMethod('retrieveGlobalOptionSets'))
  DynamicsWebApi.prototype.executeUnboundFunction = jest.fn(async functionName => {
    let returnValue = null
    if (functionName === 'RetrieveVersion') {
      returnValue = {
        '@odata.context': 'https://dynamics-host.crm4.dynamics.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.RetrieveVersionResponse',
        Version: '9.1.0.14134'
      }
    }
    return returnValue
  })

  DynamicsWebApi.prototype.startBatch = jest.fn(() => {
    inBatchMode = true
  })
  DynamicsWebApi.prototype.executeBatch = jest.fn(async () => {
    inBatchMode = false
    return responseCapableMethod('executeBatch')
  })
  return DynamicsWebApi
}
