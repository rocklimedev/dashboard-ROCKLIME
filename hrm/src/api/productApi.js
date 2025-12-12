import { baseApi } from "./baseApi";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE PRODUCT — with images & variant support
    createProduct: builder.mutation({
      query: (formData) => ({
        url: "/products/",
        method: "POST",
        body: formData,
        formData: true, // This tells RTK not to JSON.stringify
      }),
      transformResponse: (response) => response.product,
      invalidatesTags: ["Product", "ProductCode"],
    }),

    // UPDATE PRODUCT — critical: send FormData + keywordIds
    updateProduct: builder.mutation({
      query: ({ productId, formData }) => ({
        url: `/products/${productId}`,
        method: "PUT",
        body: formData,
        formData: true, // This is the key
      }),
      transformResponse: (response) => response.product,
      invalidatesTags: ["Product", "ProductCode"],
    }),

    // CHECK PRODUCT CODE UNIQUENESS
    checkProductCode: builder.query({
      query: (code) => `/products/check-code?code=${encodeURIComponent(code)}`,
      providesTags: (result, error, code) => [
        { type: "ProductCode", id: code },
      ],
      keepUnusedDataFor: 10,
    }),

    // REPLACE ALL KEYWORDS — this is the one you use on save!
    // In productApi.js — THIS IS THE FIX
    replaceAllKeywordsForProduct: builder.mutation({
      query: ({ productId, keywordIds = [] }) => ({
        url: `/products/${productId}/keywords`,
        method: "PUT",
        // REMOVE THIS LINE COMPLETELY:
        // headers: { "Content-Type": "application/json" },
        body: { keywordIds },
      }),
      invalidatesTags: ["Product"],
    }),

    // Optional: add single keyword (not needed if using replaceAll)
    addKeywordsToProduct: builder.mutation({
      query: ({ productId, keywords }) => ({
        url: `/products/${productId}/keywords`,
        method: "POST",

        body: { keywords },
      }),
      invalidatesTags: ["Product"],
    }),

    // GET ALL PRODUCTS
    getAllProducts: builder.query({
      query: () => "/products",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ productId }) => ({
                type: "Product",
                id: productId,
              })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),

    // GET SINGLE PRODUCT
    getProductById: builder.query({
      query: (productId) => `/products/${productId}`,
      providesTags: (result, error, productId) => [
        { type: "Product", id: productId },
      ],
    }),

    // DELETE PRODUCT
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    // STOCK
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

    // REST OF YOUR ENDPOINTS — all perfect
    getProductsByIds: builder.query({
      query: (productIds) => ({
        url: "/products/by-ids",
        method: "POST",
        body: { productIds },
      }),
    }),

    getAllProductsByCategory: builder.query({
      query: (categoryId) => `/products/category/${categoryId}`,
      providesTags: ["Product"],
    }),

    getLowStockProducts: builder.query({
      query: () => "/products/low-stock",
      providesTags: ["Product"],
    }),

    getHistoryByProductId: builder.query({
      query: (productId) => `/products/${productId}/history`,
      providesTags: ["Product"],
    }),

    searchProducts: builder.query({
      query: (searchTerm) =>
        `/products/search/all?q=${encodeURIComponent(searchTerm)}`,
      providesTags: ["Product"],
    }),

    getAllProductCodes: builder.query({
      query: () => "/products/search/get-product-codes",
      providesTags: ["ProductCode"],
    }),

    getAllProductCodesBrandWise: builder.query({
      query: () => "/products/codes/brand-wise",
      providesTags: ["ProductCode"],
    }),

    updateProductFeatured: builder.mutation({
      query: ({ productId, isFeatured }) => ({
        url: `/products/${productId}/featured`,
        method: "PATCH",
        body: { isFeatured },
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useLazyGetProductByIdQuery,
  useDeleteProductMutation,
  useAddStockMutation,
  useRemoveStockMutation,
  useGetLowStockProductsQuery,
  useGetHistoryByProductIdQuery,
  useSearchProductsQuery,
  useGetAllProductCodesQuery,
  useGetAllProductCodesBrandWiseQuery,
  useGetProductsByIdsQuery,
  useCheckProductCodeQuery,
  useLazyCheckProductCodeQuery,
  useReplaceAllKeywordsForProductMutation,
  useAddKeywordsToProductMutation,
  useUpdateProductFeaturedMutation,
  useGetAllProductsByCategoryQuery,
} = productApi;
