// src/components/Logs/LogTable.jsx
import React, { useState, useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  Popconfirm,
  message,
  Pagination,
  Typography,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import moment from "moment";
import PageHeader from "../Common/PageHeader";
import {
  useGetLogsQuery,
  useGetLogStatsQuery,
  useDeleteLogMutation,
  useDeleteLogsMutation,
} from "../../api/logApi";
import { useAuth } from "../../context/AuthContext";

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;

const methodColors = {
  GET: "green",
  POST: "blue",
  PUT: "orange",
  DELETE: "red",
  PATCH: "purple",
  OPTIONS: "cyan",
};

const statusColors = {
  2: "success",
  3: "warning",
  4: "error",
  5: "volcano",
};

const LogTable = () => {
  const { auth } = useAuth();
  const currentUser = auth?.user;

  // All hooks are now called unconditionally — Rules of Hooks satisfied
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    method: undefined,
    status: undefined,
    dateRange: [],
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  // Build query parameters
  const queryParams = useMemo(() => {
    const [start, end] = filters.dateRange || [];
    return {
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      method: filters.method,
      status: filters.status,
      startDate: start ? start.toISOString() : undefined,
      endDate: end ? end.toISOString() : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
  }, [filters]);

  const { data, isLoading, refetch } = useGetLogsQuery(queryParams);

  const { data: stats } = useGetLogStatsQuery(
    {
      startDate: filters.dateRange[0]?.toISOString(),
      endDate: filters.dateRange[1]?.toISOString(),
    },
    { skip: !filters.dateRange[0] && !filters.dateRange[1] } // optional optimization
  );

  const [deleteLog] = useDeleteLogMutation();
  const [deleteLogs] = useDeleteLogsMutation();

  const logs = data?.logs || [];
  const pagination = data?.pagination || {};

  const tableData = useMemo(() => {
    return logs.map((log, idx) => ({
      key: log._id,
      ...log,
      index: (filters.page - 1) * filters.limit + idx + 1,
      userDisplay: log.user
        ? `${log.user.name} (${log.user.email})`
        : "Anonymous",
      statusGroup: Math.floor((log.status || 200) / 100),
    }));
  }, [logs, filters.page, filters.limit]);

  const handleExpand = (expanded, record) => {
    setExpandedRowKeys(expanded ? [record.key] : []);
  };

  const handleDelete = async (id) => {
    try {
      await deleteLog(id).unwrap();
      message.success("Log deleted successfully");
      refetch();
    } catch (err) {
      message.error("Failed to delete log");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await deleteLogs({
        search: filters.search || undefined,
        method: filters.method,
        status: filters.status,
        startDate: filters.dateRange[0]?.toISOString(),
        endDate: filters.dateRange[1]?.toISOString(),
      }).unwrap();
      message.success("Filtered logs deleted successfully");
      refetch();
    } catch {
      message.error("Bulk delete failed");
    }
  };

  const exportCSV = () => {
    const headers = [
      "Time",
      "Method",
      "Route",
      "Status",
      "Duration",
      "User",
      "IP",
    ];

    const rows = tableData.map((l) => [
      moment(l.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      l.method,
      l.route,
      l.status || "-",
      l.duration ? `${l.duration}ms` : "-",
      l.userDisplay,
      l.ipAddress || "-",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `api-logs-${moment().format("YYYY-MM-DD_HHmm")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: "#", dataIndex: "index", width: 60, fixed: "left" },
    {
      title: "Time",
      dataIndex: "createdAt",
      render: (t) => moment(t).format("MMM DD HH:mm:ss"),
      width: 140,
    },
    {
      title: "Method",
      dataIndex: "method",
      render: (m) => <Tag color={methodColors[m] || "default"}>{m}</Tag>,
      width: 90,
    },
    {
      title: "Route",
      dataIndex: "route",
      render: (r) => (
        <Text code copyable={{ text: r }}>
          {r}
        </Text>
      ),
    },
    {
      title: "Status",
      render: (_, r) => (
        <Tag color={statusColors[r.statusGroup] || "default"}>
          {r.status || "—"}
        </Tag>
      ),
      width: 90,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      render: (d) => (d ? `${d}ms` : "—"),
      width: 100,
    },
    { title: "User", dataIndex: "userDisplay", width: 220 },
    { title: "IP", dataIndex: "ipAddress", width: 130 },
    // Admin-only Delete Action
    currentUser?.roles?.includes("ADMIN") && {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Delete this log?"
          onConfirm={() => handleDelete(record.key)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="API Monitoring"
          subtitle="Real-time logs & analytics"
        />

        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Requests"
                value={stats?.totalRequests || 0}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Avg Response Time"
                value={stats?.avgDuration || 0}
                suffix="ms"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Error Rate"
                value={stats?.errorRate || 0}
                suffix="%"
                precision={2}
                valueStyle={{
                  color: (stats?.errorRate || 0) > 5 ? "#cf1322" : "#3f8600",
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Today's Logs" value={pagination.total || 0} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {/* Filters & Actions */}
            <Space wrap>
              <Input.Search
                placeholder="Search route, IP, user..."
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 320 }}
                onSearch={(value) =>
                  setFilters((prev) => ({ ...prev, search: value, page: 1 }))
                }
              />

              <Select
                placeholder="Method"
                allowClear
                style={{ width: 120 }}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, method: value, page: 1 }))
                }
              >
                {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                  <Option key={m} value={m}>
                    <Tag color={methodColors[m]}>{m}</Tag>
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Status Code"
                allowClear
                style={{ width: 140 }}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value, page: 1 }))
                }
              >
                <Option value={200}>200 OK</Option>
                <Option value={201}>201 Created</Option>
                <Option value={400}>400 Bad Request</Option>
                <Option value={401}>401 Unauthorized</Option>
                <Option value={403}>403 Forbidden</Option>
                <Option value={404}>404 Not Found</Option>
                <Option value={500}>500 Server Error</Option>
              </Select>

              <RangePicker
                showTime={{ format: "HH:mm" }}
                format="YYYY-MM-DD HH:mm"
                onChange={(dates) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: dates || [],
                    page: 1,
                  }))
                }
              />

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportCSV}
              >
                Export CSV
              </Button>

              {currentUser?.roles?.includes("ADMIN") && (
                <Popconfirm
                  title="Delete all logs matching current filters?"
                  description="This action cannot be undone."
                  onConfirm={handleBulkDelete}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Bulk Delete
                  </Button>
                </Popconfirm>
              )}
            </Space>

            {/* Logs Table */}
            <Table
              columns={columns}
              dataSource={tableData}
              loading={isLoading}
              scroll={{ x: 1400 }}
              pagination={false}
              expandable={{
                expandedRowKeys,
                onExpand: handleExpand,
                expandedRowRender: (record) => (
                  <div style={{ padding: "20px 0" }}>
                    <Row gutter={32}>
                      <Col span={12}>
                        <strong>Request Body:</strong>
                        {record.body ? (
                          <SyntaxHighlighter
                            language="json"
                            style={vscDarkPlus}
                          >
                            {JSON.stringify(record.body, null, 2)}
                          </SyntaxHighlighter>
                        ) : (
                          <Text type="secondary">No body</Text>
                        )}
                      </Col>
                      <Col span={12}>
                        <strong>Query Params:</strong>
                        {record.query ? (
                          <SyntaxHighlighter
                            language="json"
                            style={vscDarkPlus}
                          >
                            {JSON.stringify(record.query, null, 2)}
                          </SyntaxHighlighter>
                        ) : (
                          <Text type="secondary">No query params</Text>
                        )}
                      </Col>
                    </Row>

                    {record.error && (
                      <div style={{ marginTop: 24 }}>
                        <strong style={{ color: "#ff4d4f" }}>
                          Error Stack:
                        </strong>
                        <pre
                          style={{
                            background: "#1e1e1e",
                            color: "#ff6b6b",
                            padding: 16,
                            borderRadius: 6,
                            marginTop: 8,
                            overflowX: "auto",
                            fontSize: 13,
                          }}
                        >
                          {record.error}
                        </pre>
                      </div>
                    )}
                  </div>
                ),
              }}
            />

            {/* Pagination */}
            <Pagination
              style={{ textAlign: "right", marginTop: 16 }}
              current={filters.page}
              pageSize={filters.limit}
              total={pagination.total || 0}
              showSizeChanger
              showQuickJumper
              pageSizeOptions={["10", "20", "50", "100"]}
              onChange={(page, pageSize) =>
                setFilters((prev) => ({
                  ...prev,
                  page,
                  limit: pageSize || prev.limit,
                }))
              }
            />
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default LogTable;
