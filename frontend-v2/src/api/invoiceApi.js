import { baseApi } from "./baseApi";

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: "/invoices/",
        method: "POST",
        body: invoiceData,
      }),
      invalidatesTags: ["Invoices"], // Invalidate to refetch invoices
    }),
    getAllInvoices: builder.query({
      query: () => "/invoices/",
      providesTags: ["Invoices"], // Tag to allow invalidation
    }),
    getInvoiceById: builder.query({
      query: (id) => `/invoices/${id}`,
      providesTags: ["Invoices"], // Tag for specific invoice data
    }),
    updateInvoice: builder.mutation({
      query: ({ invoiceId, ...invoiceData }) => ({
        url: `/invoices/${invoiceId}`,
        method: "PUT",
        body: invoiceData,
      }),
      invalidatesTags: ["Invoices"], // Invalidate to refetch invoices
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invoices"], // Invalidate to refetch invoices
    }),
    changeInvoiceStatus: builder.mutation({
      query: ({ invoiceId, status }) => ({
        url: `/invoices/${invoiceId}/status`,
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
