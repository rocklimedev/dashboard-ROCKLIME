import React, { useState, useMemo } from "react";
import {
  Button,
  Tag,
  Empty,
  Pagination,
  Spin,
  Select,
  Input,
  DatePicker,
  Table,
  Tooltip,
  Typography,
  Row,
  Col,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import { useGetAllActivitiesQuery } from "../../api/activityApi";
import ActivityLogDetailModal from "../../components/modals/ActivityLogDetailModal";
const { RangePicker } = DatePicker;
const { Text } = Typography;

/* -------------------- CONFIG -------------------- */

const severityColors = {
  info: "green",
  warning: "orange",
  critical: "red",
  error: "red",
};

const contextTagColors = {
  AUTH: "blue",
  SALES: "green",
  CRM: "gold",
  CATALOG: "purple",
  INVENTORY: "cyan",
  PROCUREMENT: "orange",
  SYSTEM: "default",
};

const actionColors = {
  CREATE: "green",
  UPDATE: "orange",
  DELETE: "red",
  OTHER: "blue",
};

/* -------------------- HELPERS -------------------- */

const getActionType = (action = "") => {
  if (action.includes("CREATE") || action.includes("CLONE")) return "CREATE";
  if (action.includes("UPDATE") || action.includes("STATUS")) return "UPDATE";
  if (action.includes("DELETE")) return "DELETE";
  return "OTHER";
};

const normalizeLogs = (activities = []) =>
  activities.map((log) => {
    const date = new Date(log.createdAt);
    return {
      ...log,
      date,
      dateLabel: date.toDateString(),
      time: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      userName: log.user?.name || "System",
      userEmail: log.user?.email,
      module: `${log.contextTag}/${log.subContext}`,
      actionType: getActionType(log.action),
    };
  });

/* -------------------- FILTER HELPERS -------------------- */

const applyFilters = (logs, filters) =>
  logs.filter((log) => {
    if (filters.contextTag && log.contextTag !== filters.contextTag)
      return false;
    if (filters.subContext && log.subContext !== filters.subContext)
      return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.severity && log.severity !== filters.severity) return false;
    if (filters.user && log.userName !== filters.user) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = [
        log.description,
        log.entityName,
        log.action,
        log.userName,
        log.userEmail,
        log.ipAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
      const ts = new Date(log.createdAt);
      const from = filters.dateRange[0].startOf("day").toDate();
      const to = filters.dateRange[1].endOf("day").toDate();
      if (ts < from || ts > to) return false;
    }
    return true;
  });

const uniqueOpts = (logs, key) =>
  [...new Set(logs.map((l) => l[key]).filter(Boolean))]
    .sort()
    .map((v) => ({ label: v, value: v }));

const EMPTY_FILTERS = {
  contextTag: null,
  subContext: null,
  action: null,
  severity: null,
  user: null,
  search: "",
  dateRange: null,
};

/* -------------------- MAIN COMPONENT -------------------- */

const ActivityLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null); // replaces expandedKey
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  const { data, isLoading } = useGetAllActivitiesQuery({
    page: currentPage,
    limit: 20,
  });

  const normalizedActivities = useMemo(
    () => normalizeLogs(data?.activities || []),
    [data],
  );

  const ctxOptions = useMemo(
    () => uniqueOpts(normalizedActivities, "contextTag"),
    [normalizedActivities],
  );
  const subOptions = useMemo(
    () => uniqueOpts(normalizedActivities, "subContext"),
    [normalizedActivities],
  );
  const actionOptions = useMemo(
    () => uniqueOpts(normalizedActivities, "action"),
    [normalizedActivities],
  );
  const userOptions = useMemo(
    () => uniqueOpts(normalizedActivities, "userName"),
    [normalizedActivities],
  );

  const filteredLogs = useMemo(
    () => applyFilters(normalizedActivities, filters),
    [normalizedActivities, filters],
  );

  const total = data?.total || 0;

  /* -------------------- TABLE COLUMNS -------------------- */

  const tableColumns = [
    {
      title: "Time / IP",
      key: "timeIp",
      width: 180,
      render: (_, row) => (
        <div>
          <Text style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            {row.dateLabel}
            <br />
            <span style={{ color: "#999" }}>{row.time}</span>
          </Text>
          <br />
          <Text
            copyable={!!row.ipAddress}
            style={{ fontSize: 11, fontFamily: "monospace", color: "#666" }}
          >
            {row.ipAddress || "—"}
          </Text>
        </div>
      ),
    },
    {
      title: "User",
      key: "user",
      width: 150,
      render: (_, row) => (
        <div>
          <Text strong style={{ fontSize: 13, display: "block" }}>
            {row.userName}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {row.userEmail || ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Context / Sub-context",
      key: "contextSubcontext",
      width: 220,
      render: (_, record) => (
        <Tag color={contextTagColors[record.contextTag] || "default"}>
          {record.contextTag}
          {record.subContext ? ` / ${record.subContext}` : ""}
        </Tag>
      ),
    },
    {
      title: "Action / Severity",
      key: "actionSeverity",
      width: 220,
      render: (_, row) => (
        <Tag color={actionColors[row.actionType] || "blue"}>
          {row.action} / {(row.severity || "info").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Entity / Description",
      key: "entityDescription",
      ellipsis: true,
      render: (_, record) => (
        <Tooltip
          title={
            <>
              <div>{record.entityName || "—"}</div>
              <div>{record.description || "—"}</div>
            </>
          }
        >
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {record.entityName || "—"}
            </Text>
            {record.description && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.description}
                </Text>
              </>
            )}
          </div>
        </Tooltip>
      ),
    },
  ];

  /* -------------------- RENDER -------------------- */

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="card mb-3">
          <div className="card-body d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Activity Logs</h4>
            <span className="badge bg-primary">Total Events: {total}</span>
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────── */}
        <div className="card mb-3">
          <div className="card-body">
            <Row gutter={[10, 10]} align="middle">
              <Col xs={24} sm={24} md={6}>
                <Input
                  prefix={<SearchOutlined style={{ color: "#bbb" }} />}
                  placeholder="Search description, entity, IP…"
                  value={filters.search}
                  onChange={(e) => setFilter("search", e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={12} sm={8} md={3}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Context"
                  value={filters.contextTag}
                  onChange={(v) => setFilter("contextTag", v)}
                  allowClear
                  options={ctxOptions}
                />
              </Col>
              <Col xs={12} sm={8} md={3}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Sub-context"
                  value={filters.subContext}
                  onChange={(v) => setFilter("subContext", v)}
                  allowClear
                  options={subOptions}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Action"
                  value={filters.action}
                  onChange={(v) => setFilter("action", v)}
                  allowClear
                  showSearch
                  options={actionOptions}
                />
              </Col>
              <Col xs={12} sm={8} md={3}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="User"
                  value={filters.user}
                  onChange={(v) => setFilter("user", v)}
                  allowClear
                  options={userOptions}
                />
              </Col>
              <Col xs={12} sm={8} md={2}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Severity"
                  value={filters.severity}
                  onChange={(v) => setFilter("severity", v)}
                  allowClear
                  options={[
                    { label: "Info", value: "info" },
                    { label: "Warning", value: "warning" },
                    { label: "Error", value: "error" },
                    { label: "Critical", value: "critical" },
                  ]}
                />
              </Col>
              <Col xs={24} sm={16} md={5}>
                <RangePicker
                  style={{ width: "100%" }}
                  value={filters.dateRange}
                  onChange={(v) => setFilter("dateRange", v)}
                  format="DD/MM/YYYY"
                />
              </Col>
              <Col xs={24} sm={8} md={2}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                  style={{ width: "100%" }}
                >
                  Reset
                </Button>
              </Col>
            </Row>

            {/* ── Active filter chips ────────── */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                alignItems: "center",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                <FilterOutlined /> Showing{" "}
                <strong>{filteredLogs.length}</strong> of{" "}
                <strong>{normalizedActivities.length}</strong> on this page
              </Text>
              {filters.contextTag && (
                <Tag
                  closable
                  color={contextTagColors[filters.contextTag] || "default"}
                  onClose={() => setFilter("contextTag", null)}
                >
                  {filters.contextTag}
                </Tag>
              )}
              {filters.subContext && (
                <Tag closable onClose={() => setFilter("subContext", null)}>
                  {filters.subContext}
                </Tag>
              )}
              {filters.action && (
                <Tag
                  closable
                  color={actionColors[getActionType(filters.action)]}
                  onClose={() => setFilter("action", null)}
                >
                  {filters.action}
                </Tag>
              )}
              {filters.user && (
                <Tag closable onClose={() => setFilter("user", null)}>
                  {filters.user}
                </Tag>
              )}
              {filters.severity && (
                <Tag
                  closable
                  color={severityColors[filters.severity] || "blue"}
                  onClose={() => setFilter("severity", null)}
                >
                  {filters.severity.toUpperCase()}
                </Tag>
              )}
              {filters.search && (
                <Tag closable onClose={() => setFilter("search", "")}>
                  "{filters.search}"
                </Tag>
              )}
              {filters.dateRange?.[0] && (
                <Tag closable onClose={() => setFilter("dateRange", null)}>
                  {filters.dateRange[0].format("DD/MM/YY")} →{" "}
                  {filters.dateRange[1].format("DD/MM/YY")}
                </Tag>
              )}
            </div>
          </div>
        </div>

        {/* ── TABLE ──────────────────────────────────────────── */}
        <div className="card">
          <div className="card-body">
            {isLoading ? (
              <div className="text-center p-5">
                <Spin size="large" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <Empty
                description="No activity logs match the current filters"
                style={{ padding: "40px 0" }}
              >
                <Button onClick={resetFilters}>Clear filters</Button>
              </Empty>
            ) : (
              <Table
                columns={tableColumns}
                dataSource={filteredLogs}
                rowKey="id"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => setSelectedLog(record),
                  style: {
                    cursor: "pointer",
                  },
                })}
              />
            )}
          </div>

          {/* ── PAGINATION ─────────────────────────────────── */}
          <div className="d-flex justify-content-end p-3">
            <Pagination
              current={currentPage}
              pageSize={20}
              total={total}
              showSizeChanger={false}
              onChange={(page) => {
                setCurrentPage(page);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL ───────────────────────────────────── */}
      <ActivityLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};

export default ActivityLogsPage;
