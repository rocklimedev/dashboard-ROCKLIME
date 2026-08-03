/**
 * UUID keys used to look up specific fields inside a Product's freeform
 * `meta` JSON blob. Shared by any service that needs to read product meta.
 */
export const META_SLUGS = {
  sellingPrice: '9ba862ef-f993-4873-95ef-1fef10036aa5',
  companyCode: 'd11da9f9-3f2e-4536-8236-9671200cca4a',
  barcode: '4ded1cb3-5d31-42e8-90ec-a381a6ab1e35',
  productGroup: '81cd6d76-d7d2-4226-b48e-6704e6224c2b',
} as const;
