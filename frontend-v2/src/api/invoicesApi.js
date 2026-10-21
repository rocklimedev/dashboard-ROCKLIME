import { baseApi } from '../store/baseApi';

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && v !== '' && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

// GST tax invoices made in the ERP
export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => `/invoices${qs(params)}`,
      providesTags: ['Invoices'],
    }),
    getOrderInvoices: builder.query({
      query: (orderId) => `/invoices/order/${orderId}`,
      providesTags: (r, e, id) => [{ type: 'Invoices', id }, 'Invoices'],
    }),
    previewInvoice: builder.mutation({
      query: (body) => ({ url: `/invoices/preview`, method: 'POST', body }),
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: `/invoices`, method: 'POST', body }),
      invalidatesTags: (r, e, { orderId }) => [
        'Invoices',
        { type: 'Invoices', id: orderId },
        'Orders',
        { type: 'OrderDispatches', id: orderId },
      ],
    }),
    cancelInvoice: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/invoices/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Invoices', 'Orders'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetOrderInvoicesQuery,
  usePreviewInvoiceMutation,
  useCreateInvoiceMutation,
  useCancelInvoiceMutation,
} = invoicesApi;
