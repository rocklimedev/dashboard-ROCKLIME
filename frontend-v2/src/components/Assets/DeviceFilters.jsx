import React from "react";
import { Select, Space, Button } from "antd";
import { useGetWarehousesQuery } from "../../api/deviceManagementApi";

const FUNCTION_OPTIONS = [
  { value: "ORDERS", label: "Orders" },
  { value: "PICKING", label: "Picking" },
  { value: "DISPATCH", label: "Dispatch" },
  { value: "INVENTORY", label: "Inventory" },
];

const STATUS_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

export default function DeviceFilters({ filters, onChange }) {
  const { data: warehouses = [] } = useGetWarehousesQuery();

  const update = (patch) => onChange({ ...filters, ...patch });

  const hasFilters = filters.warehouseId || filters.function || filters.status;

  return (
    <Space wrap>
      <Select
        allowClear
        placeholder="Warehouse"
        style={{ width: 180 }}
        value={filters.warehouseId}
        onChange={(warehouseId) => update({ warehouseId })}
        options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
      />
      <Select
        allowClear
        placeholder="Function"
        style={{ width: 160 }}
        value={filters.function}
        onChange={(fn) => update({ function: fn })}
        options={FUNCTION_OPTIONS}
      />
      <Select
        allowClear
        placeholder="Status"
        style={{ width: 140 }}
        value={filters.status}
        onChange={(status) => update({ status })}
        options={STATUS_OPTIONS}
      />
      {hasFilters && (
        <Button type="text" onClick={() => onChange({})}>
          Clear filters
        </Button>
      )}
    </Space>
  );
}
