import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => "/user/me",
      providesTags: ["Users"],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/user/",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    getAllUsers: builder.query({
      query: () => "/user/",
      providesTags: ["Users"],
    }),
    searchUser: builder.query({
      query: (query) => `/user/search?query=${query}`,
      providesTags: ["Users"],
    }),
    getUserById: builder.query({
      query: (userId) => `/user/${userId}`,
      providesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/user/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    reportUser: builder.mutation({
      query: (userId) => ({
        url: `/user/report/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    inactiveUser: builder.mutation({
      query: (userId) => ({
        url: `/user/${userId}`,
        method: "PUT",
        body: { status: false },
      }),
      invalidatesTags: ["Users"],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: "/user/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/user/${userId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    assignRole: builder.mutation({
      query: ({ userId, roleId }) => ({
        url: `/user/assign-role/${userId}`,
        method: "PUT",
        body: { roleId },
      }),
      invalidatesTags: ["Users"],
    }),
    uploadPhoto: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("photo", file); // ← Must be "photo", not "file"
        return {
          url: "/user/photo",
          method: "POST",
          body: formData,
          // DO NOT set Content-Type — let browser set multipart boundary
          // headers: { "Content-Type": "multipart/form-data" } ← BAD
        };
      },
      invalidatesTags: ["Users"],
    }),
    // NEW: Update User Status (active, inactive, restricted)
    updateStatus: builder.mutation({
      query: ({ userId, status }) => ({
        url: `/user/${userId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

// Export all hooks including the new one
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
  useUploadPhotoMutation, // <-- NEW HOOK
  useUpdateUserMutation,
  useInactiveUserMutation,
  useUpdateStatusMutation,
} = userApi;
