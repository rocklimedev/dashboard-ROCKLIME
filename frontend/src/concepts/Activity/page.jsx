import React, { useState, useMemo } from "react";
import { Button, Tag, Empty, Pagination, Spin } from "antd";
import { EyeOutlined } from "@ant-design/icons";

import { useGetAllActivitiesQuery } from "../../api/activityApi";

/* -------------------- CONFIG -------------------- */

const severityColors = {
  info: "green",
  warning: "orange",
  critical: "red",
};

/* -------------------- HELPERS -------------------- */

const getActionType = (action = "") => {
  if (action.includes("CREATE")) return "CREATE";
  if (action.includes("UPDATE") || action.includes("STATUS")) return "UPDATE";
  if (action.includes("DELETE")) return "DELETE";
  if (action.includes("CLONE")) return "CREATE";
  return "OTHER";
};

const actionColors = {
  CREATE: "green",
  UPDATE: "orange",
  DELETE: "red",
  OTHER: "blue",
};

const normalizeLogs = (activities = []) => {
  return activities.map((log) => {
    const date = new Date(log.createdAt);

    return {
      ...log,
      date,
      dateLabel: date.toDateString(),
      time: date.toLocaleTimeString(),
      userName: log.user?.name || "System",
      userEmail: log.user?.email,
      module: `${log.contextTag}/${log.subContext}`,
      actionType: getActionType(log.action),
    };
  });
};

const groupByDate = (logs = []) => {
  return logs.reduce((acc, log) => {
    const key = log.dateLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});
};

/* -------------------- COMPONENT -------------------- */

const ActivityLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedKey, setExpandedKey] = useState(null);

  const { data, isLoading } = useGetAllActivitiesQuery({
    page: currentPage,
    limit: 20,
  });

  const normalizedActivities = useMemo(() => {
    return normalizeLogs(data?.activities || []);
  }, [data]);

  const grouped = useMemo(() => {
    return groupByDate(normalizedActivities);
  }, [normalizedActivities]);

  const total = data?.total || 0;

  /* -------------------- RENDER HELPERS -------------------- */

  const renderSeverity = (severity) => (
    <Tag color={severityColors[severity] || "blue"}>
      {(severity || "info").toUpperCase()}
    </Tag>
  );

  const renderAction = (action, type) => (
    <Tag color={actionColors[type] || "blue"}>{action}</Tag>
  );

  const renderMetadata = (metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
      <div style={{ marginTop: 10 }}>
        <strong>Metadata</strong>
        <ul style={{ paddingLeft: 16, margin: 5 }}>
          {Object.entries(metadata).map(([key, value]) => (
            <li key={key}>
              <b>{key}:</b>{" "}
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderChanges = (oldValues, newValues) => {
    if (!oldValues && !newValues) return null;

    const keys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    return (
      <div style={{ marginTop: 10 }}>
        <strong>Changes</strong>
        <table style={{ fontSize: 12, width: "100%", marginTop: 5 }}>
          <tbody>
            {[...keys].map((key) => (
              <tr key={key}>
                <td style={{ fontWeight: 600, paddingRight: 10 }}>{key}</td>
                <td style={{ color: "#d33" }}>
                  {JSON.stringify(oldValues?.[key] ?? "-")}
                </td>
                <td style={{ color: "#2a7" }}>
                  {JSON.stringify(newValues?.[key] ?? "-")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /* -------------------- UI -------------------- */

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* HEADER */}
        <div className="card mb-3">
          <div className="card-body d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Activity Feed</h4>
            <span className="badge bg-primary">Total Events: {total}</span>
          </div>
        </div>

        {/* FEED */}
        <div className="card">
          <div className="card-body">
            {isLoading ? (
              <div className="text-center p-5">
                <Spin size="large" />
              </div>
            ) : normalizedActivities.length === 0 ? (
              <Empty description="No Activity Found" />
            ) : (
              Object.entries(grouped).map(([date, logs]) => (
                <div key={date} style={{ marginBottom: 30 }}>
                  {/* DATE HEADER */}
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 15,
                      color: "#666",
                      borderBottom: "1px solid #eee",
                      paddingBottom: 5,
                    }}
                  >
                    {date}
                  </div>

                  {/* LOGS */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {logs.map((log) => (
                      <div
                        key={log.activityLogId}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 8,
                          padding: 12,
                          background: "#fff",
                        }}
                      >
                        {/* MAIN ROW */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14 }}>
                              <strong>{log.userName}</strong>{" "}
                              <Tag color="blue">{log.module}</Tag>{" "}
                              <span style={{ color: "#555" }}>
                                {log.action}
                              </span>{" "}
                              <strong>{log.entityName || "-"}</strong>
                            </div>

                            <div style={{ fontSize: 12, color: "#888" }}>
                              {log.description}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8 }}>
                            {renderAction(log.action, log.actionType)}
                            {renderSeverity(log.severity)}

                            <Button
                              icon={<EyeOutlined />}
                              size="small"
                              onClick={() =>
                                setExpandedKey(
                                  expandedKey === log.activityLogId
                                    ? null
                                    : log.activityLogId,
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* EXPANDED */}
                        {expandedKey === log.activityLogId && (
                          <div
                            style={{
                              marginTop: 10,
                              paddingTop: 10,
                              borderTop: "1px dashed #ddd",
                              fontSize: 12,
                              color: "#555",
                            }}
                          >
                            <p>
                              <strong>Entity:</strong> {log.entityName}
                            </p>
                            <p>
                              <strong>Entity ID:</strong> {log.entityId}
                            </p>
                            <p>
                              <strong>Module:</strong> {log.module}
                            </p>
                            <p>
                              <strong>IP:</strong> {log.ipAddress}
                            </p>
                            <p>
                              <strong>User:</strong> {log.userEmail}
                            </p>

                            {renderChanges(log.oldValues, log.newValues)}
                            {renderMetadata(log.metadata)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGINATION */}
          <div className="d-flex justify-content-end p-3">
            <Pagination
              current={currentPage}
              pageSize={20}
              total={total}
              showSizeChanger={false}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsPage;
