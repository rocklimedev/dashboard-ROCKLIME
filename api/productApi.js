import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/products`,
    prepareHeaders: (headers, { getState }) => {
      // Add authentication token if required
      const token = getState().auth?.token; // Adjust based on your auth state
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Product"],
  endpoints: (builder) => ({
    createProduct: builder.mutation({
      query: (productData) => ({
        url: "/",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Product"],
    }),
    getProductsByIds: builder.query({
      query: (productIds) => ({
        url: "/by-ids",
        method: "POST",
        body: { productIds },
      }),
      transformResponse: (response) => response,
    }),
    getAllProducts: builder.query({
      query: () => "/",
      providesTags: ["Product"],
    }),

    getProductById: builder.query({
      query: (productId) => `/${productId}`,
      providesTags: ["Product"],
    }),

    updateProduct: builder.mutation({
      query: ({ productId, updatedData }) => ({
        url: `/${productId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Product"],
    }),

    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    addStock: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/${productId}/add-stock`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: ["Product"],
    }),

    removeStock: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/${productId}/remove-stock`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: ["Product"],
    }),

    getAllProductsByCategory: builder.query({
      query: (categoryId) => ({
        url: `/category/${categoryId}`,
        method: "GET",
      }),
      providesTags: ["Product"],
    }),

    getLowStockProducts: builder.query({
      query: (threshold = 10) => `/low-stock?threshold=${threshold}`,
      providesTags: ["Product"],
    }),

    getHistoryByProductId: builder.query({
      query: (productId) => `/${productId}/history`,
      providesTags: ["Product"],
    }),

    getAllProductCodes: builder.query({
      query: () => "/search/get-product-codes",
      providesTags: ["Product"],
    }),

    searchProducts: builder.query({
      query: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return `/search/all?${queryString}`;
      },
      providesTags: ["Product"],
    }),
    updateProductFeatured: builder.mutation({
      query: ({ productId, isFeatured }) => ({
        url: `/${productId}/featured`,
        method: "PATCH",
        body: { isFeatured },
      }),
      invalidatesTags: ["Product"], // Refetch products after update
    }),
  }),
});

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
} = productApi;
