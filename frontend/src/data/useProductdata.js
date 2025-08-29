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
    () => products.map((product) => product.productId).filter(Boolean),
    [products]
  );

  useEffect(() => {
    // Function to fetch product data
    const fetchProducts = async () => {
      setLoading(true);
      setErrors([]); // Reset errors
      const results = await Promise.all(
        productIds.map(async (productId, index) => {
          if (!productId) return null;
          try {
            const response = await fetch(`${API_URL}/products/${productId}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch product ${productId}`);
            }
            const data = await response.json();
            return { productId: products[index].productId, ...data };
          } catch (error) {
            setErrors((prev) => [...prev, { productId, error: error.message }]);
            return null;
          }
        })
      );

      // Filter out null results and set productsData
      const validProducts = results.filter(Boolean);
      setProductsData(validProducts);
      setLoading(false);
    };

    if (productIds.length > 0) {
      fetchProducts();
    } else {
      setProductsData([]);
      setLoading(false);
    }
  }, [productIds, products]);

  return { productsData, errors, loading };
}
