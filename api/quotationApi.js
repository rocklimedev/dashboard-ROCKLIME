import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const quotationApi = createApi({
  reducerPath: "quotationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/quotation/`,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Quotations"],
  endpoints: (builder) => ({
    getAllQuotations: builder.query({
      query: () => "/",
      providesTags: ["Quotations"],
    }),
    getQuotationById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Quotations", id }],
    }),
    createQuotation: builder.mutation({
      query: (newQuotation) => ({
        url: "/add",
        method: "POST",
        body: newQuotation,
      }),
      invalidatesTags: ["Quotations"],
    }),
    updateQuotation: builder.mutation({
      query: ({ id, updatedQuotation }) => {
        return {
          url: `/${id}`,
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
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quotations"],
    }),
    exportQuotation: builder.mutation({
      query: (id) => ({
        url: `/export/${id}`,
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
      query: (id) => `/${id}/versions`,
      providesTags: ["Quotation"],
    }),
    restoreQuotationVersion: builder.mutation({
      query: ({ id, version }) => ({
        url: `/${id}/restore/${version}`,
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
