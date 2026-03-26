// src/components/purchase/FGSRow.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Tag, Select, Button, Dropdown, Menu } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";

import PermissionGate from "../../context/PermissionGate";

const FGSRow = ({
  fgs,
  idx,
  vendorMap,
  filters,
  handleEditFGS,
  handleDeleteFGSClick,
  handleConvertToPO,
  editingFGSStatusId,
  setEditingFGSStatusId,
  handleFGSStatusChange,
  isUpdatingFGSStatus,
  fgsStatuses,
  getFGSStatusBg,
  getFGSStatusColor,
}) => {
  const createdByDisplay = fgs?.createdBy ? (
    fgs.createdBy.name ||
    fgs.createdBy.email ||
    fgs.createdBy.username ||
    "—"
  ) : (
    <span style={{ color: "#999", fontStyle: "italic" }}>—</span>
  );

  const serial = (filters.page - 1) * filters.limit + idx + 1;
  const vendorName = vendorMap[fgs.vendorId] || "—";
  const status = fgs.status || "draft";

  return (
    <tr key={fgs.id}>
      <td>{serial}</td>
      <td>
        <Link to={`/fgs/${fgs.id}`}>{fgs.fgsNumber}</Link>
      </td>
      <td>
        <PermissionGate api="write" module="field_guided_sheets">
          {editingFGSStatusId === fgs.id ? (
            <Select
              value={status}
              onChange={(val) => handleFGSStatusChange(fgs.id, val)}
              style={{ width: 140 }}
              loading={isUpdatingFGSStatus}
              autoFocus
              size="small"
              onBlur={() => setEditingFGSStatusId(null)}
            >
              {fgsStatuses.map((s) => (
                <Select.Option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <div
              className="d-flex align-items-center gap-2 pointer"
              onClick={() => setEditingFGSStatusId(fgs.id)}
            >
              <span
                className={`priority-badge status-${status}`}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: getFGSStatusBg(status),
                  color: getFGSStatusColor(status),
                  border: `1px solid #ef9a9a`,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <EditOutlined style={{ fontSize: "14px" }} />
            </div>
          )}
        </PermissionGate>
      </td>
      <td>{vendorName}</td>
      <td>{fgs.totalAmount ? `Rs. ${fgs.totalAmount}` : "—"}</td>
      <td>
        {fgs.orderDate
          ? new Date(fgs.orderDate).toLocaleDateString("en-IN")
          : "—"}
      </td>
      <td>
        {fgs.expectDeliveryDate
          ? new Date(fgs.expectDeliveryDate).toLocaleDateString("en-IN")
          : "—"}
      </td>
      <td>{createdByDisplay}</td>
      <td>
        <div className="d-flex gap-2">
          <PermissionGate api="edit" module="field_guided_sheets">
            <EditOutlined
              style={{ cursor: "pointer" }}
              onClick={() => handleEditFGS(fgs)}
            />
          </PermissionGate>

          <PermissionGate api="delete" module="field_guided_sheets">
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item
                    key="delete"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteFGSClick(fgs.id)}
                  >
                    Delete
                  </Menu.Item>
                  {status === "approved" && (
                    <Menu.Item
                      key="convert"
                      icon={<span style={{ color: "#e31e24" }}>→</span>}
                      onClick={() => handleConvertToPO(fgs.id, fgs.fgsNumber)}
                    >
                      Convert to PO
                    </Menu.Item>
                  )}
                </Menu>
              }
              trigger={["click"]}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </PermissionGate>
        </div>
      </td>
    </tr>
  );
};

export default FGSRow;