import commander from 'commander'
import * as processor from '../processors/processor.js'

jest.mock('commander', () => {
  const commander = jest.requireActual('commander')
  commander.parse = jest.fn()
  return commander
})

jest.mock('../processors/processor.js')

describe('payment-mop-up-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts the mop up job with --age-minutes=3 and --scan-duration=67', async () => {
    jest.isolateModules(() => {
      processor.execute = jest.fn(async () => Promise.resolve())
      commander.parse = jest.fn(() => {
        commander.ageMinutes = 3
        commander.scanDurationHours = 67
      })
      require('../payment-mop-up-job.js')
      expect(processor.execute).toHaveBeenCalledWith(3, 67)
    })
  })

  it('starts the mop up job with default age of 180 minutes and scan duration of 24 hours', async () => {
    jest.isolateModules(() => {
      processor.execute = jest.fn(async () => Promise.resolve())
      commander.parse = jest.fn()
      require('../payment-mop-up-job.js')
      expect(processor.execute).toHaveBeenCalledWith(180, 24)
    })
  })

  it('will exit with an exit with an incorrect --age-minutes argument', async () => {
    jest.isolateModules(() => {
      processor.execute = jest.fn(async () => Promise.resolve())
      commander.parse = jest.fn(() => {
        commander.ageMinutes = -1
      })
      require('../payment-mop-up-job.js')
      expect(processor.execute).not.toHaveBeenCalled()
    })
  })

  it('will exit with an exit code of 1 with an incorrect --scanDurationHours argument', async () => {
    jest.isolateModules(() => {
      processor.execute = jest.fn()
      commander.parse = jest.fn(() => {
        commander.scanDurationHours = 0
      })
      require('../payment-mop-up-job.js')
      expect(processor.execute).not.toHaveBeenCalled()
    })
  })

  it('will exit with an exit code of 1 if the mop up job throws an error', async () => {
    jest.isolateModules(() => {
      processor.execute = jest.fn(async () => Promise.reject(new Error()))
      require('../payment-mop-up-job.js')
      expect(processor.execute).not.toHaveBeenCalled()
    })
  })
})
