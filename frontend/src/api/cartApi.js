import { baseApi } from "./baseApi";

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addToCart: builder.mutation({
      query: (cartData) => ({
        url: "/carts/add",
        method: "POST",
        body: cartData,
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    addProductToCart: builder.mutation({
      query: ({ userId, productId }) => ({
        url: "/carts/add-to-cart",
        method: "POST",
        body: { userId, productId },
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    getCart: builder.query({
      query: (userId) => `/carts/${userId}`,
      providesTags: ["Carts"], // Tag to allow invalidation
    }),
    getAllCarts: builder.query({
      query: () => "/carts/all",
      providesTags: ["Carts"], // Tag to allow invalidation
    }),
    removeFromCart: builder.mutation({
      query: (data) => ({
        url: "/carts/remove",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    reduceQuantity: builder.mutation({
      query: ({ userId, productId }) => ({
        url: "/carts/reduce",
        method: "POST",
        body: { userId, productId },
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    convertToCart: builder.mutation({
      query: (quotationId) => ({
        url: `/carts/convert-to-cart/${quotationId}`,
        method: "POST",
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    clearCart: builder.mutation({
      query: ({ userId }) => ({
        url: "/carts/clear",
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["Carts"], // Invalidate to refetch carts
    }),
    updateCart: builder.mutation({
      query: (data) => ({
        url: "/carts/update",
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
