import { baseApi } from "../store/baseApi";

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCustomer: builder.mutation({
      query: (customerData) => ({
        url: "/customers/",
        method: "POST",
        body: customerData,
      }),
      invalidatesTags: ["Customers"], // only invalidate the LIST
    }),

    getCustomers: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        params.append("page", filters.page ?? 1);
        params.append("limit", filters.limit ?? 20);
        if (filters.search?.trim()) {
          params.append("search", filters.search.trim());
        }
        for (const k of ["type", "owes", "sort"]) if (filters[k]) params.append(k, filters[k]);
        const queryString = params.toString();
        return queryString ? `/customers/?${queryString}` : "/customers/";
      },
      providesTags: (result) =>
        result?.data
          ? [
              // Tag the LIST
              { type: "Customers", id: "LIST" },
              // Tag every individual customer in the list
              ...result.data.map(({ customerId }) => ({
                type: "Customers",
                id: customerId,
              })),
            ]
          : [{ type: "Customers", id: "LIST" }],
    }),

    getCustomerById: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: "Customers", id }], // ← specific ID tag
    }),

    getInvoicesByCustomerId: builder.query({
      query: (id) => `/customers/${id}/invoices`,
      providesTags: (result, error, id) => [
        { type: "Customers", id }, // the customer itself
        { type: "Invoices", id: `CUSTOMER-${id}` }, // optional: more granular
      ],
    }),

    updateCustomer: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Customers", id }, // invalidate this specific customer
        { type: "Customers", id: "LIST" }, // invalidate the list
      ],
    }),

    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Customers", id },
        { type: "Customers", id: "LIST" },
      ],
    }),
    // Customer 360: figures, credit, referrals, timeline
    getCustomerOverview: builder.query({
      query: (id) => `/customers/${id}/overview`,
      providesTags: (r, e, id) => [{ type: "Customers", id }, "Orders", "Quotations", "Payments", "Invoices"],
    }),
    getCustomerCredit: builder.query({
      query: ({ id, amount = 0 }) => `/customers/${id}/credit?amount=${amount}`,
      providesTags: ["Payments", "Orders"],
    }),
  }),
});

export const {
  useGetCustomerOverviewQuery,
  useGetCustomerCreditQuery,
  useCreateCustomerMutation,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetInvoicesByCustomerIdQuery,
} = customerApi;
