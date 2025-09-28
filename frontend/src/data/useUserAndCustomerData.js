import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

/**
 * Custom hook that fetches user and customer details for arrays of userIds and customerIds using direct API calls.
 * Each ID must be a valid string or number.
 * @param {Array<string|number>} userIds - Array of user IDs
 * @param {Array<string|number>} customerIds - Array of customer IDs
 * @returns {Object} - Object containing userMap, customerMap, userQueries, customerQueries, and loading/error states
 */
export default function useUserAndCustomerData(userIds = [], customerIds = []) {
  const [userData, setUserData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [userErrors, setUserErrors] = useState([]);
  const [customerErrors, setCustomerErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create stable arrays of user and customer IDs
  const safeUserIds = useMemo(
    () => (Array.isArray(userIds) ? userIds.filter(Boolean) : []),
    [userIds]
  );
  const safeCustomerIds = useMemo(
    () => (Array.isArray(customerIds) ? customerIds.filter(Boolean) : []),
    [customerIds]
  );

  useEffect(() => {
    // Avoid fetching if no IDs
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

      // Fetch user data
      const userResults = await Promise.all(
        safeUserIds.map(async (id) => {
          if (!id) return null;
          try {
            const token =
              localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await fetch(`${API_URL}/user/${id}`, {
              headers: {
                Authorization: token ? `Bearer ${token}` : undefined,
              },
              credentials: "include",
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch user ${id}`);
            }
            const data = await response.json();
            return { userId: id, user: data };
          } catch (error) {
            userTempErrors.push({ userId: id, error: error.message });
            return null;
          }
        })
      );

      // Fetch customer data
      const customerResults = await Promise.all(
        safeCustomerIds.map(async (id) => {
          if (!id) return null;
          try {
            const token =
              localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await fetch(`${API_URL}/customers/${id}`, {
              headers: {
                Authorization: token ? `Bearer ${token}` : undefined,
              },
              credentials: "include",
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch customer ${id}`);
            }
            const data = await response.json();
            return { customerId: id, customer: data };
          } catch (error) {
            customerTempErrors.push({ customerId: id, error: error.message });
            return null;
          }
        })
      );

      setUserData(userResults.filter(Boolean));
      setCustomerData(customerResults.filter(Boolean));
      setUserErrors(userTempErrors);
      setCustomerErrors(customerTempErrors);
      setLoading(false);
    };

    fetchData();
  }, [safeUserIds, safeCustomerIds]);

  // Map user data to { [userId]: name }
  const userMap = useMemo(() => {
    const map = {};
    safeUserIds.forEach((id, index) => {
      if (userData[index]?.user && id) {
        map[id] = userData[index].user.name;
      }
    });
    return map;
  }, [userData, safeUserIds]);

  // Map customer data to { [customerId]: name }
  const customerMap = useMemo(() => {
    const map = {};
    safeCustomerIds.forEach((id, index) => {
      if (customerData[index]?.customer && id) {
        map[id] = customerData[index].customer.name;
      }
    });
    return map;
  }, [customerData, safeCustomerIds]);

  // Create query-like objects for compatibility with NewCart
  const userQueries = useMemo(
    () =>
      safeUserIds.map((id, index) => ({
        data: userData[index] || null,
        isLoading: loading,
        error: userErrors.find((err) => err.userId === id) || null,
      })),
    [userData, userErrors, loading, safeUserIds]
  );

  const customerQueries = useMemo(
    () =>
      safeCustomerIds.map((id, index) => ({
        data: customerData[index] || null,
        isLoading: loading,
        error: customerErrors.find((err) => err.customerId === id) || null,
      })),
    [customerData, customerErrors, loading, safeCustomerIds]
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
