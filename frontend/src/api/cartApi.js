import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api/carts" }), // Adjust URL as needed
  endpoints: (builder) => ({
    addToCart: builder.mutation({
      query: (product) => ({
        url: "/add",
        method: "POST",
        body: product,
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
  }),
});

export const {
  useAddToCartMutation,
  useGetCartQuery,
  useRemoveFromCartMutation,
} = cartApi;
