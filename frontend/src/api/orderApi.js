import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
// Create the API slice
export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/order` }), // Adjust the base URL according to your backend
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
      query: (statusData) => ({
        url: "/update-status",
        method: "PUT",
        body: statusData,
      }),
    }),
    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/delete/${orderId}`,
        method: "DELETE",
      }),
    }),
    recentOrders: builder.query({
      query: () => "/recent",
    }),
    getAllOrders: builder.query({
      query: () => "/all",
    }),
    orderById: builder.query({
      query: (orderId) => `/${orderId}`,
    }),
    updateOrderById: builder.mutation({
      query: ({ orderId, orderData }) => ({
        url: `/${orderId}`,
        method: "PUT",
        body: orderData,
      }),
    }),
    draftOrder: builder.mutation({
      query: (orderData) => ({
        url: "/draft",
        method: "POST",
        body: orderData,
      }),
    }),
    updateOrderTeam: builder.mutation({
      query: (teamData) => ({
        url: "/update-team",
        method: "PUT",
        body: teamData,
      }),
    }),
    fitler: builder.query({
      query: (filters) => {
        const queryParams = new URLSearchParams(filters).toString();
        return `orders?${queryParams}`;
      },
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderDetailsQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useRecentOrdersQuery,
  useOrderByIdQuery,
  useUpdateOrderByIdMutation,
  useDraftOrderMutation,
  useUpdateOrderTeamMutation,
  useGetAllOrdersQuery,
  useFitlerQuery,
} = orderApi;
