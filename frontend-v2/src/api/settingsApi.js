import { baseApi } from '../store/baseApi';

// Company details printed on documents, quotation defaults
export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => `/settings`,
      providesTags: ['Settings'],
    }),
    saveSetting: builder.mutation({
      query: ({ key, ...body }) => ({ url: `/settings/${key}`, method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useSaveSettingMutation } = settingsApi;
