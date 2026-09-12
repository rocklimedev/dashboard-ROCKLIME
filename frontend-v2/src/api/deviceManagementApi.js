import { baseApi } from "../store/baseApi";

export const deviceManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // DEVICES
    // =========================================================

    // GET /devices
    // Optional params:
    // {
    //   warehouseId,
    //   function,
    //   status
    // }
    getDevices: builder.query({
      query: (params = {}) => ({
        url: "/devices",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((device) => ({
                type: "Device",
                id: device.deviceId,
              })),
              { type: "Device", id: "LIST" },
            ]
          : [{ type: "Device", id: "LIST" }],
    }),

    // GET /devices/:deviceId
    getDevice: builder.query({
      query: (deviceId) => `/devices/${deviceId}`,
      providesTags: (result, error, deviceId) => [
        { type: "Device", id: deviceId },
      ],
    }),

    // POST /devices/register
    // Response:
    // {
    //   device,
    //   secret
    // }
    registerDevice: builder.mutation({
      query: (body) => ({
        url: "/devices/register",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Device", id: "LIST" }],
    }),

    // POST /devices/:deviceId/rotate-secret
    // Response:
    // {
    //   device,
    //   secret
    // }
    rotateSecret: builder.mutation({
      query: (deviceId) => ({
        url: `/devices/${deviceId}/rotate-secret`,
        method: "POST",
      }),
      invalidatesTags: (result, error, deviceId) => [
        { type: "Device", id: deviceId },
        { type: "Device", id: "LIST" },
      ],
    }),

    // PUT /devices/:deviceId/assign
    //
    // Usage:
    // assignDevice({
    //   deviceId,
    //   warehouseId,
    //   ...otherFields
    // })
    assignDevice: builder.mutation({
      query: ({ deviceId, ...body }) => ({
        url: `/devices/${deviceId}/assign`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { deviceId }) => [
        { type: "Device", id: deviceId },
        { type: "Device", id: "LIST" },
        { type: "Warehouse", id: "LIST" },
      ],
    }),

    // PUT /devices/:deviceId/config
    //
    // Usage:
    // updateDeviceConfig({
    //   deviceId,
    //   config: {
    //     ...
    //   }
    // })
    updateDeviceConfig: builder.mutation({
      query: ({ deviceId, config }) => ({
        url: `/devices/${deviceId}/config`,
        method: "PUT",
        body: config,
      }),
      invalidatesTags: (result, error, { deviceId }) => [
        { type: "Device", id: deviceId },
      ],
    }),

    // GET /devices/:deviceId/history
    //
    // Usage:
    // getDeviceHistory({
    //   deviceId,
    //   limit,
    //   type
    // })
    getDeviceHistory: builder.query({
      query: ({ deviceId, limit, type }) => ({
        url: `/devices/${deviceId}/history`,
        params: {
          limit,
          type,
        },
      }),
      providesTags: (result, error, { deviceId }) => [
        { type: "DeviceHistory", id: deviceId },
      ],
    }),

    // =========================================================
    // WAREHOUSES
    // =========================================================

    // GET /warehouses
    getWarehouses: builder.query({
      query: () => "/warehouses",
      providesTags: (result) =>
        result
          ? [
              ...result.map((warehouse) => ({
                type: "Warehouse",
                id: warehouse.id,
              })),
              { type: "Warehouse", id: "LIST" },
            ]
          : [{ type: "Warehouse", id: "LIST" }],
    }),

    // POST /warehouses
    createWarehouse: builder.mutation({
      query: (body) => ({
        url: "/warehouses",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Warehouse", id: "LIST" }],
    }),
  }),

  // Keep this false if you want this API to be injectable
  // alongside other endpoints without overriding them.
  overrideExisting: false,
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
