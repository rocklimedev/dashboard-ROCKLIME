import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/users' }),
  providesTags: ["users"],
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/me',
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'PUT',
        body: data,
      }),
    }),
    getAllUsers: builder.query({
      query: () => '/',
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
        method: 'DELETE',
      }),
    }),
    reportUser: builder.mutation({
      query: (userId) => ({
        url: `/report/${userId}`,
        method: 'POST',
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
} = userApi;
