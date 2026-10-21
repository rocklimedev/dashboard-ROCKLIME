import { baseApi } from '../store/baseApi';

export const operationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOperations: builder.query({ query: () => '/operations' }),
    runOperation: builder.mutation({
      query: ({ service, threshold }) => ({
        url: `/operations/${service}`,
        method: 'POST',
        body: { threshold },
      }),
    }),
    downloadOperation: builder.mutation({
      query: ({ id, part }) => ({ url: `/operations/artifacts/${id}${part ? '/' + part : ''}` }),
    }),
  }),
});
export const { useGetOperationsQuery, useRunOperationMutation, useDownloadOperationMutation } =
  operationsApi;
