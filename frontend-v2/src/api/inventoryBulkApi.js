import { baseApi } from '../store/baseApi';

export const inventoryBulkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    previewProductDeletion: builder.mutation({
      query: (productIds) => ({
        url: '/products/inventory-bulk/delete-preview',
        method: 'POST',
        body: { productIds },
      }),
    }),
    previewProductMerge: builder.mutation({
      query: (body) => ({ url: '/products/inventory-bulk/merge-preview', method: 'POST', body }),
    }),
    mergeInventoryProducts: builder.mutation({
      query: (body) => ({ url: '/products/inventory-bulk/merge', method: 'POST', body }),
      invalidatesTags: [
        'Product',
        'ProductInventory',
        'ProductMeta',
        'Search',
        'Orders',
        'OrderCreditNotes',
        'Quotations',
        'PurchaseOrders',
      ],
    }),
    updateSelectedInventory: builder.mutation({
      query: (body) => ({ url: '/products/inventory-bulk/update', method: 'POST', body }),
      invalidatesTags: ['Product', 'ProductInventory', 'ProductMeta', 'Search'],
    }),
    deleteSelectedInventory: builder.mutation({
      query: (productIds) => ({
        url: '/products/inventory-bulk/delete',
        method: 'POST',
        body: { productIds },
      }),
      invalidatesTags: ['Product', 'ProductInventory', 'Search'],
    }),
    exportSelectedInventory: builder.mutation({
      query: (body) => ({ url: '/products/inventory-bulk/export', method: 'POST', body }),
    }),
  }),
});
export const {
  usePreviewProductDeletionMutation,
  useUpdateSelectedInventoryMutation,
  useDeleteSelectedInventoryMutation,
  useExportSelectedInventoryMutation,
  usePreviewProductMergeMutation,
  useMergeInventoryProductsMutation,
} = inventoryBulkApi;
