import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";

export const useMultipleProducts = (products = []) => {
  const [productDetailsMap, setProductDetailsMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setIsLoading(true);
        const responses = await Promise.all(
          products.map((p) =>
            p.productId
              ? productApi.endpoints.getProductById.initiate(p.productId)
              : Promise.resolve(null)
          )
        );

        const detailsMap = new Map();
        responses.forEach((res, idx) => {
          if (res?.data?.data) {
            detailsMap.set(products[idx].productId, res.data.data);
          }
        });

        setProductDetailsMap(detailsMap);
      } catch (error) {
        console.error("Error fetching products:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProducts();
  }, [products]);

  return { productDetailsMap, isLoading, isError };
};
