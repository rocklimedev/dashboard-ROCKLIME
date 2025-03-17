import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api/companies" }),
  endpoints: (builder) => ({
    createCompany: builder.mutation({
      query: (newCompany) => ({
        url: "/",
        method: "POST",
        body: newCompany,
      }),
    }),
    getAllCompanies: builder.query({
      query: () => "/",
    }),
    getCompanyById: builder.query({
      query: (id) => `/${id}`,
    }),
    getChildCompanies: builder.query({
      query: (parentId) => `/parent/${parentId}`,
    }),
    updateCompany: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updatedData,
      }),
    }),
    deleteCompany: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
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
