import Project from '../project.cjs'
import cacheManager from 'cache-manager'
import redisStore from 'cache-manager-ioredis'

export function config () {
  return {
    store: 'memory',
    ttl: process.env.DYNAMICS_CACHE_TTL || 60 * 60 * 12,
    ...(process.env.REDIS_HOST && {
      store: redisStore,
      keyPrefix: `${Project.packageJson.version}/`,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      ...(process.env.REDIS_PASSWORD && {
        password: process.env.REDIS_PASSWORD,
        tls: {}
      })
    })
  }
}

const cache = cacheManager.caching(config())

process.env.REDIS_HOST && cache.store.getClient().on('error', console.error)

export class CacheableOperation {
  /**
   * Create a new CacheableOperation
   *
   * @param {string} cacheKey the key to use for the cache
   * @param {function: Promise<*>} fetchOp the fetch operation whose result will be cached
   * @param {function(*): *} resultProcessor a post-processor to apply to the result
   * @param {function(string): Promise<boolean>} isCacheableValue a function which is passed a result and may return false to exclude the value from the cache
   */
  constructor (cacheKey, fetchOp, resultProcessor, isCacheableValue = () => true) {
    this._cacheKey = cacheKey
    this._fetchOp = fetchOp
    this._resultProcessor = resultProcessor
    this._isCacheableValue = isCacheableValue
  }

  async execute () {
    return this._resultProcessor(await this._fetchOp())
  }

  async cached (options = {}) {
    let result = await cache.get(this._cacheKey)
    if (result === undefined || result === null) {
      result = await this._fetchOp()
      const isCacheable = await this._isCacheableValue(result)
      if (isCacheable) {
        await cache.set(this._cacheKey, result, options)
      }
    }
    return this._resultProcessor(result)
  }
}

/**
 * Terminate the cache manager to release any resources
 * @returns {Promise<boolean|*>}
 */
export const terminateCacheManager = async () => {
  if (cache.store.name === 'redis') {
    await cache.store.getClient().quit()
    cache.store.getClient().disconnect()
  }
}

export default cache
