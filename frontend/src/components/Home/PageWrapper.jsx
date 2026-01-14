import React, { useMemo, useState } from "react";
import { message } from "antd";
import StockModal from "../Common/StockModal";
import DataTablePagination from "../Common/DataTablePagination";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceQuery,
} from "../../api/attendanceApi";
import {
  useGetAllProductsQuery,
  useGetTopSellingProductsQuery,
} from "../../api/productApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useUpdateOrderStatusMutation } from "../../api/orderApi";
import "./pagewrapper.css";
import { EditOutlined } from "@ant-design/icons";

// Fixed meta ID for selling price (from your data)
const SELLING_PRICE_META_ID = "9ba862ef-f993-4873-95ef-1fef10036aa5";

const PageWrapper = () => {
  /* ------------------------------------------------------------------ */
  /*  STATE & MODALS                                                    */
  /* ------------------------------------------------------------------ */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  const toggleEdit = (id) => {
    setEditingOrderId((prev) => (prev === id ? null : id));
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

  const handleProductClick = (p) => {
    setSelectedProductForStock(p);
    setStockModalOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /*  RTK-QUERY HOOKS                                                   */
  /* ------------------------------------------------------------------ */
  const [addProductToCart] = useAddProductToCartMutation();
  const { data: profile } = useGetProfileQuery();
  const userId = profile?.user?.userId;

  const { data: ordersResponse, refetch: refetchOrders } = useGetAllOrdersQuery(
    undefined,
    { pollingInterval: 30000 }
  );
  const orders = ordersResponse?.data || [];

  const { data: quotationsResponse } = useGetAllQuotationsQuery({ limit: 20 });
  const quotations = quotationsResponse?.data || [];

  const { data: productsResponse } = useGetAllProductsQuery({ limit: 10000 });
  const products = productsResponse?.data || [];

  const { data: customersResponse } = useGetCustomersQuery({ limit: 1000 });
  const customersData = customersResponse?.data || [];

  const { data: invoiceData } = useGetAllInvoicesQuery();

  const { data: topSellingData, isLoading: topProductsLoading } =
    useGetTopSellingProductsQuery(10);
  const topProducts = topSellingData?.data || [];

  /* ------------------------------------------------------------------ */
  /*  ATTENDANCE                                                        */
  /* ------------------------------------------------------------------ */
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  /* ------------------------------------------------------------------ */
  /*  CART & HELPERS                                                    */
  /* ------------------------------------------------------------------ */
  const handleAddToCart = async (product) => {
    if (!userId) return message.error("User not logged in!");

    const priceEntry = product.metaDetails?.find(
      (d) => d.id === SELLING_PRICE_META_ID
    );
    const price = priceEntry ? parseFloat(priceEntry.value) : null;
    if (!price || isNaN(price)) return message.error("Invalid price");

    const qty = 1;

    setCartLoadingStates((s) => ({ ...s, [product.productId]: true }));
    try {
      await addProductToCart({
        userId,
        productId: product.productId,
        quantity: qty,
      }).unwrap();
      message.success("Added to cart");
    } catch (e) {
      message.error(e?.data?.message || "Add to cart failed");
    } finally {
      setCartLoadingStates((s) => ({ ...s, [product.productId]: false }));
    }
  };

  /* ------------------------------------------------------------------ */
  /*  LOW STOCK & PAGINATION                                            */
  /* ------------------------------------------------------------------ */
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.quantity < (p.alert_quantity || 20)),
    [products]
  );

  const paginatedLowStock = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return lowStockProducts.slice(start, start + itemsPerPage);
  }, [lowStockProducts, currentPage]);

  /* ------------------------------------------------------------------ */
  /*  STATUS UPDATE                                                     */
  /* ------------------------------------------------------------------ */
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
      refetchOrders();
      message.success("Status updated");
      setEditingOrderId(null);
    } catch (e) {
      message.error(e?.data?.message || "Status update failed");
    }
  };

  /* ------------------------------------------------------------------ */
  /*  COUNTS & LATEST                                                   */
  /* ------------------------------------------------------------------ */
  const orderCount = orders.length;
  const quotationCount = quotations.length;
  const productCount = products.length;
  const invoiceCount = invoiceData?.data?.length || 0;

  const lastFiveQuotations = [...quotations]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const lastFiveOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const lastFiveProducts = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  /* ------------------------------------------------------------------ */
  /*  CUSTOMER MAP                                                      */
  /* ------------------------------------------------------------------ */
  const customerMap = useMemo(() => {
    return customersData.reduce((map, c) => {
      map[c.customerId] = c.name;
      return map;
    }, {});
  }, [customersData]);

  const getCustomerName = (customerId) => customerMap[customerId] || "Unknown";

  /* ------------------------------------------------------------------ */
  /*  UI HELPERS                                                        */
  /* ------------------------------------------------------------------ */
  const getImageUrl = (images) => {
    if (!images || images.length === 0) return null;
    if (Array.isArray(images)) return images[0];
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) && parsed[0] ? parsed[0] : null;
    } catch {
      return null;
    }
  };

  const getSellingPrice = (product) => {
    // Preferred: use the meta object with UUID key
    const metaValue = product.meta?.[SELLING_PRICE_META_ID];
    if (metaValue != null) {
      // catches null/undefined
      return String(metaValue); // ensure string for parseFloat
    }

    // Fallback for older data (numeric id in metaDetails)
    const entry = product.metaDetails?.find((m) => m.id === 9);
    if (entry?.value) {
      return entry.value;
    }

    return "0";
  };

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row gx-3 gy-3">
          {/* LEFT: Orders */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold">
                ORDERS THIS MONTH{" "}
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
                              <i className="bi bi-person-badge info-icon"></i>
                              {o.customer?.name ||
                                getCustomerName(o.customerId) ||
                                "Unknown"}
                            </span>
                            <span className="ms-2 info-text">
                              {new Date(o.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="d-flex flex-column align-items-end position-relative">
                          <div className="d-flex align-items-center gap-1">
                            <span
                              className="bg-light text-dark"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {o.status}
                            </span>
                            <EditOutlined
                              className="text-secondary cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEdit(o.id);
                              }}
                              title="Edit Status"
                            />
                          </div>

                          {editingOrderId === o.id && (
                            <div
                              className="position-absolute bg-white shadow-sm rounded-2 border mt-1"
                              style={{
                                top: "100%",
                                right: 0,
                                zIndex: 1000,
                                minWidth: "160px",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ul
                                className="list-unstyled m-0 p-1"
                                style={{
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                }}
                              >
                                {statuses.map((s) => (
                                  <li key={s}>
                                    <button
                                      type="button"
                                      className={`w-100 text-start px-3 py-2 small rounded-2 hover-bg-light ${
                                        o.status === s
                                          ? "bg-primary text-white"
                                          : "text-dark"
                                      }`}
                                      style={{
                                        fontSize: "0.85rem",
                                        border: "none",
                                        background: "none",
                                      }}
                                      onClick={() => {
                                        handleStatusChange(o.id, s);
                                        setEditingOrderId(null);
                                      }}
                                    >
                                      {s}
                                    </button>
                                  </li>
                                ))}
                              </ul>
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

          {/* MIDDLE: Quotations + Low Stock */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold">
                TOTAL QUOTATIONS{" "}
                <span className="text-danger fw-semibold">
                  ({quotationCount})
                </span>
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
                          <div className="mt-1 info-text">
                            <span className="me-2">
                              <i className="bi bi-person info-icon"></i>
                              {getCustomerName(q.customerId) ||
                                q.customer?.name ||
                                "Customer"}
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
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="amount">
                            ₹
                            {parseFloat(q.finalAmount || 0).toLocaleString(
                              "en-IN"
                            )}
                          </div>
                          <span className="ms-2 info-text">
                            {new Date(q.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="empty-state">No quotations.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Low Stock */}
            {lowStockProducts.length > 0 && (
              <div className="card shadow-sm rounded-3">
                <div className="card-header bg-light fw-semibold low-stock-header">
                  <span>LOW IN STOCK</span>
                  <span className="low-stock-count">
                    {lowStockProducts.length} of {products.length} remaining
                  </span>
                </div>
                <div className="card-body p-0">
                  <ul className="list-unstyled m-0">
                    {paginatedLowStock.map((p) => (
                      <li
                        key={p.productId}
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
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Top Selling + Recent Products */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            {/* Top Selling Products */}
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold">
                TOP SELLING PRODUCTS{" "}
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
                            {imgUrl && (
                              <img
                                src={imgUrl}
                                alt={product.name}
                                className="product-image"
                                onError={(e) =>
                                  (e.target.style.display = "none")
                                }
                              />
                            )}
                            <div className="d-flex flex-column">
                              <a
                                href={`/product/${product.productId}`}
                                className="product-name-link"
                              >
                                {product.name}
                              </a>
                              <div className="sold-text">
                                {product.totalSold}{" "}
                                {product.totalSold === 1 ? "unit" : "units"}{" "}
                                sold
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
                  <p className="empty-state p-3">No sales data yet.</p>
                )}
              </div>
            </div>

            {/* Recent Products */}
            <div className="card shadow-sm rounded-3">
              <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
                TOTAL PRODUCTS{" "}
                <span className="text-danger fw-semibold">
                  ({productCount})
                </span>
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
                            {imgUrl && (
                              <img
                                src={imgUrl}
                                alt={p.name}
                                className="product-image"
                                onError={(e) =>
                                  (e.target.style.display = "none")
                                }
                              />
                            )}
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

        <StockModal
          open={stockModalOpen}
          onCancel={() => {
            setStockModalOpen(false);
            setSelectedProductForStock(null);
          }}
          product={selectedProductForStock}
          action="add"
        />
      </div>
    </div>
  );
};

export default PageWrapper;
