import { configureDynamicsWebApiMock } from './dynamics-web-api-mock-helper.js'
const DynamicsWebApi = jest.genMockFromModule('dynamics-web-api')
export default configureDynamicsWebApiMock(DynamicsWebApi)
