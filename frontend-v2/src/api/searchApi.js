import { toast } from "sonner";
import { baseApi } from "./baseApi";

// Define the search API slice
export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchAll: builder.query({
      query: ({ query, page = 1, limit = 10 }) => ({
        url: "/search/",
        params: { query, page, limit },
      }),
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message || "Search failed");
        }

        const results = Object.entries(response.data).reduce(
          (acc, [modelName, result]) => ({
            ...acc,
            [modelName]: {
              items: result.items,
              total: result.total,
              page: result.page,
              pages: result.pages,
              error: result.error || null,
            },
          }),
          {}
        );

        return {
          results,
          meta: response.meta,
        };
      },
      transformErrorResponse: (error) => {
        const message =
          error.data?.message || "An error occurred during search";
        toast.error(message);
        return { message };
      },
      providesTags: ["Search"], // Added tag to allow invalidation if needed
    }),
  }),
});

// Export the auto-generated hook for the searchAll query
export const { useSearchAllQuery } = searchApi;
