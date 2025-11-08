import { baseApi } from "./baseApi";
export const keywordApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllKeywords: builder.query({
      query: () => "/keyword/",
      providesTags: ["Keyword"],
    }),
    getKeywordById: builder.query({
      query: (id) => `/keyword/${id}`,
      providesTags: (result, error, id) => [{ type: "Keyword", id }],
    }),
    createKeyword: builder.mutation({
      query: (newKeyword) => ({
        url: "/keyword/",
        method: "POST",
        body: newKeyword,
      }),
      invalidatesTags: ["Keyword"],
    }),
    updateKeyword: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `/keyword/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Keyword", id }],
    }),
    deleteKeyword: builder.mutation({
      query: (id) => ({
        url: `/keyword/${id}`,
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
