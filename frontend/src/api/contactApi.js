import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const contactApi = createApi({
  reducerPath: "contactApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/contact` }), // Adjust base URL as per backend route
  tagTypes: ["Contact"],
  endpoints: (builder) => ({
    // POST: submit contact form
    submitContactForm: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Contact"],
    }),

    // GET: fetch all queries
    getAllQueries: builder.query({
      query: () => "/",
      providesTags: ["Contact"],
    }),

    // GET: fetch single query by ID
    getQueryById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Contact"],
    }),

    // DELETE: delete query by ID
    deleteQuery: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contact"],
    }),

    // POST: reply to a contact query by ID
    replyToEmail: builder.mutation({
      query: ({ id, replyData }) => ({
        url: `/reply/${id}`,
        method: "POST",
        body: replyData,
      }),
      invalidatesTags: ["Contact"],
    }),
  }),
});

export const {
  useSubmitContactFormMutation,
  useGetAllQueriesQuery,
  useGetQueryByIdQuery,
  useDeleteQueryMutation,
  useReplyToEmailMutation,
} = contactApi;
