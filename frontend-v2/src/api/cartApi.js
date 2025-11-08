import { baseApi } from "./baseApi";

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addToCart: builder.mutation({
      query: (cartData) => ({
        url: "/carts/add",
        method: "POST",
        body: cartData,
      }),
      // Remove invalidatesTags
    }),

    addProductToCart: builder.mutation({
      query: ({ userId, productId, quantity }) => ({
        url: "/carts/add-to-cart",
        method: "POST",
        body: { userId, productId, quantity }, // ← ADD QUANTITY
      }),
      // Optional: invalidate or optimistic update
      invalidatesTags: (result, error, { userId }) => [
        { type: "Cart", id: userId },
      ],
    }),
    getCart: builder.query({
      query: (userId) => `/carts/${userId}`,
      providesTags: (result, error, userId) => [{ type: "Cart", id: userId }],
      // Use per-user tag for fine-grained control
    }),

    getAllCarts: builder.query({
      query: () => "/carts/all",
      providesTags: ["Carts"],
    }),

    // OPTIMISTIC UPDATE + NO REFETCH
    updateCart: builder.mutation({
      query: (data) => ({
        url: "/carts/update",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(
        { userId, productId, quantity },
        { dispatch, queryFulfilled }
      ) {
        // Optimistic update
        const patchResult = dispatch(
          cartApi.util.updateQueryData("getCart", userId, (draft) => {
            const item = draft.cart.items.find(
              (i) => i.productId === productId
            );
            if (item) {
              item.quantity = quantity;
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo(); // Rollback on error
        }
      },
    }),

    // OPTIMISTIC REMOVE + NO REFETCH
    removeFromCart: builder.mutation({
      query: (data) => ({
        url: "/carts/remove",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(
        { userId, productId },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          cartApi.util.updateQueryData("getCart", userId, (draft) => {
            draft.cart.items = draft.cart.items.filter(
              (i) => i.productId !== productId
            );
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    clearCart: builder.mutation({
      query: ({ userId }) => ({
        url: "/carts/clear",
        method: "POST",
        body: { userId },
      }),
      async onQueryStarted({ userId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          cartApi.util.updateQueryData("getCart", userId, (draft) => {
            draft.cart.items = [];
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Optional: Keep others without invalidatesTags
    reduceQuantity: builder.mutation({
      query: ({ userId, productId }) => ({
        url: "/carts/reduce",
        method: "POST",
        body: { userId, productId },
      }),
      async onQueryStarted(
        { userId, productId },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          cartApi.util.updateQueryData("getCart", userId, (draft) => {
            const item = draft.cart.items.find(
              (i) => i.productId === productId
            );
            if (item && item.quantity > 1) {
              item.quantity -= 1;
            } else if (item) {
              draft.cart.items = draft.cart.items.filter(
                (i) => i.productId !== productId
              );
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    convertToCart: builder.mutation({
      query: (quotationId) => ({
        url: `/carts/convert-to-cart/${quotationId}`,
        method: "POST",
      }),
      // Keep invalidates if you want fresh data after convert
      invalidatesTags: (result, error, quotationId) => [
        { type: "Cart", id: "CURRENT_USER" },
      ],
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
