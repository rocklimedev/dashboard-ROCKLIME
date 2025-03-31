import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/carts`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    addToCart: builder.mutation({
      query: (cartData) => ({
        url: "/add",
        method: "POST",
        body: cartData,
      }),
    }),
    addProductToCart: builder.mutation({
      query: ({ userId, productId }) => ({
        url: "/add-to-cart",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId }),
      }),
    }),
    getCart: builder.query({
      query: (userId) => `/${userId}`,
    }),
    getAllCarts: builder.query({
      query: () => "/all",
    }),
    removeFromCart: builder.mutation({
      query: (data) => ({
        url: "/remove",
        method: "POST",
        body: data,
      }),
    }),
    reduceQuantity: builder.mutation({
      query: ({ userId, productId }) => ({
        url: "/reduce",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId }),
      }),
    }),
    convertToCart: builder.mutation({
      query: (quotationId) => ({
        url: `/convert-to-cart/${quotationId}`,
        method: "POST",
      }),
    }),
    clearCart: builder.mutation({
      query: () => ({
        url: "/clear",
        method: "POST",
      }),
    }),
    updateCart: builder.mutation({
      query: (data) => ({
        url: "/update",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useAddToCartMutation,
  useGetCartQuery,
  useGetAllCartsQuery,
  useRemoveFromCartMutation,
  useReduceQuantityMutation,
  useConvertToCartMutation,
  useClearCartMutation,
  useUpdateCartMutation,
  useAddProductToCartMutation,
} = cartApi;
