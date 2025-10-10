import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const logApi = createApi({
  reducerPath: "logApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
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
          method,
          route,
          user,
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
  }),
});

export const { useGetLogsQuery } = logApi;
