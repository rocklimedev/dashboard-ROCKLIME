import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import {
  Input,
  Select,
  DatePicker,
  Button,
  Pagination,
  Table,
  message,
} from "antd";
import moment from "moment";
import PageHeader from "../Common/PageHeader";
import {
  useGetLogsQuery,
  useGetLogByIdQuery,
  useDeleteLogMutation,
  useDeleteLogsMutation,
  useGetLogStatsQuery,
} from "../../api/logApi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const { RangePicker } = DatePicker;

const LogTable = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  // Define all hooks at the top level, unconditionally
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    method: "",
    route: "",
    user: "",
    startDate: null,
    endDate: null,
    sortBy: "Recently Added",
  });

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [showStats, setShowStats] = useState(false);

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      method: filters.method,
      route: filters.route,
      user: filters.user,
      startDate: filters.startDate,
      endDate: filters.endDate,
      sortBy: filters.sortBy === "Recently Added" ? "createdAt" : "route",
      sortOrder:
        filters.sortBy === "Recently Added"
          ? "desc"
          : filters.sortBy === "Ascending"
          ? "asc"
          : "desc",
    }),
    [
      filters.page,
      filters.limit,
      filters.method,
      filters.route,
      filters.user,
      filters.startDate,
      filters.endDate,
      filters.sortBy,
    ]
  );

  const { data, isLoading, error, refetch } = useGetLogsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    skip: !auth?.token,
  });

  const { data: stats, isLoading: isStatsLoading } = useGetLogStatsQuery(
    { startDate: filters.startDate, endDate: filters.endDate },
    { skip: !showStats || !auth?.token }
  );

  const [deleteLog] = useDeleteLogMutation();
  const [deleteLogs] = useDeleteLogsMutation();

  const logs = Array.isArray(data?.logs) ? data.logs : [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  const formattedLogs = useMemo(() => {
    return logs.map((log) => ({
      key: log._id, // Used by Ant Design Table for row identification
      id: log._id,
      method: log.method,
      route: log.route,
      user: log.user
        ? `${log.user?.name || "Unknown"} (${log.user?.email || "Unknown"})`
        : "Anonymous",
      status: log.status || "-",
      duration: log.duration ? `${log.duration} ms` : "-",
      createdAt: moment(log.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      ipAddress: log.ipAddress || "-",
      body: log.body ? JSON.stringify(log.body) : "-",
      query: log.query ? JSON.stringify(log.query) : "-",
      error: log.error || "-",
      rawLog: log, // Store raw log for expandable content
    }));
  }, [logs]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  }, []);

  const handleDateRangeChange = useCallback((dates) => {
    const newStartDate = dates ? moment(dates[0]) : null;
    const newEndDate = dates ? moment(dates[1]) : null;
    setFilters((prev) => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate,
      page: 1,
    }));
  }, []);

  const handleSearch = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePageChange = useCallback((page, pageSize) => {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10,
      method: "",
      route: "",
      user: "",
      startDate: null,
      endDate: null,
      sortBy: "Recently Added",
    });
    setExpandedRowKeys([]);
    refetch();
  }, [refetch]);

  const handleExpand = useCallback((expanded, record) => {
    setExpandedRowKeys(expanded ? [record.key] : []);
  }, []);

  const handleDeleteLog = useCallback(
    async (logId) => {
      try {
        await deleteLog(logId).unwrap();
        message.success("Log deleted successfully");
        setExpandedRowKeys([]); // Collapse any expanded row
        refetch();
      } catch (error) {
        message.error(
          "Failed to delete log: " + (error.data?.message || "Unknown error")
        );
      }
    },
    [deleteLog, refetch]
  );

  const handleBulkDelete = useCallback(async () => {
    try {
      await deleteLogs({
        method: filters.method,
        route: filters.route,
        user: filters.user,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }).unwrap();
      message.success("Logs deleted successfully");
      setExpandedRowKeys([]); // Collapse any expanded row
      refetch();
    } catch (error) {
      message.error(
        "Failed to delete logs: " + (error.data?.message || "Unknown error")
      );
    }
  }, [deleteLogs, filters, refetch]);

  const handleToggleStats = useCallback(() => {
    setShowStats((prev) => !prev);
  }, []);

  // Handle authentication errors (e.g., 401/403)
  useEffect(() => {
    if (error && (error.status === 401 || error.status === 403)) {
      logout();
      navigate("/login");
    }
  }, [error, logout, navigate]);

  // Early return after all hooks
  if (!auth?.token) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error fetching logs:{" "}
              {error.data?.message || JSON.stringify(error)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Table columns
  const columns = [
    {
      title: "S.No.",
      render: (_, __, index) => (filters.page - 1) * filters.limit + index + 1,
      width: 80,
    },
    { title: "Method", dataIndex: "method", key: "method", width: 100 },
    {
      title: "Route",
      dataIndex: "route",
      key: "route",
      render: (text) => <span>{text}</span>, // Removed Button, as expansion handles details
    },
    { title: "User", dataIndex: "user", key: "user" },
    { title: "Status", dataIndex: "status", key: "status", width: 100 },
    { title: "Duration", dataIndex: "duration", key: "duration", width: 120 },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
    },
    { title: "IP Address", dataIndex: "ipAddress", key: "ipAddress" },
    { title: "Body", dataIndex: "body", key: "body" },
    { title: "Query", dataIndex: "query", key: "query" },
    { title: "Error", dataIndex: "error", key: "error" },
    auth.user?.roles?.includes("ADMIN") && {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button size="small" danger onClick={() => handleDeleteLog(record.id)}>
          Delete
        </Button>
      ),
      width: 100,
    },
  ].filter(Boolean); // Remove falsy entries (e.g., if not admin)

  // Expandable row render
  const expandableConfig = {
    expandedRowKeys,
    onExpand: handleExpand,
    expandedRowRender: (record) => (
      <div style={{ padding: 16, background: "#fafafa" }}>
        <p>
          <strong>ID:</strong> {record.id}
        </p>
        <p>
          <strong>Method:</strong> {record.method}
        </p>
        <p>
          <strong>Route:</strong> {record.route}
        </p>
        <p>
          <strong>User:</strong> {record.user}
        </p>
        <p>
          <strong>Status:</strong> {record.status}
        </p>
        <p>
          <strong>Duration:</strong> {record.duration}
        </p>
        <p>
          <strong>Created At:</strong> {record.createdAt}
        </p>
        <p>
          <strong>IP Address:</strong> {record.ipAddress}
        </p>
        <p>
          <strong>Body:</strong> {record.body}
        </p>
        <p>
          <strong>Query:</strong> {record.query}
        </p>
        <p>
          <strong>Error:</strong> {record.error}
        </p>
      </div>
    ),
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="API Logs"
            subtitle="View API request logs"
            tableData={formattedLogs}
          />
          <div className="card-body">
            <div className="row">
              <div className="col-lg-12">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <div className="input-icon-start position-relative">
                    <span className="input-icon-addon">
                      <FaSearch />
                    </span>
                    <Input
                      className="form-control"
                      placeholder="Search by Route"
                      value={filters.route}
                      onChange={(e) =>
                        handleFilterChange("route", e.target.value)
                      }
                      aria-label="Search logs"
                    />
                  </div>
                  <Select
                    style={{ width: 120, marginLeft: 10 }}
                    placeholder="Select Method"
                    allowClear
                    onChange={(value) => handleFilterChange("method", value)}
                    value={filters.method}
                  >
                    <Option value="GET">GET</Option>
                    <Option value="POST">POST</Option>
                    <Option value="PUT">PUT</Option>
                    <Option value="DELETE">DELETE</Option>
                    <Option value="PATCH">PATCH</Option>
                    <Option value="OPTIONS">OPTIONS</Option>
                  </Select>
                  <Input
                    style={{ width: 200, marginLeft: 10 }}
                    placeholder="Filter by User ID"
                    value={filters.user}
                    onChange={(e) => handleFilterChange("user", e.target.value)}
                  />
                  <RangePicker
                    style={{ marginLeft: 10 }}
                    onChange={handleDateRangeChange}
                    value={[filters.startDate, filters.endDate]}
                  />
                  <Select
                    style={{ width: 150, marginLeft: 10 }}
                    value={filters.sortBy}
                    onChange={(value) => handleFilterChange("sortBy", value)}
                  >
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Ascending">Route (A-Z)</Option>
                    <Option value="Descending">Route (Z-A)</Option>
                  </Select>
                  <Button
                    type="primary"
                    style={{ marginLeft: 10 }}
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                  <Button style={{ marginLeft: 10 }} onClick={clearFilters}>
                    Clear
                  </Button>
                  {auth.user?.roles?.includes("ADMIN") && (
                    <>
                      <Button
                        type="default"
                        style={{ marginLeft: 10 }}
                        onClick={handleBulkDelete}
                      >
                        Bulk Delete
                      </Button>
                      <Button
                        type="default"
                        style={{ marginLeft: 10 }}
                        onClick={handleToggleStats}
                      >
                        {showStats ? "Hide Stats" : "Show Stats"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {showStats && (
              <div className="stats-section mb-4">
                <h3>Log Statistics</h3>
                {isStatsLoading ? (
                  <p>Loading stats...</p>
                ) : (
                  <div>
                    <p>Total Requests: {stats?.totalRequests || 0}</p>
                    <p>Average Duration: {stats?.avgDuration || 0} ms</p>
                    <p>
                      Method Breakdown:{" "}
                      {JSON.stringify(stats?.methodBreakdown || {})}
                    </p>
                    <p>
                      Status Breakdown:{" "}
                      {JSON.stringify(stats?.statusBreakdown || {})}
                    </p>
                  </div>
                )}
              </div>
            )}
            <Table
              columns={columns}
              dataSource={formattedLogs}
              pagination={false} // Handled separately below
              expandable={expandableConfig}
              rowKey="key"
              className="table-responsive"
            />
            {pagination.total > pagination.limit && (
              <div className="pagination-section mt-4">
                <Pagination
                  current={filters.page}
                  pageSize={filters.limit}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  pageSizeOptions={["10", "20", "50", "100"]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogTable;
