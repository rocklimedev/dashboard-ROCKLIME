import { baseApi } from '../store/baseApi';
export const zohoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getZohoStatus: builder.query({ query: () => '/zoho/status', providesTags: ['Zoho'] }),
    zohoAuthorize: builder.mutation({
      query: (options) => ({
        url: `/zoho/authorize?${new URLSearchParams(typeof options === 'string' ? { accountsUrl: options } : { accountsUrl: options.accountsUrl, planning: String(options.planning) })}`,
        method: 'GET',
      }),
    }),
    zohoDisconnect: builder.mutation({
      query: () => ({ url: '/zoho/connection', method: 'DELETE' }),
      invalidatesTags: ['Zoho', 'Cliq', 'Crm'],
    }),
  }),
});
export const { useGetZohoStatusQuery, useZohoAuthorizeMutation, useZohoDisconnectMutation } =
  zohoApi;
