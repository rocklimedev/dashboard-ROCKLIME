import { baseApi } from "../store/baseApi";
export const zohoApi = baseApi.injectEndpoints({ endpoints: builder => ({
  getZohoStatus: builder.query({ query: () => "/zoho/status", providesTags: ["Zoho"] }),
  zohoAuthorize: builder.mutation({ query: accountsUrl => ({ url: `/zoho/authorize?${new URLSearchParams({ accountsUrl })}`, method: "GET" }) }),
  zohoDisconnect: builder.mutation({ query: () => ({ url: "/zoho/connection", method: "DELETE" }), invalidatesTags: ["Zoho", "Cliq", "Crm"] }),
}) });
export const { useGetZohoStatusQuery, useZohoAuthorizeMutation, useZohoDisconnectMutation } = zohoApi;
