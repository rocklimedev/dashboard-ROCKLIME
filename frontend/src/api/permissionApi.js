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
  }),
});

export const {
  useGetAllPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = permissionsApi;
