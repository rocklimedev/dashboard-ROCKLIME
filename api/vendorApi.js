import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const vendorApi = createApi({
  reducerPath: "vendorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/vendors`,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Vendors"], // define tag type
  endpoints: (builder) => ({
    getVendors: builder.query({
      query: () => "/",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Vendors", id })),
              { type: "Vendors", id: "LIST" },
            ]
          : [{ type: "Vendors", id: "LIST" }],
    }),
    getVendorById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Vendors", id }],
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
      invalidatesTags: [{ type: "Vendors", id: "LIST" }],
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
      invalidatesTags: (result, error, { id }) => [{ type: "Vendors", id }],
    }),
    checkVendorId: builder.query({
      query: (vendorId) => `/check-vendor-id/${vendorId}`,
      transformResponse: (response) => response.isUnique,
    }),
    deleteVendor: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
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
