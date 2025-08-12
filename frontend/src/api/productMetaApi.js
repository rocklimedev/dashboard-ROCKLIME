// src/services/productMetaApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
export const productMetaApi = createApi({
  reducerPath: "productMetaApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/product-meta` }), // adjust base URL if needed
  tagTypes: ["ProductMeta"],
  endpoints: (builder) => ({
    // POST /
    createProductMeta: builder.mutation({
      query: (newData) => ({
        url: "/",
        method: "POST",
        body: newData,
      }),
      invalidatesTags: ["ProductMeta"],
    }),

    // GET /
    getAllProductMeta: builder.query({
      query: () => "/",
      providesTags: ["ProductMeta"],
    }),

    // GET /search?title=...
    getProductMetaByTitle: builder.query({
      query: (title) => `/search?title=${encodeURIComponent(title)}`,
      providesTags: ["ProductMeta"],
    }),

    // GET /:id
    getProductMetaById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "ProductMeta", id }],
    }),

    // PUT /:id
    updateProductMeta: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ProductMeta", id }],
    }),

    // DELETE /:id
    deleteProductMeta: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "ProductMeta", id }],
    }),
  }),
});

export const {
  useCreateProductMetaMutation,
  useGetAllProductMetaQuery,
  useGetProductMetaByTitleQuery,
  useGetProductMetaByIdQuery,
  useUpdateProductMetaMutation,
  useDeleteProductMetaMutation,
} = productMetaApi;
