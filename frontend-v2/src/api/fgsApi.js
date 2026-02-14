import { baseApi } from "./baseApi";
export const fgsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── CREATE FGS ─────────────────────────────────────────────
    createFGS: builder.mutation({
      query: (newFGS) => ({
        url: '/fgs',
        method: 'POST',
        body: newFGS, // { vendorId, items, expectDeliveryDate }
      }),
      invalidatesTags: ['FGSList'],
    }),

    // ─── GET ALL FGS (paginated) ─────────────────────────────────
    getAllFGS: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/fgs',
        params: { page, limit },
      }),
      providesTags: ['FGSList'],
    }),

    // ─── GET SINGLE FGS BY ID ────────────────────────────────────
    getFGSById: builder.query({
      query: (id) => `/fgs/${id}`,
      providesTags: (result, error, id) => [{ type: 'FGS', id }],
    }),

    // ─── UPDATE FGS (full or partial) ────────────────────────────
    updateFGS: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/fgs/${id}`,
        method: 'PUT',
        body: updates, // { vendorId?, items?, status?, expectDeliveryDate? }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FGS', id },
        'FGSList',
      ],
    }),

    // ─── DELETE FGS ──────────────────────────────────────────────
    deleteFGS: builder.mutation({
      query: (id) => ({
        url: `/fgs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FGSList'],
    }),

    // ─── CONVERT FGS → PO ────────────────────────────────────────
    convertFgsToPo: builder.mutation({
      query: (id) => ({
        url: `/fgs/${id}/convert`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'FGS', id },
        'FGSList',
      ],
    }),

    // ─── UPDATE FGS STATUS ONLY ──────────────────────────────────
    updateFGSStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/fgs/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FGS', id },
        'FGSList',
      ],
    }),
  }),
});

// Auto-generated hooks
export const {
  useCreateFGSMutation,
  useGetAllFGSQuery,
  useGetFGSByIdQuery,
  useUpdateFGSMutation,
  useDeleteFGSMutation,
  useConvertFgsToPoMutation,
  useUpdateFGSStatusMutation,
} = fgsApi;