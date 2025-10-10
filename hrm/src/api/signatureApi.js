import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const signatureApi = createApi({
  reducerPath: "signatureApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/signature`, // Updated to plural to match backend
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } else {
        // Optional: Handle missing token (e.g., log warning or throw error)
        console.warn("No token found in localStorage");
      }
      return headers;
    },
  }),
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
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: "PUT",
        body: body,
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
