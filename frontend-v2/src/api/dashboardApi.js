import { baseApi } from "../store/baseApi";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Counts and totals for a date range, calculated on the server
    getDashboardSummary: builder.query({
      query: ({ from, to, days, latest }) => {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (days) params.set("days", days);
        if (latest) params.set("latest", latest);
        return `/dashboard/summary?${params.toString()}`;
      },
      providesTags: ["Orders", "Quotations"],
    }),
    // Home → My day: follow-ups, orders to dispatch, money, arriving goods
    getMyDay: builder.query({
      query: (scope) => `/dashboard/my-day${scope ? `?scope=${scope}` : ""}`,
      providesTags: ["Orders", "Quotations", "Payments", "PurchaseOrders"],
    }),
    getDailySummary: builder.query({
      query: (date) => `/dashboard/daily-summary${date ? `?date=${date}` : ""}`,
      providesTags: ["Orders", "Quotations", "Payments", "Invoices"],
    }),
    sendDailySummary: builder.mutation({
      query: (date) => ({ url: "/dashboard/daily-summary/send", method: "POST", body: { date } }),
    }),
    // Reports run on the server
    getReportList: builder.query({ query: () => "/reports" }),
    runReport: builder.query({
      query: ({ key, ...params }) => {
        const p = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => v != null && v !== "" && p.set(k, v));
        return `/reports/${key}?${p.toString()}`;
      },
      providesTags: ["Orders", "Quotations", "ProductInventory"],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetMyDayQuery,
  useGetDailySummaryQuery,
  useLazyGetDailySummaryQuery,
  useSendDailySummaryMutation,
  useGetReportListQuery,
  useRunReportQuery,
} = dashboardApi;
