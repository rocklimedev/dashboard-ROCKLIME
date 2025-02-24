import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const keywordApi = createApi({
  reducerPath: "keywordApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/api" }), // Adjust base URL if needed
  tagTypes: ["Keyword"], // Helps with caching and auto-refetching
  endpoints: (builder) => ({
    getAllKeywords: builder.query({
      query: () => "/keywords",
      providesTags: ["Keyword"],
    }),
    getKeywordById: builder.query({
      query: (id) => `/keywords/${id}`,
      providesTags: (result, error, id) => [{ type: "Keyword", id }],
    }),
    createKeyword: builder.mutation({
      query: (newKeyword) => ({
        url: "/keywords",
        method: "POST",
        body: newKeyword,
      }),
      invalidatesTags: ["Keyword"],
    }),
    updateKeyword: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `/keywords/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Keyword", id }],
    }),
    deleteKeyword: builder.mutation({
      query: (id) => ({
        url: `/keywords/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Keyword"],
    }),
  }),
});

export const {
  useGetAllKeywordsQuery,
  useGetKeywordByIdQuery,
  useCreateKeywordMutation,
  useUpdateKeywordMutation,
  useDeleteKeywordMutation,
} = keywordApi;
