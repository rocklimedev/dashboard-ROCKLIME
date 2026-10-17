import { baseApi } from "../store/baseApi";

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && v !== "" && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

// Accounts: payments received against orders, money due
export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMoneyDue: builder.query({
      query: () => `/payments/due`,
      providesTags: ["Payments"],
    }),
    getPayments: builder.query({
      query: (params) => `/payments${qs(params)}`,
      providesTags: ["Payments"],
    }),
    getOrderPayments: builder.query({
      query: (orderId) => `/payments/order/${orderId}`,
      providesTags: (r, e, id) => [{ type: "Payments", id }, "Payments"],
    }),
    recordPayment: builder.mutation({
      query: (body) => ({ url: `/payments`, method: "POST", body }),
      invalidatesTags: ["Payments", "Orders"],
    }),
    cancelPayment: builder.mutation({
      query: ({ id, reason }) => ({ url: `/payments/${id}/cancel`, method: "POST", body: { reason } }),
      invalidatesTags: ["Payments", "Orders"],
    }),
  }),
});

export const {
  useGetMoneyDueQuery,
  useGetPaymentsQuery,
  useGetOrderPaymentsQuery,
  useRecordPaymentMutation,
  useCancelPaymentMutation,
} = paymentsApi;
