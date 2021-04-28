import { countries } from '../refdata-helper.js'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    countries: {
      getAll: async () => ({
        options: {
          DE: { description: 'DE', label: 'Germany' },
          NRI: { description: 'GB-NIR', label: 'Northern Ireland' },
          FR: { description: 'FR', label: 'France' },
          SCO: { description: 'GB-SCT', label: 'Scotland' },
          WAL: { description: 'GB-WLS', label: 'Wales' },
          GB: { description: 'GB', label: 'United Kingdom' },
          ENG: { description: 'GB-ENG', label: 'England' },
          IT: { description: 'IT', label: 'Italy' },
          ES: { description: 'ES', label: 'Spain' }
        }
      })
    }
  }
}))

describe('Countries list', () => {
  it('includes home nations', async () => {
    const c = await countries.getAll()
    const homeNations = [
      expect.objectContaining({ code: 'GB-ENG', name: 'England' }),
      expect.objectContaining({ code: 'GB-WLS', name: 'Wales' }),
      expect.objectContaining({ code: 'GB-SCT', name: 'Scotland' }),
      expect.objectContaining({ code: 'GB-NIR', name: 'Northern Ireland' }),
      expect.objectContaining({ code: 'GB', name: 'United Kingdom' })
    ]
    expect(c).toEqual(expect.arrayContaining(homeNations))
  })

  it('Lists countries in correct order', async () => {
    const [first, second, third, fourth, fifth] = await countries.getAll()
    expect(first).toEqual(expect.objectContaining({ code: 'GB-ENG', name: 'England' }))
    expect(second).toEqual(expect.objectContaining({ code: 'GB-WLS', name: 'Wales' }))
    expect(third).toEqual(expect.objectContaining({ code: 'GB-SCT', name: 'Scotland' }))
    expect(fourth).toEqual(expect.objectContaining({ code: 'GB-NIR', name: 'Northern Ireland' }))
    expect(fifth).toEqual(expect.objectContaining({ code: 'GB', name: 'United Kingdom' }))
  })
})
