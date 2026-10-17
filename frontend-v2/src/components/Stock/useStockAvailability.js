import { useMemo } from "react";
import { useGetStockAvailabilityQuery } from "../../api/stockApi";
import useCan from "../../utils/useCan";

/**
 * Live stock for a set of products: { [productId]: { available, reserved, incoming, lowAt, nextIncoming } }.
 * One request per distinct set of ids; refreshes when the set changes.
 */
export default function useStockAvailability(productIds = []) {
  const can = useCan();
  // a stable key so a new array with the same ids does not refetch
  const key = [...new Set((productIds || []).filter(Boolean))].sort().join(",");
  const ids = useMemo(() => (key ? key.split(",") : []), [key]);
  const { data, isFetching, refetch } = useGetStockAvailabilityQuery(ids, {
    skip: !ids.length || !can("inventory", "view"),
    refetchOnMountOrArgChange: 30,
  });
  return { stock: data?.data || {}, loading: isFetching, refetch };
}
