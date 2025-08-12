import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FaChartBar, FaFileInvoice, FaBox } from "react-icons/fa6";
import {
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Alert from "./Alert";
import Avatar from "react-avatar";
import "./pagewrapper.css";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceQuery,
} from "../../api/attendanceApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { FaRupeeSign } from "react-icons/fa";

const PageWrapper = () => {
  // State for low stock checkboxes
  const [checkedProducts, setCheckedProducts] = useState({});

  // Date utilities
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // API Queries
  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
  } = useGetProfileQuery();
  const { data: ordersData, isLoading: loadingOrders } = useGetAllOrdersQuery();
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    error: customersError,
    refetch: refetchCustomers,
  } = useGetCustomersQuery();
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetAllCategoriesQuery();
  const {
    data: usersData,
    isLoading: isUsersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useGetAllUsersQuery();
  const {
    data: productsData,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useGetAllProductsQuery();
  const { data: quotationData, isLoading: loadingQuotations } =
    useGetAllQuotationsQuery();
  const { data: invoiceData, isLoading: loadingInvoices } =
    useGetAllInvoicesQuery();
  const [clockIn, { isLoading: isClockInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();

  // Derived state
  const userId = profile?.user?.userId;
  const username = useMemo(
    () =>
      profile?.user?.name
        ? profile.user.name.charAt(0).toUpperCase() + profile.user.name.slice(1)
        : "Admin",
    [profile]
  );

  const orders = ordersData?.orders || [];
  const products = Array.isArray(productsData)
    ? productsData
    : productsData?.data || [];
  const customers = customersData?.data || [];
  const categories = categoriesData?.categories || [];
  const users = usersData?.users || [];
  const productCount = products.length;
  const quotationCount = quotationData?.length || 0;
  const invoiceCount = invoiceData?.data?.length || 0;
  const orderCount = orders.length;

  // Attendance query
  const {
    data: attendance,
    isLoading: loadingAttendance,
    error: attendanceError,
  } = useGetAttendanceQuery(
    { userId, startDate, endDate },
    { skip: !userId || loadingProfile || !!profileError }
  );

  const hasClockedIn = attendance?.length > 0 && !!attendance[0]?.clockIn;
  const hasClockedOut = hasClockedIn && !!attendance[0]?.clockOut;

  // Enhanced stats
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    [orders]
  );
  const avgOrderValue = useMemo(
    () => (orderCount > 0 ? totalRevenue / orderCount : 0).toFixed(2),
    [totalRevenue, orderCount]
  );

  // Dynamic bar widths for summary cards
  const maxCounts = useMemo(
    () => ({
      orders: Math.max(orderCount, 1),
      invoices: Math.max(invoiceCount, 1),
      quotations: Math.max(quotationCount, 1),
      products: Math.max(productCount, 1),
      revenue: Math.max(totalRevenue, 1),
      avgOrder: Math.max(avgOrderValue, 1),
    }),
    [
      orderCount,
      invoiceCount,
      quotationCount,
      productCount,
      totalRevenue,
      avgOrderValue,
    ]
  );

  // Filter data by time
  const filterByTime = (items, dateField) => {
    if (!Array.isArray(items)) return [];
    const weekItems = items.filter(
      (item) => new Date(item[dateField]) >= oneWeekAgo
    );
    return weekItems.length > 0
      ? weekItems
      : items.filter((item) => new Date(item[dateField]) >= oneMonthAgo);
  };

  const filteredProducts = useMemo(
    () => filterByTime(products, "updatedAt"),
    [products]
  );
  const filteredCustomers = useMemo(
    () => filterByTime(customers, "createdAt"),
    [customers]
  );
  const filteredCategories = useMemo(
    () => filterByTime(categories, "createdAt"),
    [categories]
  );
  const filteredUsers = useMemo(
    () => filterByTime(users, "createdAt"),
    [users]
  );

  // Low stock products
  const lowStockProducts = useMemo(
    () => (products || []).filter((p) => p.quantity < p.alert_quantity),
    [products]
  );

  // Toggle checkbox for low stock products
  const toggleProductCheck = (productId) => {
    setCheckedProducts((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Category product counts
  const categoryProductCounts = useMemo(() => {
    const productCountByCategory = filteredProducts.reduce((acc, product) => {
      const categoryId =
        product.categoryId || product.category?._id || product.category;
      if (categoryId) acc[categoryId] = (acc[categoryId] || 0) + 1;
      return acc;
    }, {});
    return filteredCategories.map((category) => ({
      ...category,
      productCount:
        productCountByCategory[category.categoryId || category._id] || 0,
    }));
  }, [filteredProducts, filteredCategories]);

  // Top categories
  const topCategories = useMemo(
    () =>
      [...categoryProductCounts]
        .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
        .slice(0, 3),
    [categoryProductCounts]
  );

  const chartData = useMemo(
    () =>
      topCategories.map((cat) => ({
        name: cat.name,
        value: cat.productCount || 0,
      })),
    [topCategories]
  );

  const COLORS = ["#4A90E2", "#F5A623", "#7B68EE"];

  // Bar chart data for orders (last 7 days)
  const barChartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      return date.toISOString().split("T")[0];
    }).reverse();
    return days.map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      orders: orders.filter(
        (order) =>
          new Date(order.createdAt).toISOString().split("T")[0] === date
      ).length,
    }));
  }, [orders, today]);

  // Top selling products
  const topSellingProducts = useMemo(() => {
    const productQuantities = {};

    // Aggregate quantities from invoices
    if (invoiceData?.data) {
      invoiceData.data.forEach((invoice) => {
        if (invoice.products && Array.isArray(invoice.products)) {
          invoice.products.forEach((product) => {
            if (product.productId && product.quantity) {
              productQuantities[product.productId] =
                (productQuantities[product.productId] || 0) + product.quantity;
            }
          });
        }
      });
    }

    // Aggregate quantities from quotations
    if (quotationData) {
      quotationData.forEach((quotation) => {
        if (quotation.products && Array.isArray(quotation.products)) {
          quotation.products.forEach((product) => {
            if (product.productId && product.quantity) {
              productQuantities[product.productId] =
                (productQuantities[product.productId] || 0) + product.quantity;
            }
          });
        }
      });
    }

    // Map product IDs to names and sort by quantity
    const topProducts = Object.entries(productQuantities)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p._id === productId);
        return {
          productId,
          name: product ? product.name : `Product ${productId}`,
          quantity,
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5 products

    return topProducts;
  }, [invoiceData, quotationData, products]);

  // Bar chart data for top selling products
  const topProductsChartData = useMemo(
    () =>
      topSellingProducts.map((product) => ({
        name: product.name,
        quantity: product.quantity,
      })),
    [topSellingProducts]
  );

  // Top customer
  const topCustomer = useMemo(
    () =>
      filteredCustomers.reduce(
        (top, customer) => {
          const totalSpent = customer.paidAmount || 0;
          return totalSpent > top.totalSpent
            ? { ...customer, totalSpent, payable: customer.balance || 0 }
            : top;
        },
        { totalSpent: 0, payable: 0 }
      ),
    [filteredCustomers]
  );

  // Today's orders
  const todaysOrders = useMemo(
    () =>
      orders.filter((order) => {
        const rawDate = order.createdAt;
        if (!rawDate || isNaN(new Date(rawDate))) return false;
        return new Date(rawDate).toISOString().split("T")[0] === startDate;
      }),
    [orders, startDate]
  );

  // Handlers
  const handleClockIn = async () => {
    if (!userId) return toast.error("User ID is not available.");
    try {
      await clockIn({ userId }).unwrap();
    } catch (error) {
      toast.error("Failed to clock in.");
    }
  };

  const handleClockOut = async () => {
    if (!userId) return toast.error("User ID is not available.");
    try {
      await clockOut({ userId }).unwrap();
    } catch (error) {
      toast.error("Failed to clock out.");
    }
  };

  // Toasts
  useEffect(() => {
    if (profileError) {
      const message =
        profileError.status === 403 &&
        profileError.data?.error.includes("roleId")
          ? "Missing role information. Please contact support."
          : profileError.status === 401 || profileError.status === 403
          ? "Session expired. Please log in again."
          : "Failed to load profile.";
      toast.error(message, { id: "profileError" });
    }
  }, [profileError]);

  // Early returns
  if (
    loadingProfile ||
    isCustomersLoading ||
    isCategoriesLoading ||
    isUsersLoading ||
    isProductsLoading
  ) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (
    profileError ||
    customersError ||
    categoriesError ||
    usersError ||
    productsError
  ) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        <h5>Error loading data:</h5>
        {profileError && (
          <p>Profile: {profileError.data?.message || "Unknown error"}</p>
        )}
        {customersError && (
          <p>Customers: {customersError.data?.message || "Unknown error"}</p>
        )}
        {categoriesError && (
          <p>Categories: {categoriesError.data?.message || "Unknown error"}</p>
        )}
        {usersError && (
          <p>Users: {usersError.data?.message || "Unknown error"}</p>
        )}
        {productsError && (
          <p>Products: {productsError.data?.message || "Unknown error"}</p>
        )}
        <button
          className="btn btn-primary mt-2"
          onClick={() => {
            if (customersError) refetchCustomers();
            if (categoriesError) refetchCategories();
            if (usersError) refetchUsers();
            if (productsError) refetchProducts();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-wrapper">
        <Alert
          type="warning"
          message="User profile not found. Please log in again."
        />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="dashboard">
          <div className="dashboard-header">
            <div>
              <h1>{username}</h1>
            </div>
          </div>

          <section className="summary-cards">
            {[
              {
                link: "/quotations/list",
                count: quotationCount,
                label: "Total Quotations",
                loading: loadingQuotations,
                icon: <FaBox />,
                max: maxCounts.quotations,
              },
              {
                link: "/orders/list",
                count: orderCount,
                label: "Total Orders",
                loading: loadingOrders,
                icon: <FaChartBar />,
                max: maxCounts.orders,
              },
              {
                link: "/inventory/products",
                count: productCount,
                label: "Total Products",
                loading: isProductsLoading,
                icon: <FaBox />,
                max: maxCounts.products,
              },
            ].map(({ count, label, loading, icon, max, link }, index) => (
              <div key={index} className="card stat">
                <div className="stat-header">
                  {icon}
                  <h3>{loading ? "..." : count}</h3>
                </div>
                <p>
                  <a href={link}> {label}</a>
                </p>
                <div
                  className="bar"
                  style={{ width: `${(count / max) * 100}%` }}
                ></div>
              </div>
            ))}
          </section>

          <section className="dashboard-main">
            <div className="card">
              <h4>Top Selling Products</h4>
              <div className="card-body">
                {topProductsChartData.some((d) => d.quantity > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topProductsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="quantity"
                        fill="#888888"
                        radius={[4, 4, 0, 0]}
                        shape={(props) => {
                          const { fill, ...rest } = props;
                          const barFill =
                            props.quantity > 0 ? "#4A90E2" : "#888888";
                          return <rect {...rest} fill={barFill} />;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No products sold recently.</p>
                )}
              </div>
            </div>
            <div className="card bar-graph">
              <h4>Order Trends (Last 7 Days)</h4>
              <div className="card-body">
                {barChartData.some((d) => d.orders > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="orders"
                        fill="#888888"
                        radius={[4, 4, 0, 0]}
                        shape={(props) => {
                          const { fill, ...rest } = props;
                          const barFill =
                            props.orders > 0 ? "#27ae60" : "#888888";
                          return <rect {...rest} fill={barFill} />;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No orders in the last 7 days.</p>
                )}
              </div>

              {/* Top Selling Products Bar Chart */}
            </div>

            <div className="card low-stock">
              <h4>Low in Stock</h4>
              <ul>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.slice(0, 4).map((product) => (
                    <li key={product._id}>
                      <input
                        type="checkbox"
                        checked={!!checkedProducts[product._id]}
                        onChange={() => toggleProductCheck(product._id)}
                        aria-label={`Select ${product.name}`}
                      />
                      {product.name} (Qty: {product.quantity})
                    </li>
                  ))
                ) : (
                  <li>No low stock products.</li>
                )}
              </ul>
            </div>
          </section>

          {!hasClockedIn && !loadingAttendance && userId && (
            <Alert
              type="warning"
              message="Please clock in to start your workday!"
            />
          )}
          {attendanceError && (
            <Alert type="danger" message="Failed to load attendance data." />
          )}
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;
