import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const permissionsApi = createApi({
  reducerPath: "permissionsApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/permission` }),
  endpoints: (builder) => ({
    getAllPermissions: builder.query({
      query: () => "/",
    }),
    getPermission: builder.query({
      query: (permissionId) => `/${permissionId}`,
    }),
    createPermission: builder.mutation({
      query: (newPermission) => ({
        url: "/",
        method: "POST",
        body: newPermission,
      }),
    }),
    updatePermission: builder.mutation({
      query: ({ permissionId, updatedData }) => ({
        url: `/${permissionId}`,
        method: "PUT",
        body: updatedData,
      }),
    }),
    deletePermission: builder.mutation({
      query: (permissionId) => ({
        url: `/${permissionId}`,
        method: "DELETE",
      }),
    }),
    assignPermissionsToRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: "/assign-permission",
        method: "POST",
        body: { roleId, permissionId },
      }),
    }),
    removePermissionFromRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: "/remove-permission",
        method: "POST",
        body: { roleId, permissionId },
      }),
    }),
  }),
});

export const {
  useGetAllPermissionsQuery,
  useGetPermissionQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useAssignPermissionsToRoleMutation,
  useRemovePermissionFromRoleMutation,
} = permissionsApi;
