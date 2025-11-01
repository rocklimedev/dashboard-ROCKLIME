import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FaChartBar, FaBox } from "react-icons/fa6";

import Alert from "./Alert";
import StockModal from "../Common/StockModal";
import DataTablePagination from "../Common/DataTablePagination";

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
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useUpdateOrderStatusMutation } from "../../api/orderApi";
import useTopProducts from "../../data/useTopProducts";
import { BiPencil } from "react-icons/bi";
// Import CSS
import "./pagewrapper.css";

const PageWrapper = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null);

  const toggleEdit = (id) => {
    setEditingOrderId(editingOrderId === id ? null : id);
  };

  const statuses = [
    "PREPARING",
    "CHECKING",
    "INVOICE",
    "DISPATCHED",
    "DELIVERED",
    "PARTIALLY_DELIVERED",
    "CANCELED",
    "DRAFT",
    "ONHOLD",
  ];
  const [addProductToCart, { isLoading: mutationLoading }] =
    useAddProductToCartMutation();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
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

  const userId = profile?.user?.userId;

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

  const orders = ordersData?.orders || [];
  const { topProducts, loading: topProductsLoading } = useTopProducts({
    quotations: quotationData,
    orders,
  });

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

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
      refetchOrders();
    } catch (e) {
      toast.error(e?.data?.message || "Status update failed");
    }
  };

  const orderCount = orders.length;
  const quotationCount = quotationData.length || 0;
  const productCount = products.length;
  const invoiceCount = invoiceData?.data?.length || 0;

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

  const lastFiveQuotations = quotationData.slice(-5).reverse();
  const lastFiveOrders = orders.slice(-5).reverse();
  const lastFiveProducts = products.slice(-5).reverse();

  const statusColors = {
    PREPARING: "badge bg-warning text-dark",
    CHECKING: "badge bg-info text-dark",
    INVOICE: "badge bg-secondary",
    DISPATCHED: "badge bg-primary",
    DELIVERED: "badge bg-success",
    PARTIALLY_DELIVERED: "badge bg-light text-dark border",
    CANCELED: "badge bg-danger",
    DRAFT: "badge bg-secondary",
    ONHOLD: "badge bg-dark",
  };

  const getImageUrl = (images) => {
    if (!images) return null;
    try {
      const arr = JSON.parse(images);
      return Array.isArray(arr) && arr[0] ? arr[0] : images;
    } catch {
      return images;
    }
  };

  const getSellingPrice = (product) => {
    return (
      product.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
      product.metaDetails?.find((m) => m.slug === "sellingPrice")?.value ||
      0
    );
  };

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
                        className="list-item d-flex justify-content-between align-items-start p-2"
                        style={{
                          borderBottom:
                            i < orders.length - 1 ? "1px solid #eee" : "none",
                        }}
                      >
                        <div className="flex-grow-1">
                          <a href={`/order/${o.id}`} className="order-link">
                            #{o.orderNo}{" "}
                            {o.priority && (
                              <span
                                className={`ms-2 fw-semibold ${
                                  o.priority === "high"
                                    ? "text-danger"
                                    : o.priority === "medium"
                                    ? "text-warning"
                                    : "text-success"
                                }`}
                              >
                                ({o.priority.toUpperCase()})
                              </span>
                            )}
                          </a>

                          <div className="mt-1 info-text">
                            <span className="me-2">
                              <i className="bi bi-person info-icon"></i>
                              {o.customer?.name || "Unknown Customer"}
                            </span>
                            <span className="me-2">
                              <i className="bi bi-person-badge info-icon"></i>
                              {o.assignedUser?.name || "Unassigned"}
                            </span>
                          </div>
                          <span className="ms-2 info-text">
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="d-flex flex-column align-items-end position-relative">
                          <div className="d-flex align-items-center gap-1">
                            <span
                              className={`status-badge px-2 py-1 rounded-2 ${
                                statusColors[o.status] || "bg-light text-dark"
                              }`}
                              style={{ fontSize: "0.8rem" }}
                            >
                              {o.status}
                            </span>

                            <BiPencil
                              size={16}
                              className="text-secondary cursor-pointer"
                              onClick={() => toggleEdit(o.id)}
                              title="Edit Status"
                            />
                          </div>

                          {editingOrderId === o.id && (
                            <div
                              className="position-absolute bg-white shadow-sm rounded-2 border mt-1"
                              style={{ top: "100%", right: 0, zIndex: 10 }}
                            >
                              <select
                                size={statuses.length}
                                value={o.status}
                                onChange={(e) => {
                                  handleStatusChange(o.id, e.target.value);
                                  setEditingOrderId(null);
                                }}
                                className="form-select form-select-sm border-0"
                                style={{
                                  width: "160px",
                                  fontSize: "0.85rem",
                                  cursor: "pointer",
                                }}
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state p-3">No orders this month.</p>
                )}
              </div>
            </div>
          </div>
          {/* MIDDLE COLUMN */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold d-flex justify-content-between">
                <span>
                  Total Quotations{" "}
                  <span className="text-danger fw-semibold">
                    ({quotationCount})
                  </span>
                </span>
                <div className="px-3 py-2 small text-muted">Last five</div>
              </div>
              <div className="card-body p-0">
                <ul className="list-unstyled m-0">
                  {lastFiveQuotations.length > 0 ? (
                    lastFiveQuotations.map((q, i) => (
                      <li
                        key={q.quotationId}
                        className="list-item"
                        style={{
                          borderBottom:
                            i < lastFiveQuotations.length - 1
                              ? "1px solid #eee"
                              : "none",
                        }}
                      >
                        <div className="flex-grow-1">
                          <a
                            href={`/quotation/${q.quotationId}`}
                            className="order-link"
                          >
                            {q.reference_number || "Quotation"}
                          </a>

                          <span className="ms-2 info-text">
                            {new Date(q.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>

                          <div className="mt-1 info-text">
                            <span className="me-2">
                              <i className="bi bi-person info-icon"></i>
                              {q.customer?.name || "Customer"}
                            </span>
                            <span className="me-2">
                              <i className="bi bi-calendar-event info-icon"></i>
                              Due:{" "}
                              {new Date(q.due_date).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                }
                              )}
                            </span>
                            <span>
                              <i className="bi bi-percent info-icon"></i>
                              Disc: {q.extraDiscount || 0}
                              {q.extraDiscountType === "percent" ? "%" : ""}
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="amount">
                            ₹
                            {parseFloat(q.finalAmount || 0).toLocaleString(
                              "en-IN"
                            )}
                          </div>
                          <div className="item-count">
                            {q.items?.length || 0} items
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="empty-state">No quotations.</li>
                  )}
                </ul>
              </div>
            </div>

            {lowStockProducts.length > 0 && (
              <div className="card shadow-sm rounded-3">
                <div className="card-header bg-light fw-semibold low-stock-header">
                  <span>Low in Stock</span>
                  <span className="low-stock-count">
                    {lowStockProducts.length} of {products.length} remaining
                  </span>
                </div>
                <div className="card-body p-0">
                  <ul className="list-unstyled m-0">
                    {paginatedLowStock.map((p) => (
                      <li
                        key={p._id || p.productId}
                        onClick={() => handleProductClick(p)}
                        className="low-stock-item"
                      >
                        <span className="fw-semibold">{p.name}</span>
                        <span className="low-stock-qty">Qty: {p.quantity}</span>
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
                  <div className="add-product-bar">
                    <input
                      type="text"
                      placeholder="Add product..."
                      className="form-control form-control-sm"
                    />
                    <button className="btn btn-danger btn-sm">Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            {/* Top Selling Products */}
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold">
                Top Selling Products
              </div>
              <div className="card-body p-0">
                {topProductsLoading ? (
                  <p className="p-3">Loading top products…</p>
                ) : topProducts.length > 0 ? (
                  <ul className="list-unstyled m-0">
                    {topProducts.slice(0, 5).map((product, idx) => {
                      const imgUrl = getImageUrl(product.images);
                      const sellingPrice = getSellingPrice(product);

                      return (
                        <li
                          key={product.productId}
                          className="d-flex align-items-center justify-content-between"
                          style={{
                            padding: "12px 16px",
                            borderBottom: idx < 4 ? "1px solid #eee" : "none",
                          }}
                        >
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.name}
                                className="product-image"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextElementSibling.style.display =
                                    "flex";
                                }}
                              />
                            ) : null}

                            <div className="d-flex flex-column">
                              <a
                                href={`/product/${product.productId}`}
                                className="product-name-link"
                              >
                                {product.name}
                              </a>
                              <div className="sold-text">
                                {product.quantity}{" "}
                                {product.quantity === 1 ? "unit" : "units"} sold
                              </div>
                            </div>
                          </div>

                          <div className="text-end">
                            <div className="price">
                              ₹
                              {parseFloat(sellingPrice).toLocaleString("en-IN")}
                            </div>
                            <button
                              className="btn btn-outline-primary btn-sm add-to-cart-btn"
                              onClick={() => handleAddToCart(product)}
                              disabled={cartLoadingStates[product.productId]}
                            >
                              {cartLoadingStates[product.productId]
                                ? "Adding…"
                                : "Add to Cart"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="empty-state">No sales data yet.</p>
                )}
              </div>
            </div>

            {/* Last Five Products */}
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
                <span>
                  Total Products{" "}
                  <span className="text-danger fw-semibold">
                    ({productCount})
                  </span>
                </span>
                <div className="small text-muted">Last five</div>
              </div>
              <div className="card-body p-0">
                <ul className="list-unstyled m-0">
                  {lastFiveProducts.length > 0 ? (
                    lastFiveProducts.slice(0, 5).map((p, idx) => {
                      const imgUrl = getImageUrl(p.images);
                      const sellingPrice = getSellingPrice(p);

                      return (
                        <li
                          key={p.productId}
                          className="d-flex align-items-center justify-content-between"
                          style={{
                            padding: "12px 16px",
                            borderBottom: idx < 4 ? "1px solid #eee" : "none",
                          }}
                        >
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.name}
                                className="product-image"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextElementSibling.style.display =
                                    "flex";
                                }}
                              />
                            ) : null}

                            <div className="d-flex flex-column">
                              <a
                                href={`/product/${p.productId}`}
                                className="product-name-link"
                              >
                                {p.name}
                              </a>
                              <div className="info-text">
                                Added on{" "}
                                {new Date(p.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                  }
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="info-text">
                            ₹{parseFloat(sellingPrice).toLocaleString("en-IN")}
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="empty-state">No products.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Modal */}
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
