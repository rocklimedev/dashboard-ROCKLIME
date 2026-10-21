import { baseApi } from '../store/baseApi';
export const brandOnboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    previewBrandOnboarding: builder.mutation({
      query: (body) => ({ url: '/products/onboard-brand/preview', method: 'POST', body }),
    }),
    commitBrandOnboarding: builder.mutation({
      query: (body) => ({ url: '/products/onboard-brand/commit', method: 'POST', body }),
      invalidatesTags: [
        'Product',
        'Brands',
        'Category',
        'ParentCategory',
        'ProductMeta',
        'Keyword',
        'ProductInventory',
      ],
    }),
  }),
});
export const { usePreviewBrandOnboardingMutation, useCommitBrandOnboardingMutation } =
  brandOnboardingApi;
