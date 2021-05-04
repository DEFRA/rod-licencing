import { escapeODataStringValue } from '../util.js'

describe('util', () => {
  describe('escapeODataStringValue', () => {
    it('escapes all illegal characters used in a string value of an ODATA $filter clause', async () => {
      expect(escapeODataStringValue("test%+/?#&'test%+/?#&'test")).toEqual("test%25%2B%2F%3F%23%26''test%25%2B%2F%3F%23%26''test")
    })
  })
})
