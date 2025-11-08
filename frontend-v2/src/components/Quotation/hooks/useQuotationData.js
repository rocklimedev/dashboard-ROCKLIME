import { useMemo } from "react";
import {
  useGetQuotationByIdQuery,
  useGetQuotationVersionsQuery,
} from "../../api/quotationApi";

// === SAFE JSON PARSING UTILITY ===
const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  if (typeof str !== "string") return fallback;

  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (err) {
    return fallback;
  }
};

export const useQuotationData = (id, activeVersion) => {
  const {
    data: quotation,
    isLoading: qLoading,
    error: qError,
  } = useGetQuotationByIdQuery(id);

  const {
    data: versionsData,
    isLoading: vLoading,
    error: vError,
  } = useGetQuotationVersionsQuery(id);

  // ── Combine current + historic versions with safe parsing ──
  const versions = useMemo(() => {
    const list = Array.isArray(versionsData) ? [...versionsData] : [];

    if (quotation) {
      const currentProducts = safeJsonParse(quotation.products, []);

      list.unshift({
        version: "current",
        quotationId: quotation.quotationId,
        quotationData: quotation,
        quotationItems: currentProducts, // ← Always an array
        updatedBy: quotation.createdBy,
        updatedAt: quotation.updatedAt || new Date(),
      });
    }

    return list.sort((a, b) =>
      a.version === "current" ? -1 : b.version - a.version
    );
  }, [quotation, versionsData]);

  // ── Active version with safe product parsing ──
  const active = useMemo(() => {
    const v = versions.find((x) => x.version === activeVersion) || {};

    // Safely parse products from version or fallback to current
    const rawProducts = v.quotationItems ?? quotation?.products;
    const parsedProducts = safeJsonParse(rawProducts, []);

    return {
      quotation: v.quotationData || quotation || {},
      products: parsedProducts, // ← GUARANTEED ARRAY
      updatedBy: v.updatedBy || quotation?.createdBy,
      updatedAt: v.updatedAt || quotation?.updatedAt || new Date(),
    };
  }, [activeVersion, versions, quotation]);

  return {
    quotation: quotation || {},
    versions,
    active,
    isLoading: qLoading || vLoading,
    error: qError || vError,
  };
};
