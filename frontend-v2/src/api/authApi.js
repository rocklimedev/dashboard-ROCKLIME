import { baseApi } from "./baseApi";
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth", "Users"],
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
        headers: {
          "Content-Type": "application/json",
          Authorization: undefined,
        },
      }),
      invalidatesTags: (result, error) => (result ? ["Auth", "Users"] : []),
    }),
    // api/userApi.js  (or authApi.js)

    deactivateAccount: builder.mutation({
      query: () => ({
        url: "/auth/deactivate-account", // or "/users/deactivate" depending on your route
        method: "POST",
      }),
      invalidatesTags: ["Auth", "Users", "Profile"], // force profile refetch
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        body: {},
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          dispatch(authApi.util.resetApiState()); // Reset API state
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },
      invalidatesTags: ["Auth", "Users"],
    }),
    forgotPassword: builder.mutation({
      query: (payload) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: payload,
      }),
    }),
    verifyAccount: builder.mutation({
      query: ({ token }) => ({
        url: "/auth/verify-account",
        method: "POST",
        body: { token },
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),
    refreshToken: builder.mutation({
      query: (token) => ({
        url: "/auth/refresh-token",
        method: "POST",
        body: { token },
      }),
    }),
    verifyEmail: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-email",
        method: "POST",
        body: data,
      }),
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/auth/change-password",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "Users"],
    }),
    validateResetToken: builder.query({
      query: (token) => ({
        url: `/auth/validate-reset-token/${token}`,
        method: "GET",
      }),
    }),
    resendVerificationEmail: builder.mutation({
      query: (email) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body: email,
      }),
    }),
    getMyPermissions: builder.query({
      query: () => ({
        url: "/auth/me/permissions",
        method: "GET",
      }),
      providesTags: ["Permissions", "Auth"],
    }),
    validateToken: builder.query({
      query: () => ({
        url: "/auth/validate-token",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useValidateResetTokenQuery,
  useResendVerificationEmailMutation,
  useRegisterMutation,
  useLoginMutation,
  useValidateTokenQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useDeactivateAccountMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
  useVerifyEmailMutation,
  useChangePasswordMutation,
  useVerifyAccountMutation,
  useGetMyPermissionsQuery,
} = authApi;
