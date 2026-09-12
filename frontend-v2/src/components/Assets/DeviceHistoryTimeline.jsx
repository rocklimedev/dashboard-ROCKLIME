import React, { useState } from "react";
import { Timeline, Select, Empty, Spin } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useGetDeviceHistoryQuery } from "../../api/deviceManagementApi";

dayjs.extend(relativeTime);

const TYPE_OPTIONS = [
  { value: "heartbeat", label: "Heartbeat" },
  { value: "status_change", label: "Status change" },
  { value: "config_push", label: "Config push" },
  { value: "assignment_change", label: "Assignment change" },
  { value: "error", label: "Error" },
];

const TYPE_COLOR = {
  heartbeat: "green",
  status_change: "blue",
  config_push: "purple",
  assignment_change: "gold",
  error: "red",
};

function describeEvent(event) {
  if (
    event.type === "assignment_change" &&
    event.meta?.oldValue &&
    event.meta?.newValue
  ) {
    const { oldValue, newValue } = event.meta;
    return `Reassigned — ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`;
  }
  if (event.type === "config_push") {
    return "Configuration updated";
  }
  if (event.type === "heartbeat") {
    return `Heartbeat${event.appVersion ? ` — app v${event.appVersion}` : ""}`;
  }
  if (event.meta?.action) {
    return event.meta.action.replace(/_/g, " ");
  }
  return event.type.replace(/_/g, " ");
}

export default function DeviceHistoryTimeline({ deviceId }) {
  const [type, setType] = useState(undefined);
  const { data: events = [], isLoading } = useGetDeviceHistoryQuery({
    deviceId,
    type,
    limit: 100,
  });

  return (
    <div>
      <Select
        allowClear
        placeholder="All event types"
        style={{ width: 200, marginBottom: 16 }}
        value={type}
        onChange={setType}
        options={TYPE_OPTIONS}
      />

      {isLoading && <Spin />}

      {!isLoading && events.length === 0 && (
        <div className="dm-empty-state">
          <Empty description="No events recorded yet" />
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <Timeline
          items={events.map((event) => ({
            color: TYPE_COLOR[event.type] || "gray",
            children: (
              <div>
                <div>{describeEvent(event)}</div>
                <div
                  className="dm-mono"
                  style={{ color: "#8B95A1", fontSize: 12 }}
                >
                  {dayjs(event.timestamp).format("YYYY-MM-DD HH:mm:ss")} ·{" "}
                  {dayjs(event.timestamp).fromNow()}
                </div>
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
