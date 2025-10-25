import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/notifications`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => "/",
      transformResponse: (response) => response.notifications,
      providesTags: ["Notifications"],
    }),
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/${notificationId}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),
    sendNotification: builder.mutation({
      query: ({ userId, title, message }) => ({
        url: "/",
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
