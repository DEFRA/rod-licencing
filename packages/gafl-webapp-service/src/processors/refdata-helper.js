import { salesApi } from '@defra-fish/connectors-lib'

const optionProc = c =>
  Object.values(c.options).map(p => ({
    code: p.description,
    name: p.label
  }))

const local = {}

const fetch = async () => {
  // Returns all countries from Dynamics
  return optionProc(await salesApi.countries.getAll()).sort((a, b) => {
    const order = ['GB-ENG', 'GB-WLS', 'GB-SCT', 'GB-NIR', 'GB']
    if (a.code.startsWith('GB')) {
      if (b.code.startsWith('GB')) {
        return order.indexOf(a.code) - order.indexOf(b.code)
      }
      return -1
    }
    return 0
  })
}

// Process the country code option set into a useful form - once
export const countries = {
  getAll: async () => {
    local.countries = local.countries || (await fetch())
    return local.countries
  },
  nameFromCode: async code => {
    local.countries = local.countries || (await fetch())
    return local.countries.find(c => c.code === code).name
  }
}
