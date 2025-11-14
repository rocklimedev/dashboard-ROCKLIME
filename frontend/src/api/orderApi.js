import { baseApi } from "./baseApi";

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query({
      query: ({ resourceId, resourceType, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          resourceId,
          resourceType,
          page,
          limit,
        });
        return `/order/comments?${params.toString()}`;
      },
      providesTags: ["Comment"],
    }),
    addComment: builder.mutation({
      query: (comment) => ({
        url: "/order/comments",
        method: "POST",
        body: comment,
      }),
      invalidatesTags: ["Comment"],
    }),
    deleteComment: builder.mutation({
      query: ({ commentId, userId }) => ({
        url: `/order/comments/${commentId}`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: ["Comment"],
    }),
    deleteCommentsByResource: builder.mutation({
      query: ({ resourceId, resourceType }) => ({
        url: "/order/delete-comment",
        method: "POST",
        body: { resourceId, resourceType },
      }),
      invalidatesTags: ["Comment"],
    }),
    uploadInvoice: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/order/invoice-upload/${orderId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
      ],
    }),
    /* ──────────────────────── GATE-PASS ──────────────────────── */
    issueGatePass: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/order/${orderId}/gatepass`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
      ],
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/order/create",
        method: "POST",
        body: {
          ...orderData,
          masterPipelineNo: orderData.masterPipelineNo || null,
          previousOrderNo: orderData.previousOrderNo || null,
        },
      }),
      invalidatesTags: ["Orders"],
    }),
    getOrderDetails: builder.query({
      query: (orderId) => `/order/${orderId}`,
      providesTags: (result, error, orderId) => [
        { type: "Orders", id: orderId },
      ],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status }) => ({
        url: "/order/update-status",
        method: "PUT",
        body: { id: orderId, status }, // <-- id, not orderId
      }),
      invalidatesTags: ["Orders"],
    }),
    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/order/delete/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Orders"],
    }),
    recentOrders: builder.query({
      query: () => "/order/recent",
      providesTags: ["Orders"],
    }),
    getAllOrders: builder.query({
      query: () => "/order/all",
      providesTags: ["Orders"],
    }),
    orderById: builder.query({
      query: (orderId) => `/order/${orderId}`,
      providesTags: ["Orders"],
    }),
    updateOrderById: builder.mutation({
      query: ({ id, ...orderData }) => ({
        url: `/order/${id}`,
        method: "PUT",
        body: {
          ...orderData,
          masterPipelineNo: orderData.masterPipelineNo || null,
          previousOrderNo: orderData.previousOrderNo || null,
        },
      }),
      invalidatesTags: ["Orders"],
    }),
    draftOrder: builder.mutation({
      query: (orderData) => ({
        url: "/order/draft",
        method: "POST",
        body: {
          ...orderData,
          masterPipelineNo: orderData.masterPipelineNo || null,
          previousOrderNo: orderData.previousOrderNo || null,
        },
      }),
      invalidatesTags: ["Orders"],
    }),
    updateOrderTeam: builder.mutation({
      query: (teamData) => ({
        url: "/order/update-team",
        method: "PUT",
        body: teamData,
      }),
      invalidatesTags: ["Orders"],
    }),
    getFilteredOrders: builder.query({
      query: (filters) => {
        const validFilters = {};
        // Only include defined and non-empty filters
        Object.keys(filters).forEach((key) => {
          if (
            filters[key] !== undefined &&
            filters[key] !== "" &&
            filters[key] !== null
          ) {
            validFilters[key] = filters[key];
          }
        });
        const params = new URLSearchParams(validFilters);
        return `/order/filter?${params.toString()}`;
      },
      providesTags: ["Orders"],
    }),
    getOrderCountByDate: builder.query({
      query: (date) => `/order/count?date=${date}`,
      providesTags: ["Orders"],
    }),
  }),
});

export const {
  useIssueGatePassMutation,
  useGetOrderCountByDateQuery,
  useUploadInvoiceMutation,
  useDeleteCommentMutation,
  useCreateOrderMutation,
  useGetOrderDetailsQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useRecentOrdersQuery,
  useGetAllOrdersQuery,
  useOrderByIdQuery,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentsByResourceMutation,
  useUpdateOrderByIdMutation,
  useDraftOrderMutation,
  useUpdateOrderTeamMutation,
  useGetFilteredOrdersQuery,
} = orderApi;
