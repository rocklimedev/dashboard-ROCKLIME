import { baseApi } from "./baseApi";

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCompany: builder.mutation({
      query: (newCompany) => ({
        url: "/companies/",
        method: "POST",
        body: newCompany,
      }),
      invalidatesTags: ["Companies"], // Invalidate to refetch companies
    }),
    getAllCompanies: builder.query({
      query: () => "/companies/",
      providesTags: ["Companies"], // Tag to allow invalidation
    }),
    getCompanyById: builder.query({
      query: (id) => `/companies/${id}`,
      providesTags: ["Companies"], // Tag for specific company data
    }),
    getChildCompanies: builder.query({
      query: (parentId) => `/companies/parent/${parentId}`,
      providesTags: ["Companies"], // Tag for child companies
    }),
    updateCompany: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/companies/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Companies"], // Invalidate to refetch companies
    }),
    deleteCompany: builder.mutation({
      query: (id) => ({
        url: `/companies/${id}`,
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
