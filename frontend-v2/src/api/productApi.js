import { baseApi } from "./baseApi";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE PRODUCT
    createProduct: builder.mutation({
      query: (formData) => ({
        url: "/products/",
        method: "POST",
        body: formData,
        formData: true,
      }),
      transformResponse: (response) => response.product,
      invalidatesTags: [
        "Product",
        "ProductCode",
        { type: "Product", id: "LIST" },
      ],
    }),
    bulkImportProducts: builder.mutation({
      query: (products) => ({
        url: "/products/bulk-import",
        method: "POST",
        body: { products },
      }),
      invalidatesTags: [
        "Product",
        { type: "Product", id: "LIST" },
        "ProductCode",
      ],
    }),
    // UPDATE PRODUCT (images + fields)
    updateProduct: builder.mutation({
      query: ({ productId, formData }) => ({
        url: `/products/${productId}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
      transformResponse: (response) => response.product,
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
        "ProductCode",
      ],
    }),

    // REPLACE ALL KEYWORDS — CRITICAL ENDPOINT
    replaceAllKeywordsForProduct: builder.mutation({
      query: ({ productId, keywordIds = [] }) => ({
        url: `/products/${productId}/keywords`,
        method: "PUT",
        body: { keywordIds },
        // No Content-Type header needed — RTK handles JSON automatically
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),

    // Optional: add single keywords (if needed elsewhere)
    addKeywordsToProduct: builder.mutation({
      query: ({ productId, keywords }) => ({
        url: `/products/${productId}/keywords`,
        method: "POST",
        body: { keywords },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),

    // CHECK PRODUCT CODE UNIQUENESS
    checkProductCode: builder.query({
      query: (code) => `/products/check-code?code=${encodeURIComponent(code)}`,
      providesTags: (result, error, code) => [
        { type: "ProductCode", id: code },
      ],
      keepUnusedDataFor: 30, // slightly longer cache
    }),

    // GET ALL PRODUCTS — NOW PAGINATED!
    getAllProducts: builder.query({
      query: ({ page = 1, limit = 20, search } = {}) => ({
        url: "/products",
        params: { page, limit, search },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ productId }) => ({
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
      invalidatesTags: (result, error, productId) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
        "ProductCode",
      ],
    }),

    // STOCK MANAGEMENT
    addStock: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/products/${productId}/add-stock`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),

    removeStock: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/products/${productId}/remove-stock`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),

    // BULK FETCH BY IDS (for top products, etc.)
    getProductsByIds: builder.query({
      query: (productIds) => ({
        url: "/products/by-ids",
        method: "POST",
        body: { productIds },
      }),
      // FIX: Safely handle both { data: [...] } and direct array responses
      providesTags: (result) => {
        const products = Array.isArray(result) ? result : result?.data || [];

        return products.map(({ productId }) => ({
          type: "Product",
          id: productId,
        }));
      },
    }),
    // OTHER ENDPOINTS
    getAllProductsByCategory: builder.query({
      query: (categoryId) => `/products/category/${categoryId}`,
      providesTags: ["Product"],
    }),
    getProductsByBrand: builder.query({
      query: ({ brandId, page = 1, limit = 50, search }) => ({
        url: `/products/brand/${brandId}`,
        params: { page, limit, search },
      }),
    }),
    getLowStockProducts: builder.query({
      query: () => "/products/low-stock",
      providesTags: ["Product"],
    }),
    // productApi.js
    getTopSellingProducts: builder.query({
      query: (limit = 10) => `/products/top-selling?limit=${limit}`,
      providesTags: ["Product"],
    }),

    getHistoryByProductId: builder.query({
      query: (productId) => `/products/${productId}/history`,
      providesTags: (result, error, productId) => [
        { type: "Product", id: productId },
      ],
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
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetAllProductsQuery,
  useLazyGetAllProductsQuery, // ← useful for pagination
  useGetProductsByBrandQuery,
  useBulkImportProductsMutation,
  useGetTopSellingProductsQuery,
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
