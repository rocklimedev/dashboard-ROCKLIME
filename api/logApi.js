import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const logApi = createApi({
  reducerPath: "logApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
    credentials: "include",
    tagTypes: ["Logs"],
    prepareHeaders: (headers) => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // GET /api/logs - Fetch logs with filtering, sorting, and pagination
    getLogs: builder.query({
      query: ({
        page = 1,
        limit = 10,
        method = "",
        route = "",
        user = "",
        startDate = null,
        endDate = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      }) => ({
        url: "/logs",
        params: {
          page,
          limit,
          method: method || undefined,
          route: route || undefined,
          user: user || undefined,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
          sortBy,
          sortOrder,
        },
      }),
      transformResponse: (response) => ({
        logs: response.logs,
        pagination: response.pagination,
      }),
    }),

    // GET /api/logs/:id - Fetch a single log by ID
    getLogById: builder.query({
      query: (id) => ({
        url: `/logs/${id}`,
      }),
      transformResponse: (response) => response,
    }),

    // DELETE /api/logs/:id - Delete a single log by ID
    deleteLog: builder.mutation({
      query: (id) => ({
        url: `/logs/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response,
    }),

    // DELETE /api/logs - Bulk delete logs based on filters
    deleteLogs: builder.mutation({
      query: ({
        method = "",
        route = "",
        user = "",
        startDate = null,
        endDate = null,
      }) => ({
        url: "/logs",
        method: "DELETE",
        params: {
          method: method || undefined,
          route: route || undefined,
          user: user || undefined,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
        },
      }),
      transformResponse: (response) => response,
    }),

    // GET /api/logs/stats - Get summary statistics of logs
    getLogStats: builder.query({
      query: ({ startDate = null, endDate = null }) => ({
        url: "/logs/stats",
        params: {
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
        },
      }),
      transformResponse: (response) => response,
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
