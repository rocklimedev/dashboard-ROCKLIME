import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define API slice
export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api/customers" }), // Adjust base URL as needed
  endpoints: (builder) => ({
    // Create Customer
    createCustomer: builder.mutation({
      query: (customerData) => ({
        url: "/",
        method: "POST",
        body: customerData,
      }),
    }),

    // Get All Customers
    getCustomers: builder.query({
      query: () => "/",
    }),

    // Get Customer by ID
    getCustomerById: builder.query({
      query: (id) => `/${id}`,
    }),

    // Update Customer
    updateCustomer: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updatedData,
      }),
    }),

    // Delete Customer
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

// Export hooks for components
export const {
  useCreateCustomerMutation,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;
