export const configureSimpleOAuth2Mock = (SimpleOAuth2 = jest.genMockFromModule('simple-oauth2')) => {
  let mockTokenReturnValue = 'MOCK TOKEN'
  let mockTokenExpired = false
  SimpleOAuth2.__setMockTokenReturnValue = value => {
    mockTokenReturnValue = value
  }
  SimpleOAuth2.__setMockTokenExpired = (value = false) => {
    mockTokenExpired = value
  }
  SimpleOAuth2.ClientCredentials.mockImplementation(
    jest.fn(() => ({
      getToken: jest.fn(async () => ({
        expired: jest.fn(() => mockTokenExpired),
        token: {
          access_token: mockTokenReturnValue
        }
      }))
    }))
  )
  return SimpleOAuth2
}
