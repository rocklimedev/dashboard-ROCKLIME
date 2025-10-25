import { baseApi } from "./baseApi";

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST: submit contact form
    submitContactForm: builder.mutation({
      query: (data) => ({
        url: "/contact/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Contact"],
    }),

    // GET: fetch all queries
    getAllQueries: builder.query({
      query: () => "/contact/",
      providesTags: ["Contact"],
    }),

    // GET: fetch single query by ID
    getQueryById: builder.query({
      query: (id) => `/contact/${id}`,
      providesTags: ["Contact"],
    }),

    // DELETE: delete query by ID
    deleteQuery: builder.mutation({
      query: (id) => ({
        url: `/contact/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contact"],
    }),

    // POST: reply to a contact query by ID
    replyToEmail: builder.mutation({
      query: ({ id, replyData }) => ({
        url: `/contact/reply/${id}`,
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
