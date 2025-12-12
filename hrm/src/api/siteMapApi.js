// src/api/siteMapApi.js

import { baseApi } from "./baseApi";
export const siteMapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE
    createSiteMap: builder.mutation({
      query: (newSiteMap) => ({
        url: "/site-maps",
        method: "POST",
        body: newSiteMap,
      }),
      invalidatesTags: ["SiteMapsByCustomer"],
    }),

    // READ ALL BY CUSTOMER
    getSiteMapsByCustomer: builder.query({
      query: (customerId) => `/site-maps/?customerId=${customerId}`,
      providesTags: (result, error, customerId) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "SiteMap", id })),
              { type: "SiteMapsByCustomer", id: customerId },
            ]
          : [{ type: "SiteMapsByCustomer", id: customerId }],
    }),

    // READ ONE
    getSiteMapById: builder.query({
      query: (id) => `/site-maps/${id}`,
      providesTags: (result, error, id) => [{ type: "SiteMap", id }],
    }),

    // UPDATE
    updateSiteMap: builder.mutation({
      query: ({ id, updatedSiteMap }) => ({
        url: `/site-maps/${id}`,
        method: "PUT",
        body: updatedSiteMap,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "SiteMap", id },
        "SiteMapsByCustomer",
      ],
    }),

    // DELETE
    deleteSiteMap: builder.mutation({
      query: (id) => ({
        url: `/site-maps/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "SiteMap", id: arg },
        "SiteMapsByCustomer",
      ],
    }),

    // GENERATE QUOTATION FROM SITEMAP
    generateQuotationFromSiteMap: builder.mutation({
      query: (siteMapId) => ({
        url: `/site-maps/${siteMapId}/generate-quotation`,
        method: "POST",
      }),
      invalidatesTags: ["SiteMap"],
    }),

    // ATTACH SITEMAP TO QUOTATION
    attachSiteMapToQuotation: builder.mutation({
      query: ({ siteMapId, quotationId }) => ({
        url: "/attach",
        method: "POST",
        body: { siteMapId, quotationId },
      }),
      invalidatesTags: ["SiteMap"],
    }),

    // DETACH SITEMAP FROM QUOTATION
    detachSiteMapFromQuotation: builder.mutation({
      query: (siteMapId) => ({
        url: "/detach",
        method: "POST",
        body: { siteMapId },
      }),
      invalidatesTags: ["SiteMap"],
    }),
  }),
});

// Export hooks (auto-generated)
export const {
  useCreateSiteMapMutation,
  useGetSiteMapsByCustomerQuery,
  useGetSiteMapByIdQuery,
  useUpdateSiteMapMutation,
  useDeleteSiteMapMutation,
  useGenerateQuotationFromSiteMapMutation,
  useAttachSiteMapToQuotationMutation,
  useDetachSiteMapFromQuotationMutation,
} = siteMapApi;
