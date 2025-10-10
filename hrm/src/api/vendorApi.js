import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const vendorApi = createApi({
  reducerPath: "vendorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/vendors`, // Make sure API_URL is correct
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getVendors: builder.query({
      query: () => "/",
    }),
    getVendorById: builder.query({
      query: (id) => `/${id}`,
    }),
    createVendor: builder.mutation({
      query: (newVendor) => ({
        url: "/",
        method: "POST",
        body: newVendor,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),
    updateVendor: builder.mutation({
      query: ({ id, updatedVendor }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updatedVendor,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),
    deleteVendor: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorApi;
