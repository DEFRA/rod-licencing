const mockCacheManagerClientQuit = jest.fn()
const mockCacheManagerClientDisconnect = jest.fn()
let mockCacheStoreName = 'redis'
jest.mock('cache-manager', () => {
  const mockCache = {}
  const mockCacheGet = jest.fn(async (key, value) => mockCache[key])
  const mockCacheSet = jest.fn(async (key, value, options) => {
    mockCache[key] = value
  })

  return {
    caching: () => ({
      get: mockCacheGet,
      set: mockCacheSet,
      store: {
        name: mockCacheStoreName,
        getClient: () => ({
          disconnect: mockCacheManagerClientDisconnect,
          quit: mockCacheManagerClientQuit,
          on: () => {}
        })
      }
    })
  }
})

describe('cache', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockCacheStoreName = 'redis'
  })

  it('uses redis on the configured host and port', done => {
    jest.isolateModules(async () => {
      process.env.REDIS_HOST = 'localhost'
      process.env.REDIS_PORT = 123
      const options = require('../cache.js').config()
      expect(options).toMatchObject({
        store: expect.objectContaining({}),
        host: 'localhost',
        port: '123',
        ttl: 60 * 60 * 12
      })
      done()
    })
  })

  it('configures tls and uses a password if one is supplied', done => {
    jest.isolateModules(async () => {
      process.env.REDIS_HOST = 'localhost'
      process.env.REDIS_PASSWORD = 'opensesame'
      delete process.env.REDIS_PORT
      const options = require('../cache.js').config()
      expect(options).toMatchObject({
        store: expect.objectContaining({}),
        host: 'localhost',
        port: 6379,
        ttl: 60 * 60 * 12,
        password: 'opensesame',
        tls: {}
      })
      done()
    })
  })

  it('uses the default redis port if one is not specified', done => {
    jest.isolateModules(async () => {
      process.env.REDIS_HOST = 'localhost'
      delete process.env.REDIS_PORT
      const options = require('../cache.js').config()
      expect(options).toMatchObject({
        store: expect.objectContaining({}),
        host: 'localhost',
        port: 6379,
        ttl: 60 * 60 * 12
      })
      done()
    })
  })

  it('uses an in-memory store if no redis configuration is provided', done => {
    jest.isolateModules(async () => {
      delete process.env.REDIS_HOST
      delete process.env.REDIS_PORT
      const options = require('../cache.js').config()
      expect(options).toMatchObject({
        store: 'memory',
        ttl: 60 * 60 * 12
      })
      done()
    })
  })

  it('does not use the cache when calling .execute()', done => {
    jest.isolateModules(async () => {
      const { CacheableOperation, default: cache } = require('../cache.js')

      const testFetchOp = jest.fn(async () => 'fetchOpResult')
      const testResultProcessor = jest.fn(result => result)
      const test = new CacheableOperation(Math.random(), testFetchOp, testResultProcessor)

      await expect(test.execute()).resolves.toEqual('fetchOpResult')
      await expect(test.execute()).resolves.toEqual('fetchOpResult')
      expect(testFetchOp).toHaveBeenCalledTimes(2)
      expect(cache.get).not.toHaveBeenCalled()
      expect(cache.set).not.toHaveBeenCalled()
      done()
    })
  })

  it('caches the first time .cached() is called', done => {
    jest.isolateModules(async () => {
      const { CacheableOperation, default: cache } = require('../cache.js')

      const testFetchOp = jest.fn(async () => 'fetchOpResult')
      const testResultProcessor = jest.fn(result => result)
      const test = new CacheableOperation(Math.random(), testFetchOp, testResultProcessor)

      await expect(test.cached()).resolves.toEqual('fetchOpResult')
      await expect(test.cached()).resolves.toEqual('fetchOpResult')
      expect(testFetchOp).toHaveBeenCalledTimes(1)
      expect(cache.get).toHaveBeenCalledTimes(2)
      expect(cache.set).toHaveBeenCalledTimes(1)
      done()
    })
  })

  it('refuses to cache values if isCacheableValue returns false', done => {
    jest.isolateModules(async () => {
      const { CacheableOperation, default: cache } = require('../cache.js')

      const testFetchOp = jest.fn(async () => 'fetchOpResult')
      const testResultProcessor = jest.fn(result => result)
      const testIsCacheableValue = jest.fn(() => false)
      const test = new CacheableOperation(Math.random(), testFetchOp, testResultProcessor, testIsCacheableValue)

      await expect(test.cached()).resolves.toEqual('fetchOpResult')
      await expect(test.cached()).resolves.toEqual('fetchOpResult')
      expect(testFetchOp).toHaveBeenCalledTimes(2)
      expect(cache.get).toHaveBeenCalledTimes(2)
      expect(cache.set).not.toHaveBeenCalled()
      done()
    })
  })

  it('exposes a terminateCacheManager method which will terminate the redis connection if it is configured as the backend', done => {
    jest.isolateModules(async () => {
      mockCacheStoreName = 'redis'
      const { terminateCacheManager } = require('../cache.js')
      await expect(terminateCacheManager()).resolves.toBeUndefined()
      expect(mockCacheManagerClientQuit).toHaveBeenCalled()
      expect(mockCacheManagerClientDisconnect).toHaveBeenCalled()
      done()
    })
  })

  it('exposes a terminateCacheManager method which is a no-op if redis is not configured as the backend', done => {
    jest.isolateModules(async () => {
      mockCacheStoreName = 'memory'
      const { terminateCacheManager } = require('../cache.js')
      await expect(terminateCacheManager()).resolves.toBeUndefined()
      expect(mockCacheManagerClientQuit).not.toHaveBeenCalled()
      expect(mockCacheManagerClientDisconnect).not.toHaveBeenCalled()
      done()
    })
  })
})
