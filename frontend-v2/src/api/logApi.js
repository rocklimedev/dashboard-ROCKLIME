// src/api/logApi.js
import { baseApi } from "./baseApi";

export const logApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/logs - Full text search + filters
    getLogs: builder.query({
      query: ({
        page = 1,
        limit = 20,
        search = "",
        method,
        status,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortOrder = "desc",
      }) => ({
        url: "/logs",
        params: {
          page,
          limit,
          search: search || undefined,
          method: method || undefined,
          status: status || undefined,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
          sortBy,
          sortOrder,
        },
      }),
      providesTags: ["Log"],
      transformResponse: (response) => ({
        logs: response.logs || [],
        pagination: response.pagination || { total: 0 },
      }),
    }),

    // GET /api/logs/:id
    getLogById: builder.query({
      query: (id) => `/logs/${id}`,
      providesTags: (result, error, id) => [{ type: "Log", id }],
    }),

    // DELETE /api/logs/:id
    deleteLog: builder.mutation({
      query: (id) => ({
        url: `/logs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Log"],
    }),

    // DELETE /api/logs (bulk)
    deleteLogs: builder.mutation({
      query: ({ search = "", method, status, startDate, endDate }) => ({
        url: "/logs",
        method: "DELETE",
        params: {
          search: search || undefined,
          method: method || undefined,
          status: status || undefined,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
        },
      }),
      invalidatesTags: ["Log"],
    }),

    // GET /api/logs/stats
    getLogStats: builder.query({
      query: ({ startDate, endDate }) => ({
        url: "/logs/stats",
        params: {
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
        },
      }),
      providesTags: ["LogStats"],
    }),
  }),
});

export const {
  useGetLogsQuery,
  useGetLogByIdQuery,
  useDeleteLogMutation,
  useDeleteLogsMutation,
  useGetLogStatsQuery,
} = logApi;
