import { apiSlice } from "./apiSlice";

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query({
      query: () => "general/dashboard",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
