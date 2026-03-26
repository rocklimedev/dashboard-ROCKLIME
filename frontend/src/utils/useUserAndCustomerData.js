import { useEffect, useMemo, useState, useRef } from "react";
import { API_URL } from "../store/config";
/**
 * Custom hook that fetches user and customer details safely.
 * Prevents memory leaks with AbortController + cleanup.
 */
export default function useUserAndCustomerData(userIds = [], customerIds = []) {
  const [userData, setUserData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [userErrors, setUserErrors] = useState([]);
  const [customerErrors, setCustomerErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep track of latest abort controller
  const abortRef = useRef(null);

  const safeUserIds = useMemo(
    () => (Array.isArray(userIds) ? userIds.filter(Boolean) : []),
    [userIds],
  );

  const safeCustomerIds = useMemo(
    () => (Array.isArray(customerIds) ? customerIds.filter(Boolean) : []),
    [customerIds],
  );

  useEffect(() => {
    // Cleanup previous request + controller
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // Create new controller for this run
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    if (safeUserIds.length === 0 && safeCustomerIds.length === 0) {
      setUserData([]);
      setCustomerData([]);
      setUserErrors([]);
      setCustomerErrors([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const userTempErrors = [];
      const customerTempErrors = [];

      // ── Users ────────────────────────────────────────────────
      const userPromises = safeUserIds.map(async (id) => {
        if (!id) return null;
        try {
          const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
          const response = await fetch(`${API_URL}/user/${id}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
            credentials: "include",
            signal, // ← important: allows cancellation
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch user ${id}: ${response.status}`);
          }

          const data = await response.json();
          return { userId: id, user: data };
        } catch (error) {
          // Ignore aborted requests — they are not real errors
          if (error.name !== "AbortError") {
            userTempErrors.push({ userId: id, error: error.message });
          }
          return null;
        }
      });

      // ── Customers ────────────────────────────────────────────
      const customerPromises = safeCustomerIds.map(async (id) => {
        if (!id) return null;
        try {
          const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
          const response = await fetch(`${API_URL}/customers/${id}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
            credentials: "include",
            signal,
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch customer ${id}: ${response.status}`,
            );
          }

          const data = await response.json();
          return { customerId: id, customer: data };
        } catch (error) {
          if (error.name !== "AbortError") {
            customerTempErrors.push({ customerId: id, error: error.message });
          }
          return null;
        }
      });

      // Wait for all requests (or until aborted)
      const [userResults, customerResults] = await Promise.all([
        Promise.all(userPromises),
        Promise.all(customerPromises),
      ]);

      // Only update state if not aborted
      if (!signal.aborted) {
        setUserData(userResults.filter(Boolean));
        setCustomerData(customerResults.filter(Boolean));
        setUserErrors(userTempErrors);
        setCustomerErrors(customerTempErrors);
        setLoading(false);
      }
    };

    fetchData().catch((err) => {
      // Top-level catch — usually only AbortError reaches here
      if (err.name !== "AbortError") {
        console.error("Unexpected fetch error:", err);
      }
    });

    // Cleanup: abort on unmount or when ids change
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [safeUserIds, safeCustomerIds]);

  // ── Derived maps (memoized) ────────────────────────────────
  const userMap = useMemo(() => {
    return userData.reduce((map, result) => {
      if (result?.user && result.userId) {
        map[result.userId] = result.user.name || "Unnamed User";
      }
      return map;
    }, {});
  }, [userData]);

  const customerMap = useMemo(() => {
    return customerData.reduce((map, result) => {
      if (result?.customer && result.customerId) {
        map[result.customerId] = result.customer.name || "Unnamed Customer";
      }
      return map;
    }, {});
  }, [customerData]);

  // Query-like structure (for compatibility)
  const userQueries = useMemo(
    () =>
      safeUserIds.map((id) => ({
        data: userData.find((r) => r?.userId === id) || null,
        isLoading: loading,
        error: userErrors.find((err) => err.userId === id) || null,
      })),
    [userData, userErrors, loading, safeUserIds],
  );

  const customerQueries = useMemo(
    () =>
      safeCustomerIds.map((id) => ({
        data: customerData.find((r) => r?.customerId === id) || null,
        isLoading: loading,
        error: customerErrors.find((err) => err.customerId === id) || null,
      })),
    [customerData, customerErrors, loading, safeCustomerIds],
  );

  return {
    userMap,
    customerMap,
    userQueries,
    customerQueries,
    errors: [...userErrors, ...customerErrors],
    loading,
  };
}
