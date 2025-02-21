import { apiSlice } from "./apiSlice";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query({
      query: () => "users",
      providesTags: ["Users"],
    }),
    getRoles: build.query({
      query: () => "roles",
      providesTags: ["Roles"],
    }),
  }),
});

export const { useGetUsersQuery, useGetRolesQuery } = userApi;
