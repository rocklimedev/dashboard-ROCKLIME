import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/products` }), // Change the base URL if needed
  tagTypes: ["Product"],
  endpoints: (builder) => ({
    // Create Product
    createProduct: builder.mutation({
      query: (productData) => ({
        url: "/",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Product"],
    }),

    // Get All Products
    getAllProducts: builder.query({
      query: () => "/",
      providesTags: ["Product"],
    }),

    // Get Product by ID
    getProductById: builder.query({
      query: (productId) => `/${productId}`,
      providesTags: ["Product"],
    }),

    // Update Product
    updateProduct: builder.mutation({
      query: ({ productId, updatedData }) => ({
        url: `/${productId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Product"],
    }),

    // Delete Product
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    // Inventory Management: Add Stock
    addStock: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/${productId}/add-stock`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: ["Product"],
    }),

    // Inventory Management: Remove Stock
    removeStock: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/${productId}/remove-stock`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: ["Product"],
    }),

    // Get Low Stock Products
    getLowStockProducts: builder.query({
      query: (threshold = 10) => `/low-stock?threshold=${threshold}`,
      providesTags: ["Product"],
    }),

    // Get Inventory History by Product ID
    getHistoryByProductId: builder.query({
      query: (productId) => `/${productId}/history`, // Assuming your API follows this route
      providesTags: ["Product"],
    }),
    searchProducts: builder.query({
      query: (params) => {
        const queryString = new URLSearchParams(params).toString(); // Convert params object to query string
        return `/search?${queryString}`;
      },
      providesTags: ["Product"],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddStockMutation,
  useRemoveStockMutation,
  useGetLowStockProductsQuery,
  useGetHistoryByProductIdQuery,
  useSearchProductsQuery, // ✅ Added hook for fetching history
} = productApi;
