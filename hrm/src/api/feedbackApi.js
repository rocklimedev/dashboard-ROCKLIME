import { baseApi } from "./baseApi";

export const feedbackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/feedback
    submitFeedback: builder.mutation({
      query: (data) => ({
        url: "/feedback",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Feedback"],
    }),

    // GET /api/feedback
    getAllFeedback: builder.query({
      query: () => "/feedback",
      providesTags: ["Feedback"],
    }),

    // GET /api/feedback/:id
    getFeedbackById: builder.query({
      query: (id) => `/feedback/${id}`,
      providesTags: (result, error, id) => [{ type: "Feedback", id }],
    }),

    // PUT /api/feedback/:id
    updateFeedbackStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/feedback/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Feedback", id },
        "Feedback",
      ],
    }),

    // DELETE /api/feedback/:id
    deleteFeedback: builder.mutation({
      query: (id) => ({
        url: `/feedback/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Feedback", id },
        "Feedback",
      ],
    }),
  }),
});

export const {
  useSubmitFeedbackMutation,
  useGetAllFeedbackQuery,
  useGetFeedbackByIdQuery,
  useUpdateFeedbackStatusMutation,
  useDeleteFeedbackMutation,
} = feedbackApi;
