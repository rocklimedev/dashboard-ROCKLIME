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
    getCart: builder.query({
      query: (userId) => `/${userId}`,
    }),
    removeFromCart: builder.mutation({
      query: (data) => ({
        url: "/remove",
        method: "POST",
        body: data,
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
  useRemoveFromCartMutation,
  useConvertToCartMutation,
  useClearCartMutation, // ✅ Hook for clearing cart
  useUpdateCartMutation, // ✅ Hook for updating cart item
} = cartApi;
