import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
export const rolePermissionsApi = createApi({
  reducerPath: "rolePermissionApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/role-permissions/` }), // Adjust baseUrl as needed
  tagTypes: ["RolePermission"],
  endpoints: (builder) => ({
    assignPermissionToRole: builder.mutation({
      query: (data) => ({
        url: "/assign-permission",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["RolePermission"],
    }),
    removePermissionFromRole: builder.mutation({
      query: (data) => ({
        url: "/remove-permission",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["RolePermission"],
    }),
    getAllRolePermissions: builder.query({
      query: () => "/",
      providesTags: ["RolePermission"],
    }),
    getAllRolePermissionsByRoleId: builder.query({
      query: (roleId) => `/${roleId}/permissions`,
      providesTags: ["RolePermission"],
    }),
    getRolePermissionByRoleIdAndPermissionId: builder.query({
      query: ({ roleId, permissionId }) =>
        `/${roleId}/permission/${permissionId}`,
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
