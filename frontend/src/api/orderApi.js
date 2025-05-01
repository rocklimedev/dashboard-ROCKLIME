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
      query: ({ orderId, ...orderData }) => ({
        url: `/${orderId}`,
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
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderDetailsQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useRecentOrdersQuery,
  useGetAllOrdersQuery,
  useOrderByIdQuery,
  useUpdateOrderByIdMutation,
  useDraftOrderMutation,
  useUpdateOrderTeamMutation,
  useGetFilteredOrdersQuery,
} = orderApi;
