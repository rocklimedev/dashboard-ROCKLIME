import { baseApi } from "./baseApi";
export const parentCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllParentCategories: builder.query({
      query: () => "/parent-categories/",
      providesTags: ["ParentCategory"],
    }),
    getParentCategoryById: builder.query({
      query: (id) => `/parent-categories/${id}`,
      providesTags: (result, error, id) => [{ type: "ParentCategory", id }],
    }),
    createParentCategory: builder.mutation({
      query: (newCategory) => ({
        url: "/parent-categories/",
        method: "POST",
        body: newCategory,
      }),
      invalidatesTags: ["ParentCategory"],
    }),
    updateParentCategory: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `/parent-categories/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ParentCategory", id },
      ],
    }),
    deleteParentCategory: builder.mutation({
      query: (id) => ({
        url: `/parent-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ParentCategory"],
    }),
  }),
});

export const {
  useGetAllParentCategoriesQuery,
  useGetParentCategoryByIdQuery,
  useCreateParentCategoryMutation,
  useUpdateParentCategoryMutation,
  useDeleteParentCategoryMutation,
} = parentCategoryApi;
