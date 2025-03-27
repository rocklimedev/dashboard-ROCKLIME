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
  providesTags: ["users"],
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => "/me",
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "PUT",
        body: data,
      }),
    }),
    getAllUsers: builder.query({
      query: () => "/",
    }),
    searchUser: builder.query({
      query: (query) => `/search?query=${query}`,
    }),
    getUserById: builder.query({
      query: (userId) => `/${userId}`,
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/${userId}`,
        method: "DELETE",
      }),
    }),
    reportUser: builder.mutation({
      query: (userId) => ({
        url: `/report/${userId}`,
        method: "POST",
      }),
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: "/add",
        method: "POST",
        body: data,
      }),
    }),
    updateUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/${userId}`,
        method: "PUT",
        body: data, // This sends the updated user details
      }),
    }),

    assignRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/assign-role/${userId}`,
        method: "PUT",
        body: { role },
      }),
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
} = userApi;
