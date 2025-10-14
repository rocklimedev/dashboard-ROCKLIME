import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

/**
 * Custom hook that fetches product details for an array of products using direct API calls.
 * Each product must have a productId.
 * @param {Array<{ productId: string }>} products - Array of products with productId
 * @returns {Object} - Object containing productsData, errors, and loading state
 */
export default function useProductsData(products = []) {
  const [productsData, setProductsData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create a stable array of product IDs
  const productIds = useMemo(
    () => products.map((product) => product?.productId).filter(Boolean),
    [products]
  );

  useEffect(() => {
    if (productIds.length === 0) {
      setProductsData([]);
      setErrors([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      const tempErrors = [];
      const results = await Promise.all(
        productIds.map(async (productId) => {
          if (!productId) return null;
          try {
            const response = await fetch(`${API_URL}/products/${productId}`);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch product ${productId}: ${response.statusText}`
              );
            }
            const data = await response.json();
            return { productId, ...data };
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error);
            tempErrors.push({ productId, error: error.message });
            return null;
          }
        })
      );

      const validResults = results.filter(Boolean);
      setProductsData(validResults);
      setErrors(tempErrors);
      setLoading(false);
    };

    fetchProducts();
  }, [productIds]);
  return { productsData, errors, loading };
}
