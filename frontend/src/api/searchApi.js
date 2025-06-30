import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "sonner"; // Change import to sonner
import { API_URL } from "../data/config";

// Define the search API slice
export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/search`,
  }),
  endpoints: (builder) => ({
    searchAll: builder.query({
      query: ({ query, page = 1, limit = 10 }) => ({
        url: "/",
        params: { query, page, limit },
      }),
      transformResponse: (response) => {
        // Ensure response is valid
        if (!response.success) {
          throw new Error(response.message || "Search failed");
        }

        // Simplify the response structure for frontend use
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
        toast.error(message); // Use sonner toast
        return { message };
      },
    }),
  }),
});

// Export the auto-generated hook for the searchAll query
export const { useSearchAllQuery } = searchApi;
