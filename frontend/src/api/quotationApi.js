import { baseApi } from "./baseApi";

export const quotationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllQuotations: builder.query({
      query: () => "/quotation/",
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
      query: ({ id, updatedQuotation }) => {
        return {
          url: `/quotation/${id}`,
          method: "PUT",
          body: updatedQuotation,
          headers: {
            Accept: "application/json",
          },
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Quotations", id }],
    }),
    deleteQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotation/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quotations"],
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
    // New endpoints for versioning
    getQuotationVersions: builder.query({
      query: (id) => `/quotation/${id}/versions`,
      providesTags: ["Quotation"],
    }),
    restoreQuotationVersion: builder.mutation({
      query: ({ id, version }) => ({
        url: `/quotation/${id}/restore/${version}`,
        method: "POST",
      }),
      invalidatesTags: ["Quotation"],
    }),
  }),
});

export const {
  useGetAllQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useExportQuotationMutation,
  useGetQuotationVersionsQuery,
  useRestoreQuotationVersionMutation,
} = quotationApi;
