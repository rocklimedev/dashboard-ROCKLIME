import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
export const signatureApi = createApi({
  reducerPath: "signatureApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/signature` }), // Update this with your backend URL
  tagTypes: ["Signature"],
  endpoints: (builder) => ({
    createSignature: builder.mutation({
      query: (formData) => ({
        url: "/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Signature"],
    }),
    getAllSignatures: builder.query({
      query: () => "/",
      providesTags: ["Signature"],
    }),
    getSignatureById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Signature"],
    }),
    updateSignature: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "PUT",
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
  }),
});

export const {
  useCreateSignatureMutation,
  useGetAllSignaturesQuery,
  useGetSignatureByIdQuery,
  useUpdateSignatureMutation,
  useDeleteSignatureMutation,
} = signatureApi;
