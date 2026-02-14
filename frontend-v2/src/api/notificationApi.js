import { baseApi } from "./baseApi";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /*** Existing ***/
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

    /*** NEW ***/
    clearAllNotifications: builder.mutation({
      query: () => ({
        url: "/notifications/clear",
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"], // triggers refetch
    }),
    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

/*** Export all hooks ***/
export const {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useSendNotificationMutation,
  useClearAllNotificationsMutation, // NEW
  useDeleteNotificationMutation, // NEW
} = notificationApi;
