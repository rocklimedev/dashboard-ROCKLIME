import { baseApi } from "./baseApi";
export const rolePermissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    assignPermissionToRole: builder.mutation({
      query: (data) => ({
        url: "/role-permissions/assign-permission",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["RolePermission"],
    }),
    removePermissionFromRole: builder.mutation({
      query: (data) => ({
        url: "/role-permissions/remove-permission",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["RolePermission"],
    }),
    getAllRolePermissions: builder.query({
      query: () => "/role-permissions/",
      providesTags: ["RolePermission"],
    }),
    getAllRolePermissionsByRoleId: builder.query({
      query: (roleId) => `/role-permissions/${roleId}/permissions`,
      providesTags: ["RolePermission"],
    }),
    getRolePermissionByRoleIdAndPermissionId: builder.query({
      query: ({ roleId, permissionId }) =>
        `/role-permissions/${roleId}/permission/${permissionId}`,
      providesTags: ["RolePermission"],
    }),
  }),
});

export const {
  useAssignPermissionToRoleMutation,
  useRemovePermissionFromRoleMutation,
  useGetAllRolePermissionsQuery,
  useGetAllRolePermissionsByRoleIdQuery,
  useGetRolePermissionByRoleIdAndPermissionIdQuery,
} = rolePermissionsApi;
