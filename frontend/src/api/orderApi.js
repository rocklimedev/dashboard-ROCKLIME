import { baseApi } from "../store/baseApi";

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
    downloadInvoice: builder.query({
      query: (orderId) => ({
        url: `/order/${orderId}/download-invoice`,
        // Important: responseType tells RTK Query this is a blob/stream
        responseHandler: "content-type", // keeps raw response
        cache: "no-cache",
      }),
      // No provides/invalidates tags needed — this is a download only
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
    /* ──────────────────────── PARTIAL DISPATCH ──────────────────────── */
    createDispatch: builder.mutation({
      // formData: items (as a JSON string field), carrier, trackingNumber,
      // remarks, and an optional "gatePass" file — OR pass a plain object
      // and RTK Query/your fetchBaseQuery will JSON-encode it if you're not
      // attaching a file. Use formData when uploading a gate-pass file.
      query: ({ orderId, formData }) => ({
        url: `/order/${orderId}/dispatch`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
        { type: "OrderDispatches", id: orderId },
        { type: "OrderActivity", id: orderId },
      ],
    }),
    getOrderDispatches: builder.query({
      query: (orderId) => `/order/${orderId}/dispatches`,
      providesTags: (result, error, orderId) => [
        { type: "OrderDispatches", id: orderId },
      ],
    }),
    /* ──────────────────────── ORDER ACTIVITY ──────────────────────── */
    getOrderActivity: builder.query({
      query: ({ orderId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams({ page, limit });
        return `/order/${orderId}/activity?${params.toString()}`;
      },
      providesTags: (result, error, { orderId }) => [
        { type: "OrderActivity", id: orderId },
      ],
    }),
    /* ──────────────────────── CREDIT NOTE ──────────────────────── */
    uploadCreditNote: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/order/${orderId}/credit-note`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
        { type: "OrderActivity", id: orderId },
      ],
    }),
    /* ──────────────────────── RECEIVING DOCUMENT ──────────────────────── */
    uploadReceivingDocument: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/order/${orderId}/receiving-document`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
        { type: "OrderActivity", id: orderId },
      ],
    }),
    /* ──────────────────────── CREDIT NOTE ──────────────────────── */

    createCreditNote: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/order/${orderId}/credit-note`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
        { type: "OrderActivity", id: orderId },
      ],
    }),

    getOrderCreditNotes: builder.query({
      query: (orderId) => `/order/${orderId}/credit-notes`,
      providesTags: (result, error, orderId) => [
        { type: "OrderCreditNotes", id: orderId },
      ],
    }),

    getOrderCreditNote: builder.query({
      query: ({ orderId, creditNoteId }) =>
        `/order/${orderId}/credit-note/${creditNoteId}`,
      providesTags: (result, error, { orderId, creditNoteId }) => [
        { type: "OrderCreditNotes", id: creditNoteId },
        { type: "OrderCreditNotes", id: orderId },
      ],
    }),
    /* ──────────────────────── CREDIT NOTE ACTIONS ──────────────────────── */

    cancelOrderCreditNote: builder.mutation({
      query: ({ orderId, creditNoteId }) => ({
        url: `/order/${orderId}/credit-note/${creditNoteId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { orderId, creditNoteId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
        { type: "OrderCreditNotes", id: creditNoteId },
        { type: "OrderCreditNotes", id: orderId },
        { type: "OrderActivity", id: orderId },
      ],
    }),

    uploadCreditNoteDocument: builder.mutation({
      query: ({ orderId, creditNoteId, formData }) => ({
        url: `/order/${orderId}/credit-note/${creditNoteId}/document`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { orderId, creditNoteId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
        { type: "OrderCreditNotes", id: creditNoteId },
        { type: "OrderCreditNotes", id: orderId },
        { type: "OrderActivity", id: orderId },
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
      query: (filters = {}) => {
        const params = new URLSearchParams();

        // Add only non-empty values
        if (filters.search?.trim()) {
          params.append("search", filters.search.trim());
        }
        if (filters.status?.trim()) {
          params.append("status", filters.status.trim());
        }
        if (filters.priority?.trim()) {
          params.append("priority", filters.priority.trim());
        }

        // Always include pagination
        params.append("page", filters.page ?? 1);
        params.append("limit", filters.limit ?? 20);

        return `/order/all?${params.toString()}`;
      },
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
    downloadOrderSummary: builder.query({
      query: (orderId) => ({
        url: `/order/${orderId}/download-order`,
        responseHandler: async (response) => response.blob(),
        cache: "no-cache",
      }),
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
  useLazyDownloadOrderSummaryQuery,
  useGetAllOrdersQuery,
  useOrderByIdQuery,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentsByResourceMutation,
  useUpdateOrderByIdMutation,
  useDraftOrderMutation,
  useUpdateOrderTeamMutation,
  useGetFilteredOrdersQuery,
  useLazyDownloadInvoiceQuery,
  // ← NEW
  useCreateDispatchMutation,
  useGetOrderDispatchesQuery,
  useGetOrderActivityQuery,
  useUploadCreditNoteMutation,
  useUploadReceivingDocumentMutation,
  useCreateCreditNoteMutation,
  useGetOrderCreditNotesQuery,
  // NEW
  useCancelOrderCreditNoteMutation,
  useUploadCreditNoteDocumentMutation,
  useGetOrderCreditNoteQuery,
} = orderApi;
