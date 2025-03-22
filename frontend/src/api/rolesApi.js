import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
export const rolesApi = createApi({
  reducerPath: "rolesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/roles`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Roles"],
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => "/",
      providesTags: ["Roles"],
    }),
    getRole: builder.query({
      query: (roleId) => `/${roleId}`,
      providesTags: ["Roles"],
    }),
    createRole: builder.mutation({
      query: (newRole) => ({
        url: "/",
        method: "POST",
        body: newRole,
      }),
      invalidatesTags: ["Roles"],
    }),
    updateRolePermissions: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `/${roleId}`,
        method: "PUT",
        body: permissions,
      }),
      invalidatesTags: ["Roles"],
    }),
    deleteRole: builder.mutation({
      query: (roleId) => ({
        url: `/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles"],
    }),
    assignPermissionsToRole: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `/${roleId}/permissions`,
        method: "POST",
        body: permissions,
      }),
      invalidatesTags: ["Roles"],
    }),
    getRolePermissions: builder.query({
      query: (roleId) => `/${roleId}`,
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
} = rolesApi;
