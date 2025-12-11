import { baseApi } from "./baseApi";

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPermissions: builder.query({
      query: () => "/permission/",
      providesTags: ["Permissions"], // Tag to allow invalidation
    }),
    getPermission: builder.query({
      query: (permissionId) => `/${permissionId}`,
      providesTags: ["Permissions"], // Tag for specific permission data
    }),
    createPermission: builder.mutation({
      query: (newPermission) => ({
        url: "/permission/",
        method: "POST",
        body: newPermission,
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    updatePermission: builder.mutation({
      query: ({ permissionId, ...updatedData }) => ({
        url: `/permission/${permissionId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    deletePermission: builder.mutation({
      query: (permissionId) => ({
        url: `/permission/${permissionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    assignPermissionsToRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: "/permission/assign-permission",
        method: "POST",
        body: { roleId, permissionId },
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    removePermissionFromRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: "/permission/remove-permission",
        method: "POST",
        body: { roleId, permissionId },
      }),
      invalidatesTags: ["Permissions"], // Invalidate to refetch permissions
    }),
    getMyPermissions: builder.query({
      query: () => "/permission/my", // no arg needed anymore
      providesTags: ["Permissions"],
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
