import { baseApi } from "./baseApi";

export const cachedPermissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all cached permissions
    getAllCachedPermissions: builder.query({
      query: () => ({
        url: "/cached-permission",
        method: "GET",
      }),
      providesTags: ["RolePermission"],
    }),

    // Fetch cached permissions for a specific role
    getCachedPermissionByRole: builder.query({
      query: (roleId) => ({
        url: `/cached-permission/${roleId}`,
        method: "GET",
      }),
      providesTags: ["RolePermission"],
    }),
  }),
});

export const {
  useGetAllCachedPermissionsQuery,
  useGetCachedPermissionByRoleQuery,
} = cachedPermissionApi;
