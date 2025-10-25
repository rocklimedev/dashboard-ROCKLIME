import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const permissionsApi = createApi({
  reducerPath: "permissionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/permission`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Permissions"], // Define tag type for permissions
  endpoints: (builder) => ({
    getAllPermissions: builder.query({
      query: () => "/",
      providesTags: ["Permissions"], // Tag to allow invalidation
    }),
    getPermission: builder.query({
      query: (permissionId) => `/${permissionId}`,
      providesTags: ["Permissions"], // Tag for specific permission data
    }),
    createPermission: builder.mutation({
      query: (newPermission) => ({
        url: "/",
        method: "POST",
        body: newPermission,
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    updatePermission: builder.mutation({
      query: ({ permissionId, ...updatedData }) => ({
        url: `/${permissionId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    deletePermission: builder.mutation({
      query: (permissionId) => ({
        url: `/${permissionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    assignPermissionsToRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: "/assign-permission",
        method: "POST",
        body: { roleId, permissionId },
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    removePermissionFromRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: "/remove-permission",
        method: "POST",
        body: { roleId, permissionId },
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
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
