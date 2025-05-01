import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/customers`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Customers"], // Define tag type for customers
  endpoints: (builder) => ({
    createCustomer: builder.mutation({
      query: (customerData) => ({
        url: "/",
        method: "POST",
        body: customerData,
      }),
      invalidatesTags: ["Customers"], // Invalidate to refetch customers
    }),
    getCustomers: builder.query({
      query: () => "/",
      providesTags: ["Customers"], // Tag to allow invalidation
    }),
    getCustomerById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Customers"], // Tag for specific customer data
    }),
    getInvoicesByCustomerId: builder.query({
      query: (id) => `/${id}/invoices`,
      providesTags: ["Customers"], // Tag for customer-related invoices
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Customers"], // Invalidate to refetch customers
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers"], // Invalidate to refetch customers
    }),
  }),
});

export const {
  useCreateCustomerMutation,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetInvoicesByCustomerIdQuery,
} = customerApi;
