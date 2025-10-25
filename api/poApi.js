// src/api/poApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const poApi = createApi({
  reducerPath: "poApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
    prepareHeaders: (headers) => {
      // Add authentication token if available
      const token = localStorage.getItem("token"); // Adjust based on your auth setup
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["PurchaseOrders"],
  endpoints: (builder) => ({
    // Get all purchase orders with pagination, filtering, and sorting
    getPurchaseOrders: builder.query({
      query: ({
        page = 1,
        limit = 10,
        status = "",
        search = "",
        sort = "",
      }) => {
        const params = new URLSearchParams({
          page,
          limit,
        });
        if (status) params.append("status", status);
        if (search) params.append("search", search);
        if (sort) {
          let sortField = "createdAt";
          let sortOrder = "DESC";
          switch (sort) {
            case "Ascending":
              sortField = "orderNumber";
              sortOrder = "ASC";
              break;
            case "Descending":
              sortField = "orderNumber";
              sortOrder = "DESC";
              break;
            case "Order Date Ascending":
              sortField = "orderDate";
              sortOrder = "ASC";
              break;
            case "Order Date Descending":
              sortField = "orderDate";
              sortOrder = "DESC";
              break;
            default:
              sortField = "createdAt";
              sortOrder = "DESC";
          }
          params.append("sortField", sortField);
          params.append("sortOrder", sortOrder);
        }
        return {
          url: `/purchase-orders?${params.toString()}`,
          method: "GET",
        };
      },
      transformResponse: (response) => ({
        purchaseOrders: response,
        totalCount: response.length, // Adjust if backend provides totalCount
      }),
      providesTags: ["PurchaseOrders"],
    }),

    // Get a single purchase order by ID
    getPurchaseOrderById: builder.query({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (result, error, id) => [{ type: "PurchaseOrders", id }],
    }),
    updatePurchaseOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/purchase-orders/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["PurchaseOrders"],
    }),

    // Create a purchase order
    createPurchaseOrder: builder.mutation({
      query: (data) => ({
        url: "/purchase-orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PurchaseOrders"],
    }),

    // Update a purchase order
    updatePurchaseOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchase-orders/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PurchaseOrders", id },
        "PurchaseOrders",
      ],
    }),

    // Delete a purchase order
    deletePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PurchaseOrders"],
    }),

    // Confirm a purchase order
    confirmPurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}/confirm`,
        method: "PUT",
      }),
      invalidatesTags: ["PurchaseOrders"],
    }),

    // Get purchase orders by vendor
    getPurchaseOrdersByVendor: builder.query({
      query: (vendorId) => `/purchase-orders/vendor/${vendorId}`,
      providesTags: ["PurchaseOrders"],
    }),

    // Get all vendors (for vendor mapping)
    getVendors: builder.query({
      query: () => "/vendors",
      transformResponse: (response) => response,
      providesTags: ["Vendors"],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useConfirmPurchaseOrderMutation,
  useGetPurchaseOrdersByVendorQuery,
  useUpdatePurchaseOrderStatusMutation, // ✅ add this line
  useGetVendorsQuery,
} = poApi;
