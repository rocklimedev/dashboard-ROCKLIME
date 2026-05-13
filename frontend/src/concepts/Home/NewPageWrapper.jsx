import React, { useMemo, useState } from "react";
import { message } from "antd";
import {
  useGetProductCountQuery,
  useGetLowStockProductsQuery,
} from "../../api/productApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useUpdateOrderStatusMutation } from "../../api/orderApi";

import "./pagewrapper.css";
import { EditOutlined } from "@ant-design/icons";
import { Dropdown, Menu } from "antd";
import { useAuth } from "../../context/AuthContext";
import StockModal from "../../components/modals/StockModal";

const NewPageWrapper = () => {
  /* ------------------------------------------------------------------ */
  /*  STATE & MODALS                                                    */
  /* ------------------------------------------------------------------ */
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
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
  const { auth } = useAuth();
  const canUpdateOrderStatus =
    auth?.permissions?.some(
      (p) => p.module === "orders" && p.action === "write",
    ) ?? true;

  const handleProductClick = (p) => {
    setSelectedProductForStock(p);
    setStockModalOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /*  RTK-QUERY HOOKS - OPTIMIZED                                       */
  /* ------------------------------------------------------------------ */
  const [addProductToCart] = useAddProductToCartMutation();
  const { data: profile } = useGetProfileQuery();
  const userId = profile?.user?.userId;

  // Optimized Dashboard Queries
  const { data: countData } = useGetProductCountQuery();
  const { data: lowStockData, isLoading: lowStockLoading } =
    useGetLowStockProductsQuery({
      threshold: 20,
      limit: 20,
    });

  const { data: ordersResponse, refetch: refetchOrders } = useGetAllOrdersQuery(
    { limit: 50, page: 1 },
    { pollingInterval: 30000 },
  );

  const { data: quotationsResponse } = useGetAllQuotationsQuery({
    limit: 200,
    page: 1,
  });

  const { data: customersResponse } = useGetCustomersQuery({ limit: 1000 });

  /* ------------------------------------------------------------------ */
  /*  DATA PROCESSING                                                   */
  /* ------------------------------------------------------------------ */
  const productCount = countData?.totalProducts || 0;
  const lowStockProducts = lowStockData?.products || [];

  const quotations = quotationsResponse?.data || [];
  const customersData = customersResponse?.data || [];

  const THIRTY_DAYS_AGO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const recentOrders = useMemo(() => {
    const allOrders = ordersResponse?.data || [];
    return allOrders.filter(
      (order) => new Date(order.createdAt) >= THIRTY_DAYS_AGO,
    );
  }, [ordersResponse, THIRTY_DAYS_AGO]);

  const lastFiveQuotations = useMemo(() => {
    return [...quotations]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [quotations]);

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
  /*  HANDLERS                                                          */
  /* ------------------------------------------------------------------ */
  const handleAddToCart = async (product) => {
    if (!userId) return message.error("User not logged in!");

    const price =
      product.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
      product.metaDetails?.find(
        (d) => d.id === "9ba862ef-f993-4873-95ef-1fef10036aa5",
      )?.value;

    if (!price) return message.error("Invalid price");

    setCartLoadingStates((s) => ({ ...s, [product.productId]: true }));

    try {
      await addProductToCart({
        userId,
        productId: product.productId,
        quantity: 1,
      }).unwrap();
      message.success("Added to cart");
    } catch (e) {
      message.error(e?.data?.message || "Add to cart failed");
    } finally {
      setCartLoadingStates((s) => ({ ...s, [product.productId]: false }));
    }
  };

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
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Top Statistics Row */}
        <div className="row gx-3 gy-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="dashboard-stat-card">
              <div className="stat-header">
                <span className="stat-icon">
                  <i className="bi bi-receipt"></i>
                </span>
                <span className="stat-number">
                  {quotationsResponse?.pagination?.total || quotations.length}
                </span>
              </div>
              <div className="stat-label">Total Quotations</div>
              <div className="stat-line"></div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="dashboard-stat-card">
              <div className="stat-header">
                <span className="stat-icon">
                  <i className="bi bi-bag-check"></i>
                </span>
                <span className="stat-number">
                  {ordersResponse?.pagination?.total || recentOrders.length}
                </span>
              </div>
              <div className="stat-label">Total Orders</div>
              <div className="stat-line"></div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="dashboard-stat-card">
              <div className="stat-header">
                <span className="stat-icon">
                  <i className="bi bi-box-seam"></i>
                </span>
                <span className="stat-number">{productCount}</span>
              </div>
              <div className="stat-label">Total Products</div>
              <div className="stat-line"></div>
            </div>
          </div>
        </div>

        {/* Main Content - 3 Columns */}
        <div className="row gx-3 gy-3">
          {/* LEFT: Recent Quotations */}
          <div className="col-12 col-lg-4">
            <div className="card-header bg-light fw-semibold">
              RECENT QUOTATIONS{" "}
              <span className="text-danger fw-semibold">
                ({lastFiveQuotations.length})
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
                            {new Date(q.due_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="amount">
                          ₹
                          {parseFloat(q.finalAmount || 0).toLocaleString(
                            "en-IN",
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
                                className="ms-2 badge"
                                style={{
                                  backgroundColor: "#e31e24",
                                  color: "#fff",
                                }}
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
                            <span
                              className="badge"
                              style={{
                                backgroundColor: "#e31e24",
                                color: "#fff",
                                minWidth: "110px",
                                textAlign: "center",
                              }}
                            >
                              {o.status.replace("_", " ")}
                            </span>

                            {canUpdateOrderStatus && (
                              <Dropdown
                                trigger={["click"]}
                                placement="bottomRight"
                                overlay={
                                  <Menu>
                                    {statuses.map((s) => (
                                      <Menu.Item
                                        key={s}
                                        onClick={() =>
                                          handleStatusChange(o.id, s)
                                        }
                                        disabled={o.status === s}
                                        className={
                                          o.status === s
                                            ? "bg-primary text-white"
                                            : ""
                                        }
                                      >
                                        {s.replace("_", " ")}
                                      </Menu.Item>
                                    ))}
                                  </Menu>
                                }
                              >
                                <EditOutlined
                                  className="cursor-pointer text-primary"
                                  style={{ fontSize: "16px" }}
                                />
                              </Dropdown>
                            )}
                          </div>
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

          {/* RIGHT: Low in Stock - OPTIMIZED */}
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
                    {lowStockProducts.map((p) => (
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
                    <p className="mb-0">
                      {lowStockLoading ? "Loading..." : "No low stock products"}
                    </p>
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
