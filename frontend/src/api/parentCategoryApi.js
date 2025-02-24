import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const parentCategoryApi = createApi({
  reducerPath: "parentCategoryApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/api/parent-categories" }), // Adjust base URL if needed
  tagTypes: ["ParentCategory"], // Helps with caching and auto-refetching
  endpoints: (builder) => ({
    getAllParentCategories: builder.query({
      query: () => "/",
      providesTags: ["ParentCategory"],
    }),
    getParentCategoryById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "ParentCategory", id }],
    }),
    createParentCategory: builder.mutation({
      query: (newCategory) => ({
        url: "/",
        method: "POST",
        body: newCategory,
      }),
      invalidatesTags: ["ParentCategory"],
    }),
    updateParentCategory: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ParentCategory", id }],
    }),
    deleteParentCategory: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
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
