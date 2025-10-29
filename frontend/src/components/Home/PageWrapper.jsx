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
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useUpdateOrderStatusMutation } from "../../api/orderApi";
import useTopProducts from "../../data/useTopProducts";

const PageWrapper = () => {
  // ──────────────────────────────────────────────────────
  //  BASIC STATE
  // ──────────────────────────────────────────────────────
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lowStockListModal, setLowStockListModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cartLoadingStates, setCartLoadingStates] = useState({});

  const [addProductToCart, { isLoading: mutationLoading }] =
    useAddProductToCartMutation();

  // ──────────────────────────────────────────────────────
  //  DATE HELPERS
  // ──────────────────────────────────────────────────────
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // ──────────────────────────────────────────────────────
  //  PROFILE
  // ──────────────────────────────────────────────────────
  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
  } = useGetProfileQuery();

  const userId = profile?.user?.userId;

  // ──────────────────────────────────────────────────────
  //  CORE DATA QUERIES
  // ──────────────────────────────────────────────────────
  const {
    data: ordersData,
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useGetAllOrdersQuery(undefined, { pollingInterval: 30000 });

  const { data: quotationData = [], isLoading: loadingQuotations } =
    useGetAllQuotationsQuery();

  const { data: productsData, isLoading: isProductsLoading } =
    useGetAllProductsQuery();

  const { data: customersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();

  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useGetAllCategoriesQuery();

  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsersQuery();

  const { data: invoiceData, isLoading: loadingInvoices } =
    useGetAllInvoicesQuery();

  // ──────────────────────────────────────────────────────
  //  TOP-SELLING PRODUCTS (Quotations + Orders)
  // ──────────────────────────────────────────────────────
  const orders = ordersData?.orders || [];
  const { topProducts, loading: topProductsLoading } = useTopProducts({
    quotations: quotationData,
    orders,
  });

  // ──────────────────────────────────────────────────────
  //  ATTENDANCE
  // ──────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────
  //  CLOCK-IN / OUT
  // ──────────────────────────────────────────────────────
  const [clockIn] = useClockInMutation();
  const [clockOut] = useClockOutMutation();

  const handleClockIn = async () => {
    if (!userId) return toast.error("User ID missing");
    try {
      await clockIn({ userId }).unwrap();
    } catch {
      toast.error("Clock-in failed");
    }
  };
  const handleClockOut = async () => {
    if (!userId) return toast.error("User ID missing");
    try {
      await clockOut({ userId }).unwrap();
    } catch {
      toast.error("Clock-out failed");
    }
  };

  // ──────────────────────────────────────────────────────
  //  CART HELPERS
  // ──────────────────────────────────────────────────────
  const handleAddToCart = async (product) => {
    if (!userId) return toast.error("User not logged in!");
    const priceEntry = Array.isArray(product.metaDetails)
      ? product.metaDetails.find((d) => d.slug === "sellingPrice")
      : null;
    const price = priceEntry ? parseFloat(priceEntry.value) : null;
    if (!price) return toast.error("Invalid price");

    const qty = product.quantity || 1;
    if (!Number.isInteger(qty) || qty <= 0) return toast.error("Invalid qty");

    setCartLoadingStates((s) => ({ ...s, [product.productId]: true }));
    try {
      await addProductToCart({
        userId,
        productId: product.productId,
        quantity: qty,
      }).unwrap();
      toast.success("Added to cart");
    } catch (e) {
      toast.error(e?.data?.message || "Add to cart failed");
    } finally {
      setCartLoadingStates((s) => ({ ...s, [product.productId]: false }));
    }
  };

  // ──────────────────────────────────────────────────────
  //  LOW-STOCK LOGIC (unchanged)
  // ──────────────────────────────────────────────────────
  const products = Array.isArray(productsData)
    ? productsData
    : productsData?.data || [];

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.quantity < p.alert_quantity),
    [products]
  );

  const paginatedLowStock = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return lowStockProducts.slice(start, start + itemsPerPage);
  }, [lowStockProducts, currentPage]);

  const handleProductClick = (p) => {
    setSelectedProduct(p);
    setIsModalVisible(true);
  };
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  // ──────────────────────────────────────────────────────
  //  ORDER STATUS UPDATE
  // ──────────────────────────────────────────────────────
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus({ id, status: newStatus }).unwrap();
      refetchOrders();
    } catch (e) {
      toast.error(e?.data?.message || "Status update failed");
    }
  };

  // ──────────────────────────────────────────────────────
  //  SUMMARY NUMBERS
  // ──────────────────────────────────────────────────────
  const orderCount = orders.length;
  const quotationCount = quotationData.length || 0;
  const productCount = products.length;
  const invoiceCount = invoiceData?.data?.length || 0;

  // ──────────────────────────────────────────────────────
  //  EARLY RETURNS (loading / errors)
  // ──────────────────────────────────────────────────────
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
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="alert alert-danger m-3">
        <h5>Profile error</h5>
        <p>{profileError?.data?.message || "Unknown error"}</p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="dashboard">
          {/* ────── SUMMARY CARDS ────── */}
          <section className="summary-cards">
            {[
              {
                link: "/quotations/list",
                count: quotationCount,
                label: "Total Quotations",
                icon: <FaBox />,
              },
              {
                link: "/orders/list",
                count: orderCount,
                label: "Total Orders",
                icon: <FaChartBar />,
              },
              {
                link: "/inventory/products",
                count: productCount,
                label: "Total Products",
                icon: <FaBox />,
              },
            ].map(({ count, label, icon, link }, i) => (
              <div key={i} className="card stat">
                <Link to={link}>
                  <div className="stat-header">
                    {icon}
                    <h3>{count}</h3>
                  </div>
                  <p>
                    <a href={link}>{label}</a>
                  </p>
                  <div
                    className="bar"
                    style={{ width: `${(count / Math.max(count, 1)) * 100}%` }}
                  />
                </Link>
              </div>
            ))}
          </section>

          {/* ────── MAIN SECTION ────── */}
          <section className="dashboard-main">
            {/* TOP SELLING PRODUCTS */}
            <div className="card">
              <h4>Top Selling Products (Quotations + Orders)</h4>
              <div className="card-body">
                {topProductsLoading ? (
                  <p>Loading top products…</p>
                ) : topProducts.length > 0 ? (
                  <ul className="top-products-list">
                    {topProducts.map((product, idx) => {
                      // ----- IMAGE HANDLING -----
                      let imgUrl = null;
                      if (product.images) {
                        try {
                          const arr = JSON.parse(product.images);
                          imgUrl =
                            Array.isArray(arr) && arr[0]
                              ? arr[0]
                              : product.images;
                        } catch {
                          imgUrl = product.images;
                        }
                      }

                      return (
                        <li
                          key={product.productId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom:
                              idx < topProducts.length - 1
                                ? "1px solid #e0e0e0"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            {/* Image / Placeholder */}
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.name}
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                  border: "1px solid #eee",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextElementSibling.style.display =
                                    "block";
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                background: "#f5f5f5",
                                borderRadius: 6,
                                display: imgUrl ? "none" : "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                color: "#999",
                              }}
                            >
                              No Img
                            </div>

                            {/* Name + Qty */}
                            <div>
                              <div style={{ fontWeight: 500 }}>
                                {product.name}
                              </div>
                              <div
                                style={{ fontSize: "0.85rem", color: "#666" }}
                              >
                                {product.quantity}{" "}
                                {product.quantity === 1 ? "unit" : "units"} sold
                              </div>
                            </div>
                          </div>

                          {/* Add to Cart */}
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={cartLoadingStates[product.productId]}
                            style={{ minWidth: 90 }}
                          >
                            {cartLoadingStates[product.productId]
                              ? "Adding…"
                              : "Add to Cart"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p style={{ color: "#888", fontStyle: "italic" }}>
                    No sales data yet.
                  </p>
                )}
              </div>
            </div>

            {/* ORDERS THIS MONTH (unchanged) */}
            <div className="card">
              <h4>Orders This Month</h4>
              <div className="card-body">
                {orders.length ? (
                  <ul className="orders-list">
                    {orders.map((o, i) => (
                      <li
                        key={o.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom:
                            i < orders.length - 1
                              ? "1px solid #e0e0e0"
                              : "none",
                        }}
                      >
                        <div>
                          <strong>Order No:</strong> {o.orderNo}{" "}
                          <span style={{ marginLeft: 10, color: "#666" }}>
                            {new Date(o.createdAt).toLocaleDateString()}
                          </span>
                          <span
                            style={{
                              marginLeft: 10,
                              fontWeight: 500,
                              color:
                                o.priority === "high"
                                  ? "#e74c3c"
                                  : o.priority === "medium"
                                  ? "#f39c12"
                                  : "#27ae60",
                            }}
                          >
                            {o.priority?.toUpperCase()}
                          </span>
                        </div>
                        <select
                          value={o.status}
                          onChange={(e) =>
                            handleStatusChange(o.id, e.target.value)
                          }
                          className="status-dropdown"
                        >
                          {[
                            "CREATED",
                            "PREPARING",
                            "CHECKING",
                            "INVOICE",
                            "DISPATCHED",
                            "DELIVERED",
                            "PARTIALLY_DELIVERED",
                            "CANCELED",
                            "DRAFT",
                            "ONHOLD",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No orders.</p>
                )}
              </div>
            </div>

            {/* LOW STOCK (unchanged) */}
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
                {lowStockProducts.length ? (
                  lowStockProducts.slice(0, 4).map((p) => (
                    <li
                      key={p._id || p.productId}
                      onClick={() => handleProductClick(p)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="product-name">{p.name}</span>
                      <span className="product-quantity">
                        Qty: {p.quantity}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>No low stock products.</li>
                )}
              </ul>
            </div>
          </section>

          {/* LOW-STOCK MODAL */}
          {lowStockListModal && (
            <div
              className="modal fade show"
              style={{ display: "block", backgroundColor: "rgba(0,0,0,.5)" }}
              tabIndex="-1"
            >
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">All Low Stock Products</h5>
                    <button
                      type="button"
                      className="close"
                      onClick={() => setLowStockListModal(false)}
                      style={{
                        fontSize: "1.5rem",
                        lineHeight: 1,
                        border: "none",
                        background: "transparent",
                      }}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="modal-body">
                    {paginatedLowStock.length ? (
                      <ul>
                        {paginatedLowStock.map((p) => (
                          <li
                            key={p._id || p.productId}
                            onClick={() => handleProductClick(p)}
                            style={{ cursor: "pointer", marginBottom: 8 }}
                          >
                            {p.name} (Qty: {p.quantity})
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
                      onPageChange={setCurrentPage}
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

          {/* STOCK DETAIL MODAL */}
          {isModalVisible && selectedProduct && (
            <StockModal
              show={isModalVisible}
              onHide={handleModalClose}
              product={selectedProduct}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;
