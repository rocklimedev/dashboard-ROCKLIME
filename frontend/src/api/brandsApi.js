import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
export const brandApi = createApi({
  reducerPath: "brandApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/brands` }), // Adjust your backend URL
  endpoints: (builder) => ({
    getAllBrands: builder.query({
      query: () => "/",
    }),
    getBrandById: builder.query({
      query: (id) => `/${id}`,
    }),
    createBrand: builder.mutation({
      query: (brandData) => ({
        url: "/add",
        method: "POST",
        body: brandData,
      }),
    }),
    updateBrand: builder.mutation({
      query: ({ id, ...brandData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: brandData,
      }),
    }),
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE", // Change to DELETE if API supports it
      }),
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
