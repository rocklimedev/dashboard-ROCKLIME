import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * If your app already has a shared base `createApi` instance (a common
 * pattern for large apps), prefer converting this into
 * `sharedApi.injectEndpoints({...})` instead of a standalone `createApi`
 * call, so you get one cache/store slice for the whole app rather than two.
 * Shown standalone here so it works immediately either way.
 */

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    // Adjust to however your app actually stores the auth token
    // (redux auth slice, cookie-based session, etc).
    const token = getState()?.auth?.token || localStorage.getItem('token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const deviceManagementApi = createApi({
  reducerPath: 'deviceManagementApi',
  baseQuery,
  tagTypes: ['Device', 'DeviceHistory', 'Warehouse'],
  endpoints: (builder) => ({
    // ---------------- Devices ----------------

    getDevices: builder.query({
      query: (params = {}) => ({
        url: '/devices',
        params, // { warehouseId, function, status }
      }),
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((d) => ({ type: 'Device', id: d.deviceId })),
              { type: 'Device', id: 'LIST' },
            ]
          : [{ type: 'Device', id: 'LIST' }],
    }),

    getDevice: builder.query({
      query: (deviceId) => `/devices/${deviceId}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, deviceId) => [{ type: 'Device', id: deviceId }],
    }),

    registerDevice: builder.mutation({
      query: (body) => ({
        url: '/devices/register',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data, // { device, secret }
      invalidatesTags: [{ type: 'Device', id: 'LIST' }],
    }),

    rotateSecret: builder.mutation({
      query: (deviceId) => ({
        url: `/devices/${deviceId}/rotate-secret`,
        method: 'POST',
      }),
      transformResponse: (response) => response.data, // { device, secret }
      invalidatesTags: (result, error, deviceId) => [{ type: 'Device', id: deviceId }],
    }),

    assignDevice: builder.mutation({
      query: ({ deviceId, ...body }) => ({
        url: `/devices/${deviceId}/assign`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { deviceId }) => [
        { type: 'Device', id: deviceId },
        { type: 'Device', id: 'LIST' },
      ],
    }),

    updateDeviceConfig: builder.mutation({
      query: ({ deviceId, config }) => ({
        url: `/devices/${deviceId}/config`,
        method: 'PUT',
        body: config,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { deviceId }) => [{ type: 'Device', id: deviceId }],
    }),

    getDeviceHistory: builder.query({
      query: ({ deviceId, limit, type }) => ({
        url: `/devices/${deviceId}/history`,
        params: { limit, type },
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, { deviceId }) => [{ type: 'DeviceHistory', id: deviceId }],
    }),

    // ---------------- Warehouses ----------------
    // NOTE: the backend module built so far only includes the Warehouse
    // Sequelize model, not a dedicated CRUD controller/route yet. These
    // endpoints assume a conventional `/api/warehouses` REST resource —
    // say the word and I'll add that controller/routes to match.

    getWarehouses: builder.query({
      query: () => '/warehouses',
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [...result.map((w) => ({ type: 'Warehouse', id: w.id })), { type: 'Warehouse', id: 'LIST' }]
          : [{ type: 'Warehouse', id: 'LIST' }],
    }),

    createWarehouse: builder.mutation({
      query: (body) => ({
        url: '/warehouses',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDevicesQuery,
  useGetDeviceQuery,
  useRegisterDeviceMutation,
  useRotateSecretMutation,
  useAssignDeviceMutation,
  useUpdateDeviceConfigMutation,
  useGetDeviceHistoryQuery,
  useGetWarehousesQuery,
  useCreateWarehouseMutation,
} = deviceManagementApi;
