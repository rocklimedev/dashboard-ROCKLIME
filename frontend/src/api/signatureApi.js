import { baseApi } from "./baseApi";

export const signatureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // -------------------------------
    // CREATE / UPDATE / DELETE
    // -------------------------------
    createSignature: builder.mutation({
      query: (formData) => ({
        url: "/signature/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Signature"],
    }),
    updateSignature: builder.mutation({
      query: ({ id, body }) => ({
        url: `/signature/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Signature"],
    }),
    deleteSignature: builder.mutation({
      query: (id) => ({
        url: `/signature/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Signature"],
    }),
    deleteAllSignaturesByEntity: builder.mutation({
      query: ({ userId, customerId, vendorId }) => ({
        url: "/signature/",
        method: "DELETE",
        params: { userId, customerId, vendorId },
      }),
      invalidatesTags: ["Signature"],
    }),

    // -------------------------------
    // GET SIGNATURES
    // -------------------------------
    getAllSignatures: builder.query({
      query: () => "/signature/",
      providesTags: ["Signature"],
    }),
    getSignatureById: builder.query({
      query: (id) => `/signature/${id}`,
      providesTags: ["Signature"],
    }),
    getSignaturesByUser: builder.query({
      query: (userId) => `/signature/user/${userId}`,
      providesTags: ["Signature"],
    }),
    getSignaturesByCustomer: builder.query({
      query: (customerId) => `/signature/customer/${customerId}`,
      providesTags: ["Signature"],
    }),
    getSignaturesByVendor: builder.query({
      query: (vendorId) => `/signature/vendor/${vendorId}`,
      providesTags: ["Signature"],
    }),

    // -------------------------------
    // DEFAULT SIGNATURE
    // -------------------------------
    setDefaultSignature: builder.mutation({
      query: (id) => ({
        url: `/signature/${id}/default`,
        method: "PUT",
      }),
      invalidatesTags: ["Signature"],
    }),
    getDefaultSignature: builder.query({
      query: ({ userId, customerId, vendorId }) => {
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (customerId) params.append("customerId", customerId);
        if (vendorId) params.append("vendorId", vendorId);
        return `/signature/default?${params.toString()}`;
      },
      providesTags: ["Signature"],
    }),
  }),
});

export const {
  // Mutations
  useCreateSignatureMutation,
  useUpdateSignatureMutation,
  useDeleteSignatureMutation,
  useDeleteAllSignaturesByEntityMutation,
  useSetDefaultSignatureMutation,
  // Queries
  useGetAllSignaturesQuery,
  useGetSignatureByIdQuery,
  useGetSignaturesByUserQuery,
  useGetSignaturesByCustomerQuery,
  useGetSignaturesByVendorQuery,
  useGetDefaultSignatureQuery,
} = signatureApi;
