'use strict'

import deleteMessages from '../delete-messages'
import AWS from 'aws-sdk'
import fetch from 'node-fetch'
import readQueue from '../read-queue'

test('Delete messages successfully', async () => {
  const results = await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277522',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b2',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277523',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b3',
      status: 4200
    }
  ])

  expect(results).toEqual({
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    },
    Successful: [
      {
        Id: '58f6f3c9-97f8-405a-a3a7-5ac467277521'
      },
      {
        Id: '58f6f3c9-97f8-405a-a3a7-5ac467277522'
      }
    ],
    Failed: []
  })
})

test('Delete messages with failures', async () => {
  AWS.__mockDeleteMessageFailures()
  const results = await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277522',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b2',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277523',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b3',
      status: 4200
    }
  ])

  expect(results).toEqual({
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    },
    Successful: [],
    Failed: [
      {
        Id: '58f6f3c9-97f8-405a-a3a7-5ac467277521'
      },
      {
        Id: '58f6f3c9-97f8-405a-a3a7-5ac467277522'
      }
    ]
  })
})

test('Delete message does not throw exception', async () => {
  AWS.__mockNotFound()

  const result = await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 200
    }
  ])
  expect(result).toStrictEqual([])
})
