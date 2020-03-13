'use strict'

<<<<<<< HEAD
export default (path, view, completion) => ({
=======
export default (path, view) => ({
>>>>>>> work in progress: generic handlers
  /**
   * Generic get handler for pages
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  get: async (request, h) => {
    const cache = await request.cache().get()
    return h.view(view, cache[view])
  },
  /**
   * Generic post handler for pages
   * @param request
   * @param h
   * @returns {Promise<*|Response>}
   */
  post: async (request, h) => {
    await request.cache().set({ [view]: { payload: request.payload } })
<<<<<<< HEAD
    return h.redirect(completion)
=======
    return h.redirect(view)
>>>>>>> work in progress: generic handlers
  },
  /**
   * Generic error handler for pages
   * @param request
   * @param h
   * @param error
   * @returns {Promise<string|((key?: IDBValidKey) => void)>}
   */
  error: async (request, h, err) => {
    await request.cache().set({ [view]: { payload: request.payload, error: err.details } })
    return h.redirect(view).takeover()
  }
})
