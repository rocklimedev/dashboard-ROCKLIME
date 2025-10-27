import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FaChartBar, FaBox } from "react-icons/fa6";
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
import StockModal from "../Common/StockModal";
import DataTablePagination from "../Common/DataTablePagination";
import {
  useAddProductToCartMutation,
  useGetCartQuery,
  useRemoveFromCartMutation,
} from "../../api/cartApi";
import { useUpdateOrderStatusMutation } from "../../api/orderApi";
const PageWrapper = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lowStockListModal, setLowStockListModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [addProductToCart, { isLoading: mutationLoading }] =
    useAddProductToCartMutation();
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
  } = useGetProfileQuery();
  // Enable polling for real-time order updates (every 30 seconds)
  const {
    data: ordersData,
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useGetAllOrdersQuery(undefined, { pollingInterval: 30000 }); // Poll every 30 seconds
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
  const {
    data: quotationData = [],
    isLoading: loadingQuotations,
    error: quotationsError,
    refetch: refetchQuotations,
  } = useGetAllQuotationsQuery();
  const { data: invoiceData, isLoading: loadingInvoices } =
    useGetAllInvoicesQuery();
  const [clockIn, { isLoading: isClockInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();

  const userId = profile?.user?.userId;
  const username = useMemo(() => {
    if (profile?.user?.name) {
      return profile.user.name
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }
    return "Admin";
  }, [profile]);

  const orders = ordersData?.orders || [];
  const products = Array.isArray(productsData)
    ? productsData
    : productsData?.data || [];
  const customers = customersData?.data || [];
  const categories = categoriesData?.categories || [];
  const users = usersData?.users || [];
  const productCount = products.length;
  const quotationCount = quotationData.length || 0;
  const invoiceCount = invoiceData?.data?.length || 0;
  const orderCount = orders.length;

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

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    [orders]
  );
  const avgOrderValue = useMemo(
    () => (orderCount > 0 ? totalRevenue / orderCount : 0).toFixed(2),
    [totalRevenue, orderCount]
  );
  const handleAddToCart = async (product) => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }
    const sellingPriceEntry = Array.isArray(product.metaDetails)
      ? product.metaDetails.find((detail) => detail.slug === "sellingPrice")
      : null;
    const sellingPrice = sellingPriceEntry
      ? parseFloat(sellingPriceEntry.value)
      : null;
    if (!sellingPrice || isNaN(sellingPrice)) {
      toast.error("Invalid product price");
      return;
    }
    const quantity = product.quantity || 1;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Invalid quantity");
      return;
    }
    const productId = product.productId;
    setCartLoadingStates((prev) => ({ ...prev, [productId]: true }));
    try {
      await addProductToCart({
        userId,
        productId,
        quantity,
      }).unwrap();
    } catch (error) {
      const message =
        error.status === 400
          ? "Invalid request. Please check product details."
          : error.status === 401
          ? "Unauthorized. Please log in again."
          : error.data?.message || "Unknown error";
      toast.error(`Error: ${message}`);
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

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

  const filterByTime = (items, dateField) => {
    if (!Array.isArray(items)) return [];
    return items; // No time-based filtering for all trends
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

  const lowStockProducts = useMemo(
    () => (products || []).filter((p) => p.quantity < p.alert_quantity),
    [products]
  );

  const paginatedLowStock = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return lowStockProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [lowStockProducts, currentPage]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] =
    useUpdateOrderStatusMutation();

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus({ id, status: newStatus }).unwrap();
      refetchOrders(); // Refresh orders to reflect the updated status
    } catch (error) {
      toast.error(
        `Failed to update order status: ${
          error.data?.message || "Unknown error"
        }`
      );
    }
  };

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

  // Modified barChartData to show all order trends, grouped by day
  const barChartData = useMemo(() => {
    // Create a map to group orders by date
    const orderCountsByDate = orders.reduce((acc, order) => {
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate)) return acc; // Skip invalid dates
      const dateKey = orderDate.toISOString().split("T")[0]; // YYYY-MM-DD
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.entries(orderCountsByDate)
      .map(([date, orders]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        orders,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date ascending
      .slice(-30); // Limit to last 30 days for performance (adjust as needed)
  }, [orders]);

  const topSellingProducts = useMemo(() => {
    if (loadingQuotations) return [];
    if (!Array.isArray(quotationData)) {
      return [];
    }

    const productQuantities = {};
    quotationData.forEach((quotation) => {
      let products = quotation.products || [];
      if (typeof products === "string") {
        try {
          products = JSON.parse(products);
        } catch (e) {
          products = [];
        }
      }
      if (Array.isArray(products)) {
        products.forEach((p) => {
          const pid = p.productId?._id || p.productId;
          if (pid && p.quantity) {
            productQuantities[pid] = (productQuantities[pid] || 0) + p.quantity;
          }
        });
      } else {
        console.warn("quotation.products is not an array:", products);
      }
    });

    return Object.entries(productQuantities)
      .map(([productId, quantity]) => {
        const product = products.find(
          (prod) => prod._id === productId || prod.productId === productId
        );
        return {
          productId,
          name: product?.name || "Unknown Product",
          quantity,
          metaDetails: product?.metaDetails || [], // Include metaDetails
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [quotationData, products, loadingQuotations]);
  const topProductsChartData = useMemo(
    () =>
      topSellingProducts.map((product) => ({
        name: product.name,
        quantity: product.quantity,
      })),
    [topSellingProducts]
  );

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

  const todaysOrders = useMemo(
    () =>
      orders.filter((order) => {
        const rawDate = order.createdAt;
        if (!rawDate || isNaN(new Date(rawDate))) return false;
        return new Date(rawDate).toISOString().split("T")[0] === startDate;
      }),
    [orders, startDate]
  );

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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

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
    if (quotationsError) {
      toast.error("Failed to load quotations.", { id: "quotationsError" });
    }
  }, [profileError, quotationsError]);

  if (
    loadingProfile ||
    isCustomersLoading ||
    isCategoriesLoading ||
    isUsersLoading ||
    isProductsLoading ||
    loadingQuotations
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
    productsError ||
    quotationsError
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
        {quotationsError && (
          <p>Quotations: {quotationsError.data?.message || "Unknown error"}</p>
        )}
        <button
          className="btn btn-primary mt-2"
          onClick={() => {
            if (customersError) refetchCustomers();
            if (categoriesError) refetchCategories();
            if (usersError) refetchUsers();
            if (productsError) refetchProducts();
            if (quotationsError) refetchQuotations();
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
                <Link to={link}>
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
                </Link>
              </div>
            ))}
          </section>

          <section className="dashboard-main">
            <div className="card">
              <h4>Top Selling Products</h4>
              <div className="card-body">
                {topSellingProducts.length > 0 ? (
                  <ul className="top-products-list">
                    {topSellingProducts.map((product, index) => (
                      <li
                        key={product.productId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom:
                            index < topSellingProducts.length - 1
                              ? "1px solid #e0e0e0"
                              : "none",
                        }}
                      >
                        <div>
                          <span className="product-name">
                            {product.name} ({product.quantity}{" "}
                            {product.quantity === 1} Sold )
                          </span>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.quantity === 0} // Disable if no stock, adjust based on actual stock data
                        >
                          Add to Cart
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No products sold recently.</p>
                )}
              </div>
            </div>
            <div className="card">
              <h4>Orders This Month</h4>
              <div className="card-body">
                {orders.length > 0 ? (
                  <ul className="orders-list">
                    {orders.map((order, index) => (
                      <li
                        key={order.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom:
                            index < orders.length - 1
                              ? "1px solid #e0e0e0"
                              : "none",
                        }}
                      >
                        <div>
                          <span className="order-number">
                            <strong>Order No:</strong> {order.orderNo}
                          </span>
                          <span
                            className="order-date"
                            style={{ marginLeft: "10px", color: "#666" }}
                          >
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span
                            className="order-priority"
                            style={{
                              marginLeft: "10px",
                              fontWeight: "500",
                              color:
                                order.priority === "high"
                                  ? "#e74c3c"
                                  : order.priority === "medium"
                                  ? "#f39c12"
                                  : "#27ae60",
                            }}
                          >
                            {order.priority.toUpperCase()}
                          </span>
                        </div>

                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          className="status-dropdown"
                        >
                          <option value="CREATED">Created</option>
                          <option value="PREPARING">Preparing</option>
                          <option value="CHECKING">Checking</option>
                          <option value="INVOICE">Invoice</option>
                          <option value="DISPATCHED">Dispatched</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="PARTIALLY_DELIVERED">
                            Partially Delivered
                          </option>
                          <option value="CANCELED">Canceled</option>
                          <option value="DRAFT">Draft</option>
                          <option value="ONHOLD">On Hold</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No orders available.</p>
                )}
              </div>
            </div>

            <div className="card low-stock">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h4>Low in Stock</h4>
                {lowStockProducts.length > 0 && (
                  <button
                    onClick={() => setLowStockListModal(true)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    View All
                  </button>
                )}
              </div>
              <ul>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.slice(0, 4).map((product) => (
                    <li
                      key={product._id || product.productId}
                      onClick={() => handleProductClick(product)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="product-name">{product.name}</span>
                      <span className="product-quantity">
                        Qty: {product.quantity}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>No low stock products.</li>
                )}
              </ul>
            </div>
          </section>

          {lowStockListModal && (
            <div
              className="modal fade show"
              style={{
                display: "block",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
              tabIndex="-1"
              role="dialog"
            >
              <div
                className="modal-dialog modal-lg modal-dialog-centered"
                role="document"
              >
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">All Low Stock Products</h5>
                    <button
                      type="button"
                      className="close"
                      onClick={() => setLowStockListModal(false)}
                      style={{
                        fontSize: "1.5rem",
                        lineHeight: "1",
                        border: "none",
                        background: "transparent",
                      }}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    {paginatedLowStock.length > 0 ? (
                      <ul>
                        {paginatedLowStock.map((product) => (
                          <li
                            key={product._id || product.productId}
                            onClick={() => handleProductClick(product)}
                            style={{
                              cursor: "pointer",
                              marginBottom: "8px",
                            }}
                          >
                            {product.name} (Qty: {product.quantity})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No low stock products.</p>
                    )}
                  </div>
                  <div className="modal-footer">
                    <DataTablePagination
                      totalItems={lowStockProducts.length}
                      itemNo={itemsPerPage}
                      onPageChange={handlePageChange}
                      currentPage={currentPage}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setLowStockListModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isModalVisible && selectedProduct && (
            <StockModal
              show={isModalVisible}
              onHide={() => handleModalClose(true)}
              product={selectedProduct}
              refetch={refetchProducts}
            />
          )}
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
