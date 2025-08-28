import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const poApi = createApi({
  reducerPath: "poApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getAllPOs: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/purchase-orders?page=${page}&limit=${limit}`,
      providesTags: ["POs"],
    }),
    deletePO: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["POs"],
    }),
  }),
});

export const { useGetAllPOsQuery, useDeletePOMutation } = poApi;
