import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/api/orders" }),
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/create",
        method: "POST",
        body: orderData,
      }),
    }),
    getOrderDetails: builder.query({
      query: (orderId) => `/${orderId}`,
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status }) => ({
        url: "/update-status",
        method: "PUT",
        body: { orderId, status },
      }),
    }),
    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/${orderId}`,
        method: "DELETE",
      }),
    }),
    getRecentOrders: builder.query({
      query: () => "/recent",
    }),
    getOrderById: builder.query({
      query: (orderId) => `/order/${orderId}`,
    }),
    updateOrderById: builder.mutation({
      query: ({ orderId, updates }) => ({
        url: `/order/${orderId}`,
        method: "PUT",
        body: updates,
      }),
    }),
    createDraftOrder: builder.mutation({
      query: (orderData) => ({
        url: "/draft",
        method: "POST",
        body: orderData,
      }),
    }),
    updateOrderTeam: builder.mutation({
      query: ({ orderId, teamMembers }) => ({
        url: "/update-team",
        method: "PUT",
        body: { orderId, teamMembers },
      }),
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderDetailsQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useGetRecentOrdersQuery,
  useGetOrderByIdQuery,
  useUpdateOrderByIdMutation,
  useCreateDraftOrderMutation,
  useUpdateOrderTeamMutation,
} = orderApi;
