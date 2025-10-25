import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const signatureApi = createApi({
  reducerPath: "signatureApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/signature`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Signature"],
  endpoints: (builder) => ({
    // -------------------------------
    // CREATE / UPDATE / DELETE
    // -------------------------------
    createSignature: builder.mutation({
      query: (formData) => ({
        url: "/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Signature"],
    }),
    updateSignature: builder.mutation({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Signature"],
    }),
    deleteSignature: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Signature"],
    }),
    deleteAllSignaturesByEntity: builder.mutation({
      query: ({ userId, customerId, vendorId }) => ({
        url: "/",
        method: "DELETE",
        params: { userId, customerId, vendorId },
      }),
      invalidatesTags: ["Signature"],
    }),

    // -------------------------------
    // GET SIGNATURES
    // -------------------------------
    getAllSignatures: builder.query({
      query: () => "/",
      providesTags: ["Signature"],
    }),
    getSignatureById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Signature"],
    }),
    getSignaturesByUser: builder.query({
      query: (userId) => `/user/${userId}`,
      providesTags: ["Signature"],
    }),
    getSignaturesByCustomer: builder.query({
      query: (customerId) => `/customer/${customerId}`,
      providesTags: ["Signature"],
    }),
    getSignaturesByVendor: builder.query({
      query: (vendorId) => `/vendor/${vendorId}`,
      providesTags: ["Signature"],
    }),

    // -------------------------------
    // DEFAULT SIGNATURE
    // -------------------------------
    setDefaultSignature: builder.mutation({
      query: (id) => ({
        url: `/${id}/default`,
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
        return `/default?${params.toString()}`;
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
