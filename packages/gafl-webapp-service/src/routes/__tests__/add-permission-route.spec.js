import { start, stop, initialize, injectWithCookie } from '../../misc/test-utils.js'
import { ADD_PERMISSION, NEW_TRANSACTION, MAX_PERMISSIONS } from '../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The new permission handler', () => {
  it('Adds new permission objects to the transaction cache', async () => {
    // Add a permission
    await injectWithCookie('GET', NEW_TRANSACTION.uri)
    let res = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(res.payload).permissions.length).toBe(0)

    // Add a permission
    await injectWithCookie('GET', ADD_PERMISSION.uri)
    res = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(res.payload).permissions.length).toBe(1)
  })

  it('Ensure that we cannot overload the redis cache by doing this continually', async () => {
    await injectWithCookie('GET', NEW_TRANSACTION.uri)
    for (let i = 0; i < MAX_PERMISSIONS; i++) {
      await injectWithCookie('GET', ADD_PERMISSION.uri)
    }
    let res = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(res.payload).permissions.length).toBe(MAX_PERMISSIONS)
    res = await injectWithCookie('GET', ADD_PERMISSION.uri)
    expect(res.statusCode).toBe(400)
  })
})
