// src/api/messageApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const messageApi = createApi({
  reducerPath: "messageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://your-api-url/api", // Replace with your API base URL
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token; // Assuming auth token is stored in Redux or context
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Conversations", "Messages"],
  endpoints: (builder) => ({
    // Fetch recent conversations
    getRecentConversations: builder.query({
      query: () => "/conversations",
      transformResponse: (response) => response.data, // Adjust based on API response structure
      providesTags: ["Conversations"],
    }),
    // Fetch messages for a specific conversation
    getConversation: builder.query({
      query: (receiverId) => `/messages/${receiverId}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, receiverId) => [
        { type: "Messages", id: receiverId },
      ],
    }),
    // Send a message
    sendMessage: builder.mutation({
      query: ({ receiverId, content }) => ({
        url: `/messages/${receiverId}`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { receiverId }) => [
        "Conversations",
        { type: "Messages", id: receiverId },
      ],
    }),
    // Mark messages as read (optional, if not handled solely by WebSocket)
    markMessagesAsRead: builder.mutation({
      query: ({ receiverId, messageIds }) => ({
        url: `/messages/${receiverId}/read`,
        method: "PATCH",
        body: { messageIds },
      }),
      invalidatesTags: (result, error, { receiverId }) => [
        { type: "Messages", id: receiverId },
      ],
    }),
  }),
});

export const {
  useGetRecentConversationsQuery,
  useGetConversationQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
} = messageApi;
