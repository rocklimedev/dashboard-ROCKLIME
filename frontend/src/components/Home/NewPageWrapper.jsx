import React, { useMemo, useState } from "react";
import { message } from "antd";
import StockModal from "../Common/StockModal";
import {
  useGetAllProductsQuery,
  useGetTopSellingProductsQuery,
} from "../../api/productApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useUpdateOrderStatusMutation } from "../../api/orderApi";
import "./pagewrapper.css";
import { EditOutlined } from "@ant-design/icons";

// Fixed meta ID for selling price
const SELLING_PRICE_META_ID = "9ba862ef-f993-4873-95ef-1fef10036aa5";

const NewPageWrapper = () => {
  /* ------------------------------------------------------------------ */
  /*  STATE & MODALS                                                    */
  /* ------------------------------------------------------------------ */
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
    { pollingInterval: 30000 },
  );

  const THIRTY_DAYS_AGO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const recentOrders = useMemo(() => {
    const allOrders = ordersResponse?.data || [];
    return allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= THIRTY_DAYS_AGO;
    });
  }, [ordersResponse, THIRTY_DAYS_AGO]);

  const { data: quotationsResponse } = useGetAllQuotationsQuery({ limit: 20 });
  const quotations = quotationsResponse?.data || [];

  const { data: productsResponse } = useGetAllProductsQuery({ limit: 10000 });
  const products = productsResponse?.data || [];

  const { data: customersResponse } = useGetCustomersQuery({ limit: 1000 });
  const customersData = customersResponse?.data || [];

  const { data: topSellingData, isLoading: topProductsLoading } =
    useGetTopSellingProductsQuery(10);
  const topProducts = topSellingData?.data || [];

  /* ------------------------------------------------------------------ */
  /*  CART & HELPERS                                                    */
  /* ------------------------------------------------------------------ */
  const handleAddToCart = async (product) => {
    if (!userId) return message.error("User not logged in!");

    const priceEntry = product.metaDetails?.find(
      (d) => d.id === SELLING_PRICE_META_ID,
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
  /*  LOW STOCK                                                         */
  /* ------------------------------------------------------------------ */
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.quantity < (p.alert_quantity || 20)),
    [products],
  );

  const displayedLowStock = useMemo(
    () => lowStockProducts.slice(0, 10),
    [lowStockProducts],
  );

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
  /*  COUNTS                                                            */
  /* ------------------------------------------------------------------ */
  const quotationCount = quotations.length;
  const productCount = products.length;

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
    const metaValue = product.meta?.[SELLING_PRICE_META_ID];
    if (metaValue != null) return String(metaValue);

    const entry = product.metaDetails?.find(
      (m) => m.id === SELLING_PRICE_META_ID,
    );
    if (entry?.value) return entry.value;

    return "0";
  };

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Top Statistics Row */}
        <div className="row gx-3 gy-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm rounded-3 text-center p-4">
              <h5 className="fw-bold mb-2">Total Quotations</h5>
              <div className="display-5 fw-bold text-primary">
                {quotationCount}
              </div>
              <hr className="my-2 border-danger w-50 mx-auto" />
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card shadow-sm rounded-3 text-center p-4">
              <h5 className="fw-bold mb-2">Orders This Month</h5>
              <div className="display-5 fw-bold text-primary">
                {recentOrders.length}
              </div>
              <hr className="my-2 border-danger w-50 mx-auto" />
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card shadow-sm rounded-3 text-center p-4">
              <h5 className="fw-bold mb-2">Total Products</h5>
              <div className="display-5 fw-bold text-primary">
                {productCount}
              </div>
              <hr className="my-2 border-danger w-50 mx-auto" />
            </div>
          </div>
        </div>

        {/* Main Content - 3 Columns */}
        <div className="row gx-3 gy-3">
          {/* LEFT: Top Selling Products */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm rounded-3 h-100">
              <div className="card-header bg-light fw-semibold">
                Top Selling Products (Quotations + Orders)
              </div>
              <div
                className="card-body p-0 overflow-auto"
                style={{ maxHeight: "520px" }}
              >
                {topProductsLoading ? (
                  <p className="p-4 text-center">Loading top products…</p>
                ) : topProducts.length > 0 ? (
                  <ul className="list-unstyled m-0">
                    {topProducts.slice(0, 10).map((product, idx) => {
                      const imgUrl = getImageUrl(product.images);
                      const sellingPrice = getSellingPrice(product);

                      return (
                        <li
                          key={product.productId}
                          className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom"
                        >
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {imgUrl && (
                              <img
                                src={imgUrl}
                                alt={product.name}
                                className="rounded"
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  objectFit: "cover",
                                }}
                                onError={(e) =>
                                  (e.target.style.display = "none")
                                }
                              />
                            )}
                            <div>
                              <div className="fw-semibold">{product.name}</div>
                              <div className="small text-muted">
                                {product.totalSold}{" "}
                                {product.totalSold === 1 ? "unit" : "units"}{" "}
                                sold
                              </div>
                            </div>
                          </div>
                          <div className="text-end">
                            <button
                              className="btn btn-outline-primary btn-sm"
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
                  <p className="p-4 text-center text-muted">
                    No sales data yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE: Orders This Month */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm rounded-3 h-100">
              <div className="card-header bg-light fw-semibold">
                Orders This Month
              </div>
              <div
                className="card-body p-0 overflow-auto"
                style={{ maxHeight: "520px" }}
              >
                {recentOrders.length > 0 ? (
                  <ul className="list-unstyled m-0">
                    {recentOrders.map((o, i) => (
                      <li
                        key={o.id}
                        className="p-3 border-bottom d-flex justify-content-between align-items-start"
                      >
                        <div className="flex-grow-1">
                          <a
                            href={`/order/${o.id}`}
                            className="fw-semibold text-decoration-none text-dark"
                          >
                            #{o.orderNo}
                            {o.priority && (
                              <span
                                className={`ms-2 badge ${
                                  o.priority === "HIGH"
                                    ? "bg-danger"
                                    : o.priority === "MEDIUM"
                                      ? "bg-warning"
                                      : "bg-success"
                                }`}
                              >
                                {o.priority}
                              </span>
                            )}
                          </a>
                          <div className="mt-1 small text-muted">
                            <i className="bi bi-person me-1"></i>
                            {o.customer?.name ||
                              getCustomerName(o.customerId) ||
                              "Unknown"}
                            <span className="mx-2">•</span>
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                        </div>

                        <div className="position-relative">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-secondary">
                              {o.status}
                            </span>
                            <EditOutlined
                              className="cursor-pointer text-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEdit(o.id);
                              }}
                            />
                          </div>

                          {editingOrderId === o.id && (
                            <div
                              className="position-absolute bg-white shadow border rounded mt-1"
                              style={{
                                right: 0,
                                top: "100%",
                                zIndex: 1000,
                                minWidth: "140px",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {statuses.map((s) => (
                                <button
                                  key={s}
                                  className={`d-block w-100 text-start px-3 py-2 border-0 bg-transparent ${
                                    o.status === s
                                      ? "bg-primary text-white"
                                      : "text-dark hover-bg-light"
                                  }`}
                                  onClick={() => handleStatusChange(o.id, s)}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-center text-muted">
                    No orders this month
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Low in Stock */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm rounded-3 h-100">
              <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
                <span>Low in Stock</span>
                {lowStockProducts.length > 0 && (
                  <span className="badge bg-danger rounded-pill">
                    {lowStockProducts.length}
                  </span>
                )}
              </div>
              <div
                className="card-body p-0 overflow-auto"
                style={{ maxHeight: "520px" }}
              >
                {lowStockProducts.length > 0 ? (
                  <ul className="list-unstyled m-0">
                    {displayedLowStock.map((p) => (
                      <li
                        key={p.productId}
                        onClick={() => handleProductClick(p)}
                        className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom cursor-pointer hover-bg-light"
                      >
                        <div className="fw-medium">{p.name}</div>
                        <div className="text-danger fw-bold">
                          Qty: {p.quantity}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <p className="mb-0">No low stock products</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Modal */}
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

export default NewPageWrapper;
