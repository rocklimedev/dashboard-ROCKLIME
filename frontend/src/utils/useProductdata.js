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
// src/utils/useProductdata.js
export default function useProductsData(rawProducts = []) {
  const productIds = useMemo(() => {
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) return [];
    const ids = rawProducts
      .map((item) => item?.productId || item?.id)
      .filter(Boolean);
    return [...new Set(ids)];
  }, [rawProducts]);

  const {
    data: rawResponse,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetProductsByIdsQuery(productIds, {
    skip: productIds.length === 0,
    refetchOnMountOrArgChange: true,
  });

  // Unwrap { data: [...], pagination: {...} } → plain array
  const fetchedProducts = useMemo(() => {
    if (Array.isArray(rawResponse)) return rawResponse;
    return rawResponse?.data || [];
  }, [rawResponse]);

  useEffect(() => {
    if (isError) {
      console.error("useProductsData: Failed to fetch products", {
        productIds,
        error: error?.data || error,
      });
    } else if (
      productIds.length > 0 &&
      fetchedProducts.length === 0 &&
      !isLoading &&
      !isFetching
    ) {
      console.warn(
        "useProductsData: No products returned for valid IDs",
        productIds,
      );
    }
  }, [
    isError,
    error,
    productIds,
    fetchedProducts.length,
    isLoading,
    isFetching,
  ]);

  const productsData = useMemo(() => {
    if (!Array.isArray(fetchedProducts) || fetchedProducts.length === 0) {
      return [];
    }

    const productMap = new Map(fetchedProducts.map((p) => [p.productId, p]));

    return rawProducts
      .map((item) => {
        const key = item?.productId || item?.id;
        const product = productMap.get(key);
        if (!product) return null;

        return {
          ...product,
          quantity: Number(item.quantity) || 1,
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
