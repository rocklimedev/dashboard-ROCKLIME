import { baseApi } from "./baseApi";

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCustomer: builder.mutation({
      query: (customerData) => ({
        url: "/customers/",
        method: "POST",
        body: customerData,
      }),
      invalidatesTags: ["Customers"], // Invalidate to refetch customers
    }),
    getCustomers: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();

        // Always include pagination
        params.append("page", filters.page ?? 1);
        params.append("limit", filters.limit ?? 20);

        // Search (only if provided)
        if (filters.search?.trim()) {
          params.append("search", filters.search.trim());
        }

        // Add more filters here later if needed (e.g. customerType)
        // if (filters.customerType && filters.customerType !== "All") {
        //   params.append("customerType", filters.customerType);
        // }

        const queryString = params.toString();
        return queryString ? `/customers/?${queryString}` : "/customers/";
      },
      providesTags: ["Customers"],
    }),
    getCustomerById: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: ["Customers"], // Tag for specific customer data
    }),
    getInvoicesByCustomerId: builder.query({
      query: (id) => `/customers/${id}/invoices`,
      providesTags: ["Customers"], // Tag for customer-related invoices
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Customers"], // Invalidate to refetch customers
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers"], // Invalidate to refetch customers
    }),
  }),
});

export const {
  useCreateCustomerMutation,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetInvoicesByCustomerIdQuery,
} = customerApi;
