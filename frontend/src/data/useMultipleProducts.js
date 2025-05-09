import { useEffect, useState } from "react";
import { API_URL } from "./config";
import { toast } from "react-toastify";
export const useMultipleProducts = (products = []) => {
  const [productDetailsMap, setProductDetailsMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setIsLoading(true);

        const responses = await Promise.all(
          products.map(async (p) => {
            if (!p.productId) return null;
            const res = await fetch(`${API_URL}/products/${p.productId}`);
            const data = await res.json();
            return { productId: p.productId, data: data?.data };
          })
        );

        const detailsMap = new Map();
        responses.forEach((res) => {
          if (res?.data) {
            detailsMap.set(res.productId, res.data);
          }
        });

        setProductDetailsMap(detailsMap);
      } catch (error) {
        toast.error("Error fetching products:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProducts();
  }, [products]);

  return { productDetailsMap, isLoading, isError };
};
