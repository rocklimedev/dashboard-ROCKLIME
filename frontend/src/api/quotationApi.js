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
      headers.set(
        "Accept",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      return headers;
    },
  }),
  tagTypes: ["Quotations"],
  endpoints: (builder) => ({
    getAllQuotations: builder.query({
      query: () => "/",
    }),
    getQuotationById: builder.query({
      query: (id) => `/${id}`,
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
      query: ({ id, updatedQuotation }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updatedQuotation,
      }),
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
        responseHandler: async (response) => response.blob(), // Ensures response is treated as a Blob
      }),
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
} = quotationApi;
