import { baseApi } from "./baseApi";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createProduct: builder.mutation({
      query: (productData) => ({
        url: "/products/",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Product"],
    }),

    getProductsByIds: builder.query({
      query: (productIds) => ({
        url: "/products/by-ids",
        method: "POST",
        body: { productIds },
      }),
      transformResponse: (response) => response,
    }),

    getAllProducts: builder.query({
      query: () => "/products/",
      providesTags: ["Product"],
    }),

    getProductById: builder.query({
      query: (productId) => `/products/${productId}`,
      providesTags: ["Product"],
    }),

    updateProduct: builder.mutation({
      query: ({ productId, updatedData }) => ({
        url: `/products/${productId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Product"],
    }),

    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    addStock: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/products/${productId}/add-stock`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: ["Product"],
    }),

    removeStock: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/products/${productId}/remove-stock`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: ["Product"],
    }),

    getAllProductsByCategory: builder.query({
      query: (categoryId) => ({
        url: `/products/category/${categoryId}`,
        method: "GET",
      }),
      providesTags: ["Product"],
    }),

    getLowStockProducts: builder.query({
      query: (threshold = 10) => `/products/low-stock?threshold=${threshold}`,
      providesTags: ["Product"],
    }),

    getHistoryByProductId: builder.query({
      query: (productId) => `/products/${productId}/history`,
      providesTags: ["Product"],
    }),

    getAllProductCodes: builder.query({
      query: () => "/products/search/get-product-codes",
      providesTags: ["Product"],
    }),

    searchProducts: builder.query({
      query: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return `/products/search/all?${queryString}`;
      },
      providesTags: ["Product"],
    }),

    updateProductFeatured: builder.mutation({
      query: ({ productId, isFeatured }) => ({
        url: `/products/${productId}/featured`,
        method: "PATCH",
        body: { isFeatured },
      }),
      invalidatesTags: ["Product"],
    }),

    // NEW ENDPOINT
    getAllProductCodesBrandWise: builder.query({
      query: () => "/products/codes/brand-wise",
      providesTags: ["Product"],
    }),
  }),
});

// Export all hooks including the new one
export const {
  useGetProductsByIdsQuery,
  useUpdateProductFeaturedMutation,
  useCreateProductMutation,
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddStockMutation,
  useRemoveStockMutation,
  useGetLowStockProductsQuery,
  useGetHistoryByProductIdQuery,
  useSearchProductsQuery,
  useGetAllProductCodesQuery,
  useGetAllProductsByCategoryQuery,
  useGetAllProductCodesBrandWiseQuery, // NEW
} = productApi;
