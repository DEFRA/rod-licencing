import { NAME, CONTROLLER } from '../../../constants.js'
import { start, stop, initialize, injectWithCookie } from '../../../misc/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The name page', () => {
  it('Return success on requesting', async () => {
    const data = await injectWithCookie('GET', NAME.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Redirects back to itself on posting an empty name', async () => {
    const data = await injectWithCookie('POST', NAME.uri, { 'first-name': '', 'last-name': '' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('Redirects back to itself on posting a too long first name', async () => {
    const data = await injectWithCookie('POST', NAME.uri, {
      'first-name': 'Harry'.repeat(200),
      'last-name': 'OK'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('Redirects back to itself on posting a too long last name', async () => {
    const data = await injectWithCookie('POST', NAME.uri, {
      'last-name': 'Harry'.repeat(200),
      'first-name': 'OK'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('Redirects back to itself on posting a too short first name', async () => {
    const data = await injectWithCookie('POST', NAME.uri, {
      'first-name': 'H',
      'last-name': 'OK'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('Redirects back to itself on posting a too short last name', async () => {
    const data = await injectWithCookie('POST', NAME.uri, {
      'last-name': 'H',
      'first-name': 'OK'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('Redirects back to itself on posting a first name with invalid characters', async () => {
    const data = await injectWithCookie('POST', NAME.uri, {
      'last-name': 'OK',
      'first-name': '%%%%'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('Redirects back to itself on posting a last name with invalid characters', async () => {
    const data = await injectWithCookie('POST', NAME.uri, {
      'last-name': '&&&',
      'first-name': 'OK'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('Check character substitutions are made on a successful submission', async () => {
    const data = await injectWithCookie('POST', NAME.uri, {
      'last-name': 'Willis',
      'first-name': 'Graham  Michael'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')

    expect(JSON.parse(payload).permissions[0].contact.name).toEqual({ firstName: 'Graham Michael', lastName: 'Willis' })
  })
})
