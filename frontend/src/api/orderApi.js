import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/order`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Orders"], // Define tag type for orders
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
        url: "/delete-comment", // Match backend route
        method: "POST",
        body: { resourceId, resourceType },
      }),
      invalidatesTags: ["Comment"],
    }),
    uploadInvoice: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/invoice-upload/${orderId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/create",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Orders"], // Invalidate to refetch orders
    }),
    getOrderDetails: builder.query({
      query: (orderId) => `/${orderId}`,
      providesTags: ["Orders"], // Tag for specific order data
    }),
    updateOrderStatus: builder.mutation({
      query: (statusData) => ({
        url: "/update-status",
        method: "PUT",
        body: statusData,
      }),
      invalidatesTags: ["Orders"], // Invalidate to refetch orders
    }),
    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/delete/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Orders"], // Invalidate to refetch orders
    }),
    recentOrders: builder.query({
      query: () => "/recent",
      providesTags: ["Orders"], // Tag for recent orders
    }),
    getAllOrders: builder.query({
      query: () => "/all",
      providesTags: ["Orders"], // Tag for all orders
    }),
    orderById: builder.query({
      query: (orderId) => `/${orderId}`,
      providesTags: ["Orders"], // Tag for specific order data
    }),
    updateOrderById: builder.mutation({
      query: ({ id, ...orderData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: orderData,
      }),
      invalidatesTags: ["Orders"], // Invalidate to refetch orders
    }),
    draftOrder: builder.mutation({
      query: (orderData) => ({
        url: "/draft",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Orders"], // Invalidate to refetch orders
    }),
    updateOrderTeam: builder.mutation({
      query: (teamData) => ({
        url: "/update-team",
        method: "PUT",
        body: teamData,
      }),
      invalidatesTags: ["Orders"], // Invalidate to refetch orders
    }),
    getFilteredOrders: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters);
        return `/filter?${params.toString()}`;
      },
      providesTags: ["Orders"], // Tag for filtered orders
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
