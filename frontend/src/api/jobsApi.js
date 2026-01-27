// src/services/api/jobApi.js
import { baseApi } from "./baseApi";

export const jobApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ───────────────────────────────────────────────
    //                Bulk Import Endpoints
    // ───────────────────────────────────────────────

    previewImportFile: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/jobs/bulk-import/preview",
          method: "POST",
          body: formData,
          // Important: do NOT set Content-Type header manually
          // browser will set multipart/form-data + boundary automatically
        };
      },
      // Optional: you can add invalidatesTags if needed (rare for preview)
    }),

    startBulkImport: builder.mutation({
      query: ({ file, mapping }) => {
        const formData = new FormData();
        formData.append("file", file);
        // mapping is usually a JS object → convert to JSON string
        if (mapping) {
          formData.append("mapping", JSON.stringify(mapping));
        }

        return {
          url: "/jobs/bulk-import/start",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Jobs"], // so list of jobs refreshes
    }),

    // ───────────────────────────────────────────────
    //                General Job Endpoints
    // ───────────────────────────────────────────────

    getAllJobs: builder.query({
      query: (params = {}) => {
        // params can include: page, limit, status, type, userId, sortBy, sortOrder
        return {
          url: "/jobs", // note: your route is mounted as /jobs (see router.get("/"))
          method: "GET",
          params, // automatically serialized as ?page=1&limit=20&status=pending...
        };
      },
      providesTags: ["Jobs"],
    }),
    downloadSuccessfulEntries: builder.query({
      query: (jobId) => ({
        url: `/jobs/${jobId}/successful-entries`,
        method: "GET",
        // Important: tell RTK Query we want the raw response (blob)
        responseHandler: (response) => response.blob(),
      }),
      // No providesTags needed — this is a download, not cacheable data
    }),
    getJobById: builder.query({
      query: (jobId) => `/jobs/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: "Jobs", id: jobId }],
    }),

    getJobStatus: builder.query({
      query: (jobId) => `/jobs/${jobId}/status`,
      providesTags: (result, error, jobId) => [{ type: "Jobs", id: jobId }],
    }),

    cancelJob: builder.mutation({
      query: (jobId) => ({
        url: `/jobs/${jobId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, jobId) => [
        "Jobs",
        { type: "Jobs", id: jobId },
      ],
    }),

    deleteJob: builder.mutation({
      query: (jobId) => ({
        url: `/jobs/${jobId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Jobs"],
    }),

    updateJobStatus: builder.mutation({
      query: ({ jobId, status, note }) => ({
        url: `/jobs/${jobId}/status`,
        method: "PATCH",
        body: { status, note },
      }),
      invalidatesTags: (result, error, { jobId }) => [
        "Jobs",
        { type: "Jobs", id: jobId },
      ],
    }),

    // ───────────────────────────────────────────────
    //           Example: Other job types
    // ───────────────────────────────────────────────

    startReportGeneration: builder.mutation({
      query: (payload) => ({
        url: "/jobs/reports/generate",
        method: "POST",
        body: payload, // e.g. { reportType, filters, ... }
      }),
      invalidatesTags: ["Jobs"],
    }),
  }),
});

export const {
  // Bulk import
  usePreviewImportFileMutation,
  useStartBulkImportMutation,
  useDownloadSuccessfulEntriesQuery,
  useLazyDownloadSuccessfulEntriesQuery,
  // General jobs
  useGetAllJobsQuery,
  useGetJobByIdQuery,
  useGetJobStatusQuery,
  useCancelJobMutation,
  useDeleteJobMutation,
  useUpdateJobStatusMutation,

  // Other job types
  useStartReportGenerationMutation,
} = jobApi;
