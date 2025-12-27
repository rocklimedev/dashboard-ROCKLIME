// src/hooks/useTopProducts.js
import { useMemo } from "react";
import useProductsData from "./useProductdata";

export default function useTopProducts({ quotations = [], orders = [] }) {
  // ----- 1. Build a raw list of {productId, quantity} -----
  const raw = useMemo(() => {
    const map = new Map(); // Use Map for better performance & safety

    const processItems = (itemsList) => {
      if (!itemsList) return;

      let items = itemsList;
      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch (_) {
          return;
        }
      }

      if (!Array.isArray(items)) return;

      items.forEach((item) => {
        // Support multiple possible ID structures
        const id =
          item.productId?._id ||
          item.productId?.id ||
          item.productId ||
          item._id; // fallback (rare)

        const qty = Number(item.quantity) || 0;
        if (id && qty > 0) {
          map.set(id, (map.get(id) || 0) + qty);
        }
      });
    };

    // ---- Process Quotations ----
    quotations.forEach((q) => {
      // New format: prefer `items` (MongoDB)
      if (q.items && q.items.length > 0) {
        processItems(q.items);
      }
      // Legacy fallback: `products` array or stringified
      else if (q.products) {
        processItems(q.products);
      }
    });

    // ---- Process Orders ----
    orders.forEach((o) => {
      if (o.items && o.items.length > 0) {
        processItems(o.items);
      } else if (o.products) {
        processItems(o.products);
      }
    });

    // Convert Map to array
    return Array.from(map, ([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }, [quotations, orders]);

  // ----- 2. Fetch real product details -----
  const { productsData = [], loading, errors } = useProductsData(raw);

  // ----- 3. Merge quantity with product details & sort top 5 -----
  const topProducts = useMemo(() => {
    if (!Array.isArray(productsData)) return [];

    const merged = productsData.map((product) => {
      const soldQty =
        raw.find((r) => r.productId === product.productId)?.quantity || 0;

      return {
        ...product,
        quantitySold: soldQty, // clearer name than just "quantity"
      };
    });

    return merged
      .filter((p) => p.quantitySold > 0) // optional: hide zero-sales
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);
  }, [productsData, raw]);

  return {
    topProducts,
    loading,
    errors,
    totalUniqueProducts: raw.length, // bonus: useful for dashboard stats
  };
}
