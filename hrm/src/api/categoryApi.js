import { baseApi } from "./baseApi";
export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: "/category/",
        method: "POST",
        body: categoryData,
        credentials: "include", // Include cookies if using authentication
      }),
      invalidatesTags: ["Category"],
    }),
    getAllCategories: builder.query({
      query: () => "/category/all",
      providesTags: ["Category"],
    }),
    getCategoryById: builder.query({
      query: (id) => `/category/${id}`,
      providesTags: ["Category"],
    }),
    updateCategory: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `/category/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Category"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useCreateCategoryMutation,
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
