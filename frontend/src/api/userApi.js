import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/user`,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Users"], // Define tag type (corrected from providesTags)
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => "/me",
      providesTags: ["Users"],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    getAllUsers: builder.query({
      query: () => "/",
      providesTags: ["Users"], // Tag the query for invalidation
    }),
    searchUser: builder.query({
      query: (query) => `/search?query=${query}`,
      providesTags: ["Users"],
    }),
    getUserById: builder.query({
      query: (userId) => `/${userId}`,
      providesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"], // Invalidate to refetch users
    }),
    reportUser: builder.mutation({
      query: (userId) => ({
        url: `/report/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    inactiveUser: builder.mutation({
      query: (userId) => ({
        url: `/${userId}`,
        method: "PUT",
        body: { status: false }, // Explicitly set status to false
      }),
      invalidatesTags: ["Users"],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: "/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Users"], // Invalidate to refetch users
    }),
    updateUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/${userId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users"], // Invalidate to refetch users
    }),
    assignRole: builder.mutation({
      query: ({ userId, roleId }) => ({
        url: `/assign-role/${userId}`,
        method: "PUT",
        body: { roleId }, // Match AddUser payload
      }),
      invalidatesTags: ["Users"], // Invalidate to refetch users
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetAllUsersQuery,
  useSearchUserQuery,
  useGetUserByIdQuery,
  useDeleteUserMutation,
  useReportUserMutation,
  useCreateUserMutation,
  useAssignRoleMutation,
  useUpdateUserMutation,
  useInactiveUserMutation,
} = userApi;
