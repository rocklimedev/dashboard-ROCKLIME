import { baseApi } from "./baseApi";

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query({
      query: () => "/vendors/",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Vendors", id })),
              { type: "Vendors", id: "LIST" },
            ]
          : [{ type: "Vendors", id: "LIST" }],
    }),
    getVendorById: builder.query({
      query: (id) => `/vendors/${id}`,
      providesTags: (result, error, id) => [{ type: "Vendors", id }],
    }),
    createVendor: builder.mutation({
      query: (newVendor) => ({
        url: "/vendors/",
        method: "POST",
        body: newVendor,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: [{ type: "Vendors", id: "LIST" }],
    }),
    updateVendor: builder.mutation({
      query: ({ id, updatedVendor }) => ({
        url: `/vendors/${id}`,
        method: "PUT",
        body: updatedVendor,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Vendors", id }],
    }),
    checkVendorId: builder.query({
      query: (vendorId) => `/vendors/check-vendor-id/${vendorId}`,
      transformResponse: (response) => response.isUnique,
    }),
    deleteVendor: builder.mutation({
      query: (id) => ({
        url: `/vendors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Vendors", id },
        { type: "Vendors", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useCheckVendorIdQuery,
} = vendorApi;
