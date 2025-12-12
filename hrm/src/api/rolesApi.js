import { baseApi } from "./baseApi";
export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => "/roles/",
      providesTags: ["Roles"],
    }),
    getRole: builder.query({
      query: (roleId) => `/roles/${roleId}`,
      providesTags: ["Roles"],
    }),
    createRole: builder.mutation({
      query: (newRole) => ({
        url: "/roles/",
        method: "POST",
        body: newRole,
      }),
      invalidatesTags: ["Roles"],
    }),
    updateRolePermissions: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `/roles/${roleId}`,
        method: "PUT",
        body: permissions,
      }),
      invalidatesTags: ["Roles"],
    }),
    deleteRole: builder.mutation({
      query: (roleId) => ({
        url: `/roles/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles"],
    }),
    assignPermissionsToRole: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `/roles/${roleId}/permissions`,
        method: "POST",
        body: permissions,
      }),
      invalidatesTags: ["Roles"],
    }),
    getRolePermissions: builder.query({
      query: (roleId) => `/roles/${roleId}`,
      invalidatesTags: ["Roles"],
    }),
    getRecentRoleToGive: builder.query({
      query: "/roles/recent",
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRolePermissionsMutation,
  useDeleteRoleMutation,
  useAssignPermissionsToRoleMutation,
  useGetRoleQuery,
  useGetRolePermissionsQuery,
  useGetRecentRoleToGiveQuery,
} = rolesApi;
