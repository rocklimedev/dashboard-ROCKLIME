// src/hooks/useProductsData.js
import { useGetProductsByIdsQuery } from "../api/productApi";
import { useMemo } from "react";

/**
 * Efficient hook that fetches product details in bulk using RTK Query.
 * Automatically caches results and avoids N+1 requests.
 *
 * @param {Array<{ productId: string }>} rawProducts - Array of items with productId
 * @returns {{ productsData: Array, loading: boolean, errors: Array }}
 */
export default function useProductsData(rawProducts = []) {
  // Extract unique, valid product IDs
  const productIds = useMemo(() => {
    const ids = rawProducts.map((item) => item?.productId).filter(Boolean);

    return [...new Set(ids)]; // dedupe
  }, [rawProducts]);

  const {
    data: fetchedProducts = [],
    isLoading,
    isError,
    error,
  } = useGetProductsByIdsQuery(productIds, {
    skip: productIds.length === 0, // Don't call if no IDs
  });

  // Map back to original order + include quantity if needed
  const productsData = useMemo(() => {
    if (!Array.isArray(fetchedProducts)) return [];

    const productMap = fetchedProducts.reduce((map, product) => {
      map[product.productId] = product;
      return map;
    }, {});

    // Preserve original order from input array
    return rawProducts
      .map((item) => {
        const product = productMap[item.productId];
        if (!product) return null;
        return {
          ...product,
          quantity: item.quantity || 1, // useful for top products / carts
        };
      })
      .filter(Boolean);
  }, [fetchedProducts, rawProducts]);

  const errors = isError
    ? [{ error: error?.data?.message || "Failed to fetch products" }]
    : [];

  return {
    productsData,
    loading: isLoading,
    errors,
  };
}
