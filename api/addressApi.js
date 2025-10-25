import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const addressApi = createApi({
  reducerPath: "addressApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/address`,
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
    createAddress: builder.mutation({
      query: (addressData) => ({
        url: "/",
        method: "POST",
        body: addressData,
      }),
      invalidatesTags: ["Addresses"],
    }),
    getAllAddresses: builder.query({
      query: () => ({
        url: "/",
        method: "GET",
      }),
      providesTags: ["Addresses"],
    }),
    getAddressById: builder.query({
      query: (addressId) => ({
        url: `/${addressId}`,
        method: "GET",
      }),
      providesTags: ["Addresses"],
    }),
    updateAddress: builder.mutation({
      query: ({ addressId, updatedData }) => ({
        url: `/${addressId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Addresses"],
    }),
    deleteAddress: builder.mutation({
      query: (addressId) => ({
        url: `/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Addresses"],
    }),
  }),
});

export const {
  useCreateAddressMutation,
  useGetAllAddressesQuery,
  useGetAddressByIdQuery,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = addressApi;
