import { baseApi } from "./baseApi";
export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => "/notifications/",
      transformResponse: (response) => response.notifications,
      providesTags: ["Notifications"],
    }),
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),
    sendNotification: builder.mutation({
      query: ({ userId, title, message }) => ({
        url: "/notifications/",
        method: "POST",
        body: { userId, title, message },
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useSendNotificationMutation,
} = notificationApi;
