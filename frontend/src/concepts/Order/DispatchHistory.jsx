import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Empty,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
} from "antd";
import {
  ClearOutlined,
  EyeOutlined,
  SearchOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";

import PageHeader from "../../components/Common/PageHeader";
import { useGetAllDispatchHistoryQuery } from "../../api/orderApi";

const { Option } = Select;
const { RangePicker } = DatePicker;

const DispatchHistory = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    product: "",
    status: "",
    carrier: "",
    trackingNumber: "",
    orderNo: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: search.trim(),
        page: 1,
      }));
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useGetAllDispatchHistoryQuery(filters);

  const dispatches = response?.data || [];

  const pagination = response?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  const handleProductSearch = (value) => {
    setFilters((prev) => ({
      ...prev,
      product: value,
      page: 1,
    }));
  };

  const handleStatusChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      status: value || "",
      page: 1,
    }));
  };

  const handleCarrierChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      carrier: value,
      page: 1,
    }));
  };

  const handleTrackingChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      trackingNumber: value,
      page: 1,
    }));
  };

  const handleOrderNoChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      orderNo: value,
      page: 1,
    }));
  };

  const handleDateChange = (dates) => {
    setFilters((prev) => ({
      ...prev,
      dateFrom: dates?.[0] ? dates[0].format("YYYY-MM-DD") : "",
      dateTo: dates?.[1] ? dates[1].format("YYYY-MM-DD") : "",
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearch("");

    setFilters({
      search: "",
      product: "",
      status: "",
      carrier: "",
      trackingNumber: "",
      orderNo: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
      limit: 20,
    });
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const renderItems = (items = []) => {
    if (!items.length) {
      return <span className="text-muted">—</span>;
    }

    return (
      <div>
        {items.slice(0, 2).map((item, index) => (
          <div key={`${item.productId}-${index}`} className="mb-1">
            <div className="fw-semibold">{item.name || "Unnamed Product"}</div>

            <div className="small text-muted">
              {item.productCode || "No Code"} · Qty {item.quantity}
            </div>
          </div>
        ))}

        {items.length > 2 && (
          <Tooltip
            title={
              <div>
                {items.slice(2).map((item, index) => (
                  <div key={index}>
                    {item.name} × {item.quantity}
                  </div>
                ))}
              </div>
            }
          >
            <Tag>+{items.length - 2} more</Tag>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Dispatch History"
          subtitle="Global dispatch register"
          onAdd={() => navigate("/orders")}
        />

        <div className="card">
          <div className="card-body">
            {/* FILTERS */}

            <div className="row g-3 mb-4">
              <div className="col-12 col-lg-5">
                <Input
                  size="large"
                  prefix={<SearchOutlined />}
                  placeholder="Search order, product, code, carrier, tracking..."
                  value={search}
                  allowClear
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="col-12 col-lg-3">
                <Input
                  size="large"
                  placeholder="Product name / code"
                  value={filters.product}
                  allowClear
                  onChange={(e) => handleProductSearch(e.target.value)}
                />
              </div>

              <div className="col-12 col-lg-2">
                <Select
                  size="large"
                  className="w-100"
                  placeholder="Status"
                  value={filters.status || undefined}
                  allowClear
                  onChange={handleStatusChange}
                >
                  <Option value="DISPATCHED">Dispatched</Option>

                  <Option value="DELIVERED">Delivered</Option>

                  <Option value="RETURNED">Returned</Option>
                </Select>
              </div>

              <div className="col-12 col-lg-2">
                <RangePicker
                  size="large"
                  className="w-100"
                  onChange={handleDateChange}
                />
              </div>

              <div className="col-12 col-md-4">
                <Input
                  size="large"
                  placeholder="Order number"
                  value={filters.orderNo}
                  allowClear
                  onChange={(e) => handleOrderNoChange(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <Input
                  size="large"
                  placeholder="Carrier"
                  value={filters.carrier}
                  allowClear
                  onChange={(e) => handleCarrierChange(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <Input
                  size="large"
                  placeholder="Tracking number"
                  value={filters.trackingNumber}
                  allowClear
                  onChange={(e) => handleTrackingChange(e.target.value)}
                />
              </div>

              <div className="col-12">
                <Space>
                  <Button icon={<ClearOutlined />} onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </Space>
              </div>
            </div>

            {/* SUMMARY */}

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <strong>{pagination.total}</strong> dispatch records
              </div>

              {isFetching && (
                <span className="text-muted small">Updating...</span>
              )}
            </div>

            {/* TABLE */}

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : error ? (
              <div className="alert alert-danger">
                {error?.data?.message || "Failed to load dispatch history"}
              </div>
            ) : dispatches.length === 0 ? (
              <Empty description="No dispatch history found" />
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>S.No.</th>
                        <th>DISPATCH</th>
                        <th>ORDER</th>
                        <th>PRODUCTS</th>
                        <th>QTY</th>
                        <th>AMOUNT</th>
                        <th>DATE</th>
                        <th>CARRIER</th>
                        <th>TRACKING</th>
                        <th>DISPATCHED BY</th>
                        <th>STATUS</th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {dispatches.map((dispatch, index) => {
                        const serial =
                          (pagination.page - 1) * pagination.limit + index + 1;

                        return (
                          <tr key={dispatch.id}>
                            <td>{serial}</td>

                            <td>
                              <div className="fw-semibold">
                                #{dispatch.dispatchNumber}
                              </div>

                              <div className="small text-muted">
                                {dispatch.id?.slice(0, 8)}
                              </div>
                            </td>

                            <td>
                              {dispatch.orderId ? (
                                <Link
                                  to={`/order/${dispatch.orderId}`}
                                  className="fw-semibold"
                                >
                                  {dispatch.orderNo}
                                </Link>
                              ) : (
                                dispatch.orderNo || "—"
                              )}
                            </td>

                            <td
                              style={{
                                minWidth: 240,
                              }}
                            >
                              {renderItems(dispatch.items)}
                            </td>

                            <td>
                              <strong>{dispatch.totalQuantity}</strong>
                            </td>

                            <td>
                              ₹
                              {Number(dispatch.totalAmount || 0).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </td>

                            <td>
                              {dispatch.dispatchDate
                                ? moment(dispatch.dispatchDate).format(
                                    "DD MMM YYYY",
                                  )
                                : "—"}

                              <div className="small text-muted">
                                {dispatch.dispatchDate
                                  ? moment(dispatch.dispatchDate).format(
                                      "hh:mm A",
                                    )
                                  : ""}
                              </div>
                            </td>

                            <td>{dispatch.carrier || "—"}</td>

                            <td>
                              {dispatch.trackingNumber ? (
                                <span className="text-break">
                                  {dispatch.trackingNumber}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td>
                              {dispatch.dispatcher?.name ||
                                dispatch.dispatcher?.username ||
                                "—"}
                            </td>

                            <td>
                              <Tag
                                color={
                                  dispatch.status === "DELIVERED"
                                    ? "green"
                                    : dispatch.status === "RETURNED"
                                      ? "red"
                                      : "blue"
                                }
                              >
                                {dispatch.status}
                              </Tag>
                            </td>

                            <td>
                              <Tooltip title="View Order">
                                <Link to={`/order/${dispatch.orderId}`}>
                                  <Button type="text" icon={<EyeOutlined />} />
                                </Link>
                              </Tooltip>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>

                    <Button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchHistory;
