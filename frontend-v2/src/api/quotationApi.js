import { baseApi } from "../store/baseApi";

export const quotationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllQuotations: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();

        // Pagination
        params.append("page", filters.page ?? 1);
        params.append("limit", filters.limit ?? 20);

        // Search
        if (filters.search?.trim()) {
          params.append("search", filters.search.trim());
        }

        // Customer filter
        if (filters.customerId) {
          params.append("customerId", filters.customerId);
        }

        // Status filter
        if (filters.status) {
          params.append("status", filters.status);
        }

        // Date range
        if (
          filters.dateRange &&
          Array.isArray(filters.dateRange) &&
          filters.dateRange.length === 2
        ) {
          params.append("startDate", filters.dateRange[0]);
          params.append("endDate", filters.dateRange[1]);
        }

        const queryString = params.toString();
        return queryString ? `/quotation/?${queryString}` : "/quotation/";
      },
      providesTags: ["Quotations"],
    }),

    getQuotationById: builder.query({
      query: (id) => `/quotation/${id}`,
      providesTags: (result, error, id) => [{ type: "Quotations", id }],
    }),

    createQuotation: builder.mutation({
      query: (newQuotation) => ({
        url: "/quotation/add",
        method: "POST",
        body: newQuotation,
      }),
      invalidatesTags: ["Quotations"],
    }),

    updateQuotation: builder.mutation({
      query: ({ id, updatedQuotation }) => ({
        url: `/quotation/${id}`,
        method: "PUT",
        body: updatedQuotation,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Quotations", id },
        "Quotations",
      ],
    }),

    deleteQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotation/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quotations"],
    }),

    // ✅ NEW: Clone Quotation
    cloneQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotation/${id}/clone`,
        method: "POST",
      }),
      invalidatesTags: ["Quotations"], // Refresh list after cloning
    }),

    exportQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotation/export/${id}`,
        method: "POST",
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        responseHandler: async (response) => response.blob(),
      }),
    }),

    // Versioning Endpoints
    getQuotationVersions: builder.query({
      query: (id) => `/quotation/${id}/versions`,
      providesTags: (result, error, id) => [
        { type: "Quotations", id },
        "Quotations",
      ],
    }),

    restoreQuotationVersion: builder.mutation({
      query: ({ id, version }) => ({
        url: `/quotation/${id}/restore/${version}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Quotations", id },
        "Quotations",
      ],
    }),
  }),
});

export const {
  useGetAllQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useCloneQuotationMutation, // ← New export
  useExportQuotationMutation,
  useGetQuotationVersionsQuery,
  useRestoreQuotationVersionMutation,
} = quotationApi;
