// src/api/importApi.js
import { baseApi } from "./baseApi";

export const importApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Start bulk import job (file + mapping)
    startBulkImport: builder.mutation({
      query: ({ file, mapping }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mapping", JSON.stringify(mapping));

        return {
          url: "/imports/start",
          method: "POST",
          body: formData,
          // Important: DO NOT set Content-Type manually — let browser/fetch set multipart/form-data
        };
      },
      invalidatesTags: ["ImportJobs"],
      // Optional: transform response if needed
      transformResponse: (response) => response,
    }),

    // Get status of an import job
    getImportStatus: builder.query({
      query: (jobId) => `/imports/${jobId}/status`,
      invalidatesTags: ["ImportJobs"],
      // Optional: keep polling while job is running
      pollingInterval: 5000, // check every 5 seconds (remove or increase if not wanted)
    }),
  }),
});

// Export hooks
export const {
  useStartBulkImportMutation,
  useGetImportStatusQuery,
  useLazyGetImportStatusQuery,
} = importApi;

export default importApi;
