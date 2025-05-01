import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/companies`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Companies"], // Define tag type for companies
  endpoints: (builder) => ({
    createCompany: builder.mutation({
      query: (newCompany) => ({
        url: "/",
        method: "POST",
        body: newCompany,
      }),
      invalidatesTags: ["Companies"], // Invalidate to refetch companies
    }),
    getAllCompanies: builder.query({
      query: () => "/",
      providesTags: ["Companies"], // Tag to allow invalidation
    }),
    getCompanyById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Companies"], // Tag for specific company data
    }),
    getChildCompanies: builder.query({
      query: (parentId) => `/parent/${parentId}`,
      providesTags: ["Companies"], // Tag for child companies
    }),
    updateCompany: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Companies"], // Invalidate to refetch companies
    }),
    deleteCompany: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Companies"], // Invalidate to refetch companies
    }),
  }),
});

export const {
  useCreateCompanyMutation,
  useGetAllCompaniesQuery,
  useGetCompanyByIdQuery,
  useGetChildCompaniesQuery,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companyApi;
