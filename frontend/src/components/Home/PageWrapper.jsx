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
      <div className="content">
        <div className="row gx-3 gy-3">
          {/* LEFT COLUMN */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold">
                Orders this month
              </div>
              <div className="card-body p-0">
                {orders.length ? (
                  <ul className="list-unstyled m-0">
                    {orders.map((o, i) => (
                      <li
                        key={o.id}
                        className="d-flex justify-content-between align-items-center border-bottom"
                        style={{
                          padding: "12px 16px",
                          borderBottom:
                            i < orders.length - 1 ? "1px solid #eee" : "none",
                        }}
                      >
                        <div>
                          <strong>Order No:</strong> {o.orderNo}
                          <span className="ms-2 text-muted small">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <select
                          value={o.status}
                          onChange={(e) =>
                            handleStatusChange(o.id, e.target.value)
                          }
                          className="form-select form-select-sm"
                          style={{ maxWidth: 150 }}
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
                  <p className="p-3 text-muted fst-italic">No orders.</p>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold">
                Top Selling product
              </div>
              <div className="card-body p-0">
                {topProductsLoading ? (
                  <p className="p-3">Loading top products…</p>
                ) : topProducts.length > 0 ? (
                  <ul className="list-unstyled m-0">
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
                          className="d-flex align-items-center justify-content-between border-bottom"
                          style={{
                            padding: "12px 16px",
                            borderBottom: idx < 4 ? "1px solid #eee" : "none",
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.name}
                                className="rounded border"
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
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
                              <div className="fw-semibold">{product.name}</div>
                              <div className="small text-muted">
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
                  <p className="p-3 text-muted fst-italic">
                    No sales data yet.
                  </p>
                )}
              </div>
            </div>
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold d-flex justify-content-between">
                <span>Total Products</span>
                <span className="text-danger fw-semibold">{productCount}</span>
              </div>
              <div className="card-body p-0">
                <div className="px-3 py-2 small text-muted">Last five</div>
                <ul className="list-unstyled m-0">
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
                          className="d-flex align-items-center justify-content-between border-bottom"
                          style={{
                            padding: "12px 16px",
                            borderBottom: idx < 4 ? "1px solid #eee" : "none",
                          }}
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={p.name}
                              className="rounded border"
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "cover",
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
                    <li className="p-3 text-muted fst-italic">No products.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold d-flex justify-content-between">
                <span>Total Quotations</span>
                <span className="text-danger fw-semibold">
                  {quotationCount}
                </span>
              </div>
              <div className="card-body p-0">
                <div className="px-3 py-2 small text-muted">Last five</div>
                <ul className="list-unstyled m-0">
                  {lastFiveQuotations.length > 0 ? (
                    lastFiveQuotations.map((q) => (
                      <li
                        key={q.id}
                        className="border-bottom"
                        style={{
                          padding: "10px 16px",
                        }}
                      >
                        {q.quotationNo || "Quotation"} -{" "}
                        {new Date(q.createdAt).toLocaleDateString()}
                      </li>
                    ))
                  ) : (
                    <li className="p-3 text-muted fst-italic">
                      No quotations.
                    </li>
                  )}
                </ul>
              </div>
            </div>
            {lowStockProducts.length > 0 && (
              <div className="card shadow-sm rounded-3">
                <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
                  <span>Low in Stock</span>
                  <span className="small text-danger">
                    {lowStockProducts.length} of {products.length} remaining
                  </span>
                </div>
                <div className="card-body p-0">
                  <ul className="list-unstyled m-0">
                    {paginatedLowStock.map((p) => (
                      <li
                        key={p._id || p.productId}
                        onClick={() => handleProductClick(p)}
                        className="d-flex justify-content-between align-items-center border-bottom"
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                        }}
                      >
                        <span className="fw-semibold">{p.name}</span>
                        <span className="text-danger small">
                          Qty: {p.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {lowStockProducts.length > itemsPerPage && (
                    <DataTablePagination
                      currentPage={currentPage}
                      totalItems={lowStockProducts.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                  <div className="d-flex align-items-center gap-2 px-3 py-2">
                    <input
                      type="text"
                      placeholder="Add product..."
                      className="form-control form-control-sm"
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-danger btn-sm">Add</button>
                  </div>
                </div>
              </div>
            )}
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
    </div>
  );
};

export default PageWrapper;
