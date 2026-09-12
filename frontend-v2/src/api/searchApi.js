import { toast } from "sonner";
import { baseApi } from "../store/baseApi";

// Define the search API slice
export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchAll: builder.query({
      query: ({ query, page = 1, limit = 20 }) => ({
        url: "/search/",
        params: { query, page, limit },
      }),

      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message || "Search failed");
        }

        return {
          // Pass through exactly what the backend returns
          data: response.data, // { Brand: {...}, Category: {...}, Product: {...}, PurchaseOrder: {...} }
          meta: response.meta || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
          },
        };
      },

      transformErrorResponse: (error) => {
        const message =
          error.data?.message || "An error occurred during search";
        toast.error(message);
        return { message };
      },

      providesTags: ["Search"],
    }),
  }),
});

export const { useSearchAllQuery } = searchApi;
