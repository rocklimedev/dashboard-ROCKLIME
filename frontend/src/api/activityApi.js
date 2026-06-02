import { baseApi } from "../store/baseApi";
export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllActivities: builder.query({
      query: ({ page = 1, limit = 20 }) =>
        `/activity?page=${page}&limit=${limit}`,
      providesTags: ["Activity"],
    }),

    getActivityById: builder.query({
      query: (id) => `/activity/${id}`,
      providesTags: ["Activity"],
    }),

    getActivityByUser: builder.query({
      query: (userId) => `/activity/user/${userId}`,
      providesTags: ["Activity"],
    }),

    deleteActivity: builder.mutation({
      query: (id) => ({
        url: `/activity/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Activity"],
    }),
  }),
});

export const {
  useGetAllActivitiesQuery,
  useGetActivityByIdQuery,
  useGetActivityByUserQuery,
  useDeleteActivityMutation,
} = activityApi;
