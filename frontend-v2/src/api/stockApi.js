import { baseApi } from "../store/baseApi";

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

// Live stock engine: On hand / Reserved / Available / Incoming / Damaged
export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Operations app
    getOpsBoard: builder.query({
      query: () => `/stock/ops/board`,
      providesTags: ["Stock", "ProductInventory", "Orders", "OrderDispatches", "PurchaseOrders"],
    }),
    getReceivablePos: builder.query({
      query: () => `/stock/ops/receivable`,
      providesTags: ["PurchaseOrders"],
    }),
    getGatePasses: builder.query({
      query: (params) => `/stock/ops/gate-passes${qs(params)}`,
      providesTags: ["OrderDispatches"],
    }),
    stockEntry: builder.mutation({
      query: (body) => ({ url: `/stock/ops/entry`, method: "POST", body }),
      invalidatesTags: ["Stock", "ProductInventory", "Orders"],
    }),
    getStockOverview: builder.query({
      query: (params) => `/stock/overview${qs(params)}`,
      providesTags: ["Stock"],
    }),
    getStockAvailability: builder.query({
      query: (productIds) => ({
        url: `/stock/availability`,
        method: "POST",
        body: { productIds },
      }),
      providesTags: ["Stock"],
      keepUnusedDataFor: 30,
    }),
    getProductStock: builder.query({
      query: (productId) => `/stock/products/${productId}`,
      providesTags: (r, e, id) => [{ type: "Stock", id }, "Stock"],
    }),
    getOrderStock: builder.query({
      query: (orderId) => `/stock/orders/${orderId}`,
      providesTags: (r, e, id) => [{ type: "Stock", id: `order-${id}` }, "Stock"],
    }),
    resyncOrderStock: builder.mutation({
      query: (orderId) => ({ url: `/stock/orders/${orderId}/resync`, method: "POST" }),
      invalidatesTags: ["Stock", "Orders"],
    }),
    getBackorders: builder.query({
      query: () => `/stock/backorders`,
      providesTags: ["Stock"],
    }),
    getStockLedger: builder.query({
      query: (params) => `/stock/ledger${qs(params)}`,
      providesTags: ["Stock"],
    }),
    adjustStock: builder.mutation({
      query: (body) => ({ url: `/stock/adjust`, method: "POST", body }),
      invalidatesTags: ["Stock", "Product", "ProductInventory"],
    }),
    transferStock: builder.mutation({
      query: (body) => ({ url: `/stock/transfer`, method: "POST", body }),
      invalidatesTags: ["Stock"],
    }),
    reallocateStock: builder.mutation({
      query: (body) => ({ url: `/stock/reallocate`, method: "POST", body }),
      invalidatesTags: ["Stock", "Orders"],
    }),
    getWarehouses: builder.query({
      query: () => `/stock/warehouses`,
      providesTags: ["Warehouses"],
    }),
    saveWarehouse: builder.mutation({
      query: ({ id, ...body }) => ({
        url: id ? `/stock/warehouses/${id}` : `/stock/warehouses`,
        method: id ? "PUT" : "POST",
        body,
      }),
      invalidatesTags: ["Warehouses", "Stock"],
    }),
    getStockCounts: builder.query({
      query: () => `/stock/counts`,
      providesTags: ["StockCounts"],
    }),
    getStockCount: builder.query({
      query: (id) => `/stock/counts/${id}`,
      providesTags: (r, e, id) => [{ type: "StockCounts", id }],
    }),
    createStockCount: builder.mutation({
      query: (body) => ({ url: `/stock/counts`, method: "POST", body }),
      invalidatesTags: ["StockCounts"],
    }),
    saveStockCountLines: builder.mutation({
      query: ({ id, lines }) => ({ url: `/stock/counts/${id}/lines`, method: "PUT", body: { lines } }),
      invalidatesTags: (r, e, { id }) => [{ type: "StockCounts", id }],
    }),
    approveStockCount: builder.mutation({
      query: (id) => ({ url: `/stock/counts/${id}/approve`, method: "POST" }),
      invalidatesTags: ["StockCounts", "Stock", "Product"],
    }),
  }),
});

export const {
  useGetOpsBoardQuery,
  useGetReceivablePosQuery,
  useGetGatePassesQuery,
  useStockEntryMutation,
  useGetStockOverviewQuery,
  useGetStockAvailabilityQuery,
  useGetProductStockQuery,
  useGetOrderStockQuery,
  useResyncOrderStockMutation,
  useGetBackordersQuery,
  useGetStockLedgerQuery,
  useAdjustStockMutation,
  useTransferStockMutation,
  useReallocateStockMutation,
  useGetWarehousesQuery,
  useSaveWarehouseMutation,
  useGetStockCountsQuery,
  useGetStockCountQuery,
  useCreateStockCountMutation,
  useSaveStockCountLinesMutation,
  useApproveStockCountMutation,
} = stockApi;
