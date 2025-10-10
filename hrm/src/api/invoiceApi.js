import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/invoices`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Invoices"], // Define tag type for invoices
  endpoints: (builder) => ({
    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: "/",
        method: "POST",
        body: invoiceData,
      }),
      invalidatesTags: ["Invoices"], // Invalidate to refetch invoices
    }),
    getAllInvoices: builder.query({
      query: () => "/",
      providesTags: ["Invoices"], // Tag to allow invalidation
    }),
    getInvoiceById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Invoices"], // Tag for specific invoice data
    }),
    updateInvoice: builder.mutation({
      query: ({ invoiceId, ...invoiceData }) => ({
        url: `/${invoiceId}`,
        method: "PUT",
        body: invoiceData,
      }),
      invalidatesTags: ["Invoices"], // Invalidate to refetch invoices
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invoices"], // Invalidate to refetch invoices
    }),
    changeInvoiceStatus: builder.mutation({
      query: ({ invoiceId, status }) => ({
        url: `/${invoiceId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Invoices", id },
        "Invoices",
      ], // Refresh specific invoice and list
    }),
  }),
});

export const {
  useCreateInvoiceMutation,
  useGetAllInvoicesQuery,
  useGetInvoiceByIdQuery,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useChangeInvoiceStatusMutation,
} = invoiceApi;
