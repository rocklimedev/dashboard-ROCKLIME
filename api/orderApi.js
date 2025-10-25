import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/order`, // Add /api to match backend route
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Orders", "Comment"],
  endpoints: (builder) => ({
    getComments: builder.query({
      query: ({ resourceId, resourceType, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          resourceId,
          resourceType,
          page,
          limit,
        });
        return `/comments?${params.toString()}`;
      },
      providesTags: ["Comment"],
    }),
    addComment: builder.mutation({
      query: (comment) => ({
        url: "/comments",
        method: "POST",
        body: comment,
      }),
      invalidatesTags: ["Comment"],
    }),
    deleteComment: builder.mutation({
      query: ({ commentId, userId }) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: ["Comment"],
    }),
    deleteCommentsByResource: builder.mutation({
      query: ({ resourceId, resourceType }) => ({
        url: "/delete-comment",
        method: "POST",
        body: { resourceId, resourceType },
      }),
      invalidatesTags: ["Comment"],
    }),
    uploadInvoice: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/invoice-upload/${orderId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "Orders", id: "LIST" },
      ],
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/create",
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
      query: (orderId) => `/${orderId}`,
      providesTags: (result, error, orderId) => [
        { type: "Orders", id: orderId },
      ],
    }),
    updateOrderStatus: builder.mutation({
      query: (statusData) => ({
        url: "/update-status",
        method: "PUT",
        body: statusData,
      }),
      invalidatesTags: ["Orders"],
    }),
    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/delete/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Orders"],
    }),
    recentOrders: builder.query({
      query: () => "/recent",
      providesTags: ["Orders"],
    }),
    getAllOrders: builder.query({
      query: () => "/all",
      providesTags: ["Orders"],
    }),
    orderById: builder.query({
      query: (orderId) => `/${orderId}`,
      providesTags: ["Orders"],
    }),
    updateOrderById: builder.mutation({
      query: ({ id, ...orderData }) => ({
        url: `/${id}`,
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
        url: "/draft",
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
        url: "/update-team",
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
        return `/filter?${params.toString()}`;
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
