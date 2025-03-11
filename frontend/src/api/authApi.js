import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/auth`,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Auth"],

  endpoints: (builder) => ({
    register: builder.mutation({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth"], // Always returns an array
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: (result, error) => (result ? ["Auth"] : []),
    }),
    logout: builder.mutation({
      query: () => {
        const refreshToken = localStorage.getItem("refreshToken"); // Retrieve the refresh token

        return {
          url: "/logout",
          method: "POST",
          body: { refreshToken }, // Send refresh token in request body
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
      invalidatesTags: ["Auth"], // Ensures logout invalidates cache
    }),

    forgotPassword: builder.mutation({
      query: (email) => ({
        url: "/forgot-password",
        method: "POST",
        body: { email },
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/reset-password",
        method: "POST",
        body: data,
      }),
    }),
    refreshToken: builder.mutation({
      query: (token) => ({
        url: "/refresh-token",
        method: "POST",
        body: { token },
      }),
    }),
    verifyEmail: builder.mutation({
      query: (data) => ({
        url: "/verify-email",
        method: "POST",
        body: data,
      }),
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/change-password",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"], // If password changes, user data should refresh
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
  useVerifyEmailMutation,
  useChangePasswordMutation,
} = authApi;
