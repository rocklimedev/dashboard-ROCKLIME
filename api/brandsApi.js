import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const brandApi = createApi({
  reducerPath: "brandApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/brands`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Brands"], // Define tag type for brands
  endpoints: (builder) => ({
    getAllBrands: builder.query({
      query: () => "/",
      providesTags: ["Brands"], // Tag to allow invalidation
    }),
    getBrandById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Brands"], // Tag for specific brand data
    }),
    createBrand: builder.mutation({
      query: (brandData) => ({
        url: "/add",
        method: "POST",
        body: brandData,
      }),
      invalidatesTags: ["Brands"], // Invalidate to refetch brands
    }),
    updateBrand: builder.mutation({
      query: ({ id, ...brandData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: brandData,
      }),
      invalidatesTags: ["Brands"], // Invalidate to refetch brands
    }),
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Brands"], // Invalidate to refetch brands
    }),
  }),
});

export const {
  useGetAllBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandApi;
