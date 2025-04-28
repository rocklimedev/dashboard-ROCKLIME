import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
// Create the API slice for invoices
export const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/invoices` }), // Adjust the base URL according to your backend
  endpoints: (builder) => ({
    // Create a new invoice
    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: "/",
        method: "POST",
        body: invoiceData,
      }),
    }),
    // Get all invoices
    getAllInvoices: builder.query({
      query: () => "/",
    }),
    // Get an invoice by ID
    getInvoiceById: builder.query({
      query: (id) => `/${id}`,
    }),
    // Update an invoice by ID
    updateInvoice: builder.mutation({
      query: ({ invoiceId, invoiceData }) => ({
        url: `/${invoiceId}`,
        method: "PUT",
        body: invoiceData,
      }),
    }),
    // Delete an invoice by ID
    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateInvoiceMutation,
  useGetAllInvoicesQuery,
  useGetInvoiceByIdQuery,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} = invoiceApi;
