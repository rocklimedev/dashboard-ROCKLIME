// src/hooks/useTopProducts.js
import { useMemo } from "react";

import useProductsData from "./useProductdata";
export default function useTopProducts({ quotations = [], orders = [] }) {
  // ----- 1. Build a raw list of {productId, quantity} -----
  const raw = useMemo(() => {
    const map = {};

    // ---- Quotations ----
    quotations.forEach((q) => {
      let prods = q.products || [];
      if (typeof prods === "string") {
        try {
          prods = JSON.parse(prods);
        } catch (_) {
          prods = [];
        }
      }
      (Array.isArray(prods) ? prods : []).forEach((p) => {
        const id = p.productId?._id || p.productId;
        if (id) map[id] = (map[id] || 0) + (Number(p.quantity) || 0);
      });
    });

    // ---- Orders ----
    orders.forEach((o) => {
      let prods = o.products || [];
      if (typeof prods === "string") {
        try {
          prods = JSON.parse(prods);
        } catch (_) {
          prods = [];
        }
      }
      (Array.isArray(prods) ? prods : []).forEach((p) => {
        const id = p.productId?._id || p.productId;
        if (id) map[id] = (map[id] || 0) + (Number(p.quantity) || 0);
      });
    });

    return Object.entries(map).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }, [quotations, orders]);

  // ----- 2. Fetch the real product objects (name, images, …) -----
  const { productsData, loading, errors } = useProductsData(raw);

  // ----- 3. Merge quantity + product details -----
  const topProducts = useMemo(() => {
    const merged = productsData.map((p) => ({
      ...p,
      quantity: raw.find((r) => r.productId === p.productId)?.quantity || 0,
    }));

    return merged.sort((a, b) => b.quantity - a.quantity).slice(0, 5); // top-5
  }, [productsData, raw]);

  return { topProducts, loading, errors };
}
