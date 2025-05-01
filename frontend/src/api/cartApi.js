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
  tagTypes: ["Carts"], // Define tag type for carts
  endpoints: (builder) => ({
    addToCart: builder.mutation({
      query: (cartData) => ({
        url: "/add",
        method: "POST",
        body: cartData,
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    addProductToCart: builder.mutation({
      query: ({ userId, productId }) => ({
        url: "/add-to-cart",
        method: "POST",
        body: { userId, productId },
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    getCart: builder.query({
      query: (userId) => `/${userId}`,
      providesTags: ["Carts"], // Tag to allow invalidation
    }),
    getAllCarts: builder.query({
      query: () => "/all",
      providesTags: ["Carts"], // Tag to allow invalidation
    }),
    removeFromCart: builder.mutation({
      query: (data) => ({
        url: "/remove",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    reduceQuantity: builder.mutation({
      query: ({ userId, productId }) => ({
        url: "/reduce",
        method: "POST",
        body: { userId, productId },
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    convertToCart: builder.mutation({
      query: (quotationId) => ({
        url: `/convert-to-cart/${quotationId}`,
        method: "POST",
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    clearCart: builder.mutation({
      query: ({ userId }) => ({
        url: "/clear",
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    updateCart: builder.mutation({
      query: (data) => ({
        url: "/update",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
  }),
});

export const {
  useAddToCartMutation,
  useAddProductToCartMutation,
  useGetCartQuery,
  useGetAllCartsQuery,
  useRemoveFromCartMutation,
  useReduceQuantityMutation,
  useConvertToCartMutation,
  useClearCartMutation,
  useUpdateCartMutation,
} = cartApi;
