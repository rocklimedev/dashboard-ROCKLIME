import { baseApi } from "../store/baseApi";
export const cliqApi = baseApi.injectEndpoints({ endpoints: builder => ({
  getCliqStatus: builder.query({ query: () => "/zoho/cliq/status", providesTags: ["Cliq"] }),
  getCliqChats: builder.query({ query: () => "/zoho/cliq/chats", providesTags: ["Cliq"] }),
  getCliqChannels: builder.query({ query: () => "/zoho/cliq/channels", providesTags: ["Cliq"] }),
  getCliqPeople: builder.query({ query: () => "/zoho/cliq/people", providesTags: ["Cliq"] }),
  getCliqMessages: builder.query({ query: id => `/zoho/cliq/chats/${encodeURIComponent(id)}/messages`, providesTags: ["Cliq"] }),
  sendCliqMessage: builder.mutation({ query: ({ id, text }) => ({ url: `/zoho/cliq/chats/${encodeURIComponent(id)}/messages`, method: "POST", body: { text } }), invalidatesTags: ["Cliq"] }),
}) });
export const { useGetCliqStatusQuery, useGetCliqChatsQuery, useGetCliqChannelsQuery, useGetCliqPeopleQuery, useGetCliqMessagesQuery, useSendCliqMessageMutation } = cliqApi;
