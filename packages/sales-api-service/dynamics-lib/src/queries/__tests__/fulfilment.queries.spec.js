import { findUnassociatedFulfilmentRequests, findFulfilmentFiles } from '../fulfilment.queries.js'

describe('Fulfilment Queries', () => {
  describe('findUnassociatedFulfilmentRequests', () => {
    it('builds a request to run a query for fulfilment requests which are not associated with a fulfilment file', async () => {
      const query = findUnassociatedFulfilmentRequests()
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_fulfilmentrequests',
        expand: expect.arrayContaining([
          expect.objectContaining({
            property: 'defra_PermissionId',
            expand: expect.arrayContaining([
              expect.objectContaining({ property: 'defra_ContactId' }),
              expect.objectContaining({ property: 'defra_PermitId' })
            ])
          })
        ]),
        filter: 'defra_FulfilmentRequestFileId eq null and statecode eq 0',
        select: expect.any(Array),
        orderBy: ['defra_requesttimestamp asc']
      })
    })
  })

  describe('findFulfilmentFiles', () => {
    it('builds a request to run a query for fulfilment files with a given date and status', async () => {
      const pendingFileStatus = {
        id: 910400000,
        label: 'Pending',
        description: 'Pending'
      }
      const query = findFulfilmentFiles({ date: '2020-06-18T11:47:32.982Z', status: pendingFileStatus })
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_fulfilmentrequestfiles',
        filter:
          "Microsoft.Dynamics.CRM.On(PropertyName='defra_date', PropertyValue=2020-06-18) and defra_status eq 910400000 and statecode eq 0",
        select: expect.any(Array)
      })
    })

    it('builds a request to run a query for fulfilment files with just a given date', async () => {
      const query = findFulfilmentFiles({ date: '2020-06-18T11:47:32.982Z' })
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_fulfilmentrequestfiles',
        filter: "Microsoft.Dynamics.CRM.On(PropertyName='defra_date', PropertyValue=2020-06-18) and statecode eq 0",
        select: expect.any(Array)
      })
    })

    it('builds a request to run a query for fulfilment files with just a given status', async () => {
      const pendingFileStatus = {
        id: 910400000,
        label: 'Pending',
        description: 'Pending'
      }
      const query = findFulfilmentFiles({ status: pendingFileStatus })
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_fulfilmentrequestfiles',
        filter: 'defra_status eq 910400000 and statecode eq 0',
        select: expect.any(Array)
      })
    })

    it('retrieves all fulfilment request files if no filters are provided', async () => {
      const query = findFulfilmentFiles()
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_fulfilmentrequestfiles',
        filter: 'statecode eq 0',
        select: expect.any(Array)
      })
    })
  })
})
