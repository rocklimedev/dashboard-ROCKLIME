import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FaChartBar, FaBox } from "react-icons/fa6";

import Alert from "./Alert";

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
  //  LOW-STOCK LOGIC
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
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
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
  //  LAST 5 LISTS (for right column)
  // ──────────────────────────────────────────────────────
  const lastFiveQuotations = quotationData.slice(-5).reverse();
  const lastFiveOrders = orders.slice(-5).reverse();
  const lastFiveProducts = products.slice(-5).reverse();

  // ──────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div
        className="content"
        style={{
          padding: "20px",
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "auto auto auto",
        }}
      >
        {/* LEFT COLUMN */}
        <div
          style={{
            gridColumn: "1 / 2",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* ORDERS THIS MONTH */}
          <div
            className="card"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div
              className="card-header"
              style={{
                padding: "16px",
                background: "#f8f9fa",
                fontWeight: 600,
              }}
            >
              Orders this month
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {orders.length ? (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {orders.map((o, i) => (
                    <li
                      key={o.id}
                      style={{
                        padding: "12px 16px",
                        borderBottom:
                          i < orders.length - 1 ? "1px solid #eee" : "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>Order No:</strong> {o.orderNo}
                        <span
                          style={{
                            marginLeft: 8,
                            color: "#666",
                            fontSize: "0.9rem",
                          }}
                        >
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <select
                        value={o.status}
                        onChange={(e) =>
                          handleStatusChange(o.id, e.target.value)
                        }
                        style={{
                          fontSize: "0.85rem",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #ddd",
                        }}
                      >
                        {[
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
                <p
                  style={{
                    padding: "16px",
                    color: "#888",
                    fontStyle: "italic",
                  }}
                >
                  No orders.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN */}
        <div
          style={{
            gridColumn: "2 / 3",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* TOP SELLING PRODUCT */}
          <div
            className="card"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div
              className="card-header"
              style={{
                padding: "16px",
                background: "#f8f9fa",
                fontWeight: 600,
              }}
            >
              Top Selling product
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {topProductsLoading ? (
                <p style={{ padding: "16px" }}>Loading top products…</p>
              ) : topProducts.length > 0 ? (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {topProducts.slice(0, 5).map((product, idx) => {
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
                          padding: "12px 16px",
                          borderBottom: idx < 4 ? "1px solid #eee" : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
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
                                  "flex";
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
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#666" }}>
                              {product.quantity}{" "}
                              {product.quantity === 1 ? "unit" : "units"} sold
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={cartLoadingStates[product.productId]}
                          style={{ minWidth: 90, fontSize: "0.85rem" }}
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
                <p
                  style={{
                    padding: "16px",
                    color: "#888",
                    fontStyle: "italic",
                  }}
                >
                  No sales data yet.
                </p>
              )}
            </div>
          </div>
          {/* LOW IN STOCK */}
          <div
            className="card"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div
              className="card-header"
              style={{
                padding: "16px",
                background: "#f8f9fa",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Low in Stock</span>
              <span style={{ fontSize: "0.9rem", color: "#e74c3c" }}>
                {lowStockProducts.length} of {products.length} remaining
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {lowStockProducts.slice(0, 5).map((p) => (
                  <li
                    key={p._id || p.productId}
                    onClick={() => handleProductClick(p)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span style={{ color: "#e74c3c", fontSize: "0.9rem" }}>
                      Qty: {p.quantity}
                    </span>
                  </li>
                ))}
                {lowStockProducts.length === 0 && (
                  <li
                    style={{
                      padding: "16px",
                      color: "#888",
                      fontStyle: "italic",
                    }}
                  >
                    No low stock products.
                  </li>
                )}
              </ul>
              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  placeholder="Add product..."
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "0.9rem",
                  }}
                />
                <button
                  style={{
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            gridColumn: "3 / 4",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* TOTAL QUOTATIONS */}
          <div
            className="card"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div
              className="card-header"
              style={{
                padding: "16px",
                background: "#f8f9fa",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Total Quotations</span>
              <span style={{ color: "#e74c3c", fontWeight: 600 }}>
                {quotationCount}
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  color: "#666",
                }}
              >
                Last five
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {lastFiveQuotations.length > 0 ? (
                  lastFiveQuotations.map((q) => (
                    <li
                      key={q.id}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid #eee",
                        fontSize: "0.9rem",
                      }}
                    >
                      {q.quotationNo || "Quotation"} -{" "}
                      {new Date(q.createdAt).toLocaleDateString()}
                    </li>
                  ))
                ) : (
                  <li
                    style={{
                      padding: "16px",
                      color: "#888",
                      fontStyle: "italic",
                    }}
                  >
                    No quotations.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* TOTAL ORDERS */}
          <div
            className="card"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div
              className="card-header"
              style={{
                padding: "16px",
                background: "#f8f9fa",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Total Orders</span>
              <span style={{ color: "#e74c3c", fontWeight: 600 }}>
                {orderCount}
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  color: "#666",
                }}
              >
                Last five
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {lastFiveOrders.length > 0 ? (
                  lastFiveOrders.map((o) => (
                    <li
                      key={o.id}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid #eee",
                        fontSize: "0.9rem",
                      }}
                    >
                      {o.orderNo} - {new Date(o.createdAt).toLocaleDateString()}
                    </li>
                  ))
                ) : (
                  <li
                    style={{
                      padding: "16px",
                      color: "#888",
                      fontStyle: "italic",
                    }}
                  >
                    No orders.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* TOTAL PRODUCTS */}
          <div
            className="card"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div
              className="card-header"
              style={{
                padding: "16px",
                background: "#f8f9fa",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Total Products</span>
              <span style={{ color: "#e74c3c", fontWeight: 600 }}>
                {productCount}
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  color: "#666",
                }}
              >
                Last five
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {lastFiveProducts.length > 0 ? (
                  lastFiveProducts.map((p, idx) => {
                    let imgUrl = null;
                    if (p.images) {
                      try {
                        const arr = JSON.parse(p.images);
                        imgUrl =
                          Array.isArray(arr) && arr[0] ? arr[0] : p.images;
                      } catch {
                        imgUrl = p.Numberimages;
                      }
                    }
                    return (
                      <li
                        key={p.productId}
                        style={{
                          padding: "12px 16px",
                          borderBottom: idx < 4 ? "1px solid #eee" : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={p.name}
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
                                "flex";
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
                        {p.name}
                      </li>
                    );
                  })
                ) : (
                  <li
                    style={{
                      padding: "16px",
                      color: "#888",
                      fontStyle: "italic",
                    }}
                  >
                    No products.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* STOCK DETAIL MODAL */}
      {isModalVisible && selectedProduct && (
        <StockModal
          show={isModalVisible}
          onHide={handleModalClose}
          product={selectedProduct}
        />
      )}
    </div>
  );
};

export default PageWrapper;
