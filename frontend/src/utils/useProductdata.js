// src/hooks/useProductsData.js
import { useGetProductsByIdsQuery } from "../api/productApi";
import { useMemo, useEffect } from "react";

/**
 * Optimized hook to fetch product details for cart items in bulk.
 * Uses stable product ID list + memoization to minimize re-renders and refetches.
 *
 * @param {Array} rawProducts - Array of cart items (each should have `productId`)
 * @returns {{ productsData: Array, loading: boolean, errors: Array }}
 */
export default function useProductsData(rawProducts = []) {
  // Step 1: Extract unique productIds — only when rawProducts actually changes
  const productIds = useMemo(() => {
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) return [];

    const ids = rawProducts
      .map((item) => item?.productId || item?.id)
      .filter(Boolean);

    return [...new Set(ids)]; // deduplicate
  }, [rawProducts]);

  // Step 2: Fetch products only when productIds array is stable and non-empty
  const {
    data: fetchedProducts = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetProductsByIdsQuery(productIds, {
    skip: productIds.length === 0,
    // Important: Only refetch if the ID list actually changes
    refetchOnMountOrArgChange: true,
  });

  // Optional: Log errors/warnings once
  useEffect(() => {
    if (isError) {
      console.error("useProductsData: Failed to fetch products", {
        productIds,
        error: error?.data || error,
      });
    } else if (
      productIds.length > 0 &&
      fetchedProducts.length === 0 &&
      !isLoading
    ) {
      console.warn(
        "useProductsData: No products returned for valid IDs",
        productIds,
      );
    }
  }, [isError, error, productIds, fetchedProducts.length, isLoading]);

  // Step 3: Map fetched products back to original cart items (preserving order + quantity)
  const productsData = useMemo(() => {
    if (!Array.isArray(fetchedProducts) || fetchedProducts.length === 0) {
      return [];
    }

    const productMap = new Map(fetchedProducts.map((p) => [p.productId, p]));

    return rawProducts
      .map((item) => {
        const product = productMap.get(item?.productId || item?.id);
        if (!product) return null;

        return {
          ...product,
          quantity: Number(item.quantity) || 1,
          // You can add more cart-specific fields here if needed
          // e.g. floorId, assignedQuantity, etc.
        };
      })
      .filter(Boolean);
  }, [fetchedProducts, rawProducts]);

  const errors = isError
    ? [{ message: error?.data?.message || "Failed to fetch product details" }]
    : [];

  return {
    productsData,
    loading: isLoading || isFetching,
    errors,
  };
}
