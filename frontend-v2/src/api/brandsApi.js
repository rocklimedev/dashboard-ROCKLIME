import { baseApi } from "./baseApi";
export const brandApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBrands: builder.query({
      query: () => "/brands",
      providesTags: ["Brands"], // Tag to allow invalidation
    }),
    getBrandById: builder.query({
      query: (id) => `/brands/${id}`,
      providesTags: ["Brands"], // Tag for specific brand data
    }),
    createBrand: builder.mutation({
      query: (brandData) => ({
        url: "/brands/add",
        method: "POST",
        body: brandData,
      }),
      invalidatesTags: ["Brands"], // Invalidate to refetch brands
    }),
    updateBrand: builder.mutation({
      query: ({ id, ...brandData }) => ({
        url: `/brands/${id}`,
        method: "PUT",
        body: brandData,
      }),
      invalidatesTags: ["Brands"], // Invalidate to refetch brands
    }),
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `/brands/${id}`,
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
