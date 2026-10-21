import { baseApi } from '../store/baseApi';
import { API_URL } from '../store/config';

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(
    ([k, v]) => v !== undefined && v !== null && v !== '' && p.set(k, v),
  );
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const catalogueFileUrl = (id) => `${API_URL}/catalogues/${id}/file`;
export const catalogueCoverUrl = (id) => `${API_URL}/catalogues/${id}/cover`;

// Brand PDF catalogues
export const catalogueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCatalogues: builder.query({
      query: (params) => `/catalogues${qs(params)}`,
      providesTags: ['Catalogues'],
    }),
    getCatalogue: builder.query({
      query: (id) => `/catalogues/${id}`,
      providesTags: (r, e, id) => [{ type: 'Catalogues', id }],
    }),
    searchCatalogues: builder.query({
      query: (params) => `/catalogues/search${qs(params)}`,
    }),
    uploadCatalogue: builder.mutation({
      query: (form) => ({ url: `/catalogues`, method: 'POST', body: form }),
      invalidatesTags: ['Catalogues'],
    }),
    updateCatalogue: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/catalogues/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Catalogues'],
    }),
    saveCatalogueText: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/catalogues/${id}/text`, method: 'POST', body }),
      invalidatesTags: ['Catalogues'],
    }),
    deleteCatalogue: builder.mutation({
      query: (id) => ({ url: `/catalogues/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Catalogues'],
    }),
  }),
});

export const {
  useGetCataloguesQuery,
  useGetCatalogueQuery,
  useSearchCataloguesQuery,
  useUploadCatalogueMutation,
  useUpdateCatalogueMutation,
  useSaveCatalogueTextMutation,
  useDeleteCatalogueMutation,
} = catalogueApi;
