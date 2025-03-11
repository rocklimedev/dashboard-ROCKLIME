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
      return headers;
    },
  }), // Adjust base URL if needed
  tagTypes: ["Quotations"],
  endpoints: (builder) => ({
    getAllQuotations: builder.query({
      queryKey: "quotations",
      queryFn: async () => {
        const response = await fetch("/");
        if (!response.ok) throw new Error("Failed to fetch quotations");
        return response.json();
      },
      providesTags: ["Quotations"],
    }),
    getQuotationById: builder.query({
      queryKey: (id) => ["quotation", id],
      queryFn: async (id) => {
        const response = await fetch(`/${id}`);
        if (!response.ok) throw new Error("Quotation not found");
        return response.json();
      },
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
  }),
});

export const {
  useGetAllQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
} = quotationApi;
