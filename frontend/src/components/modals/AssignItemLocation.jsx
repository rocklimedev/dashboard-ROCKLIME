// src/components/modals/AssignItemLocation.jsx  (or wherever it is)
import React, { useState, useEffect } from "react";
import {
  Modal,
  Select,
  Space,
  Typography,
  InputNumber,
  Button,
  Tag,
  Divider,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

export default function AssignItemModal({
  visible,
  onCancel,
  onOk,
  item, // the product being assigned
  floors,
  // We will pass a callback instead of simple onOk
  onAssign,
}) {
  const [assignments, setAssignments] = useState([
    { floorId: null, roomId: null, areaId: null, assignedQuantity: 1 },
  ]);

  const totalAssigned = assignments.reduce(
    (sum, a) => sum + (Number(a.assignedQuantity) || 0),
    0,
  );
  const remaining = (Number(item?.quantity) || 1) - totalAssigned;

  // Reset when modal opens
  useEffect(() => {
    if (visible && item) {
      setAssignments([
        {
          floorId: null,
          roomId: null,
          areaId: null,
          assignedQuantity: Number(item.quantity) || 1,
        },
      ]);
    }
  }, [visible, item]);

  const addNewAssignment = () => {
    if (remaining <= 0) return;
    setAssignments([
      ...assignments,
      {
        floorId: null,
        roomId: null,
        areaId: null,
        assignedQuantity: Math.min(remaining, 1),
      },
    ]);
  };

  const updateAssignment = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;

    // Clear child selections when parent changes
    if (field === "floorId") {
      newAssignments[index].roomId = null;
      newAssignments[index].areaId = null;
    }
    if (field === "roomId") {
      newAssignments[index].areaId = null;
    }

    setAssignments(newAssignments);
  };

  const removeAssignment = (index) => {
    if (assignments.length === 1) return;
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (totalAssigned === 0) {
      return message.error("Please assign at least some quantity");
    }
    if (totalAssigned > (item?.quantity || 1)) {
      return message.error(
        "Assigned quantity cannot exceed available quantity",
      );
    }

    onAssign(item.id, assignments); // Pass all assignments
    onCancel();
  };

  const selectedFloor = (floorId) => floors?.find((f) => f.floorId === floorId);

  return (
    <Modal
      title={`${item?.name || "Item"}`}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Save Assignments"
      width={600}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div>
          <Text strong>Available Quantity:</Text>{" "}
          <Tag color="blue">{item?.quantity || 1}</Tag>
          <Text type="secondary">
            {" "}
            | Assigned: {totalAssigned} | Remaining: {remaining}
          </Text>
        </div>

        <Divider />

        {assignments.map((assignment, index) => {
          const floor = selectedFloor(assignment.floorId);
          const room = floor?.rooms?.find(
            (r) => r.roomId === assignment.roomId,
          );

          return (
            <div
              key={index}
              style={{
                border: "1px solid #f0f0f0",
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="small"
              >
                <Space
                  align="center"
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Text strong>Assignment {index + 1}</Text>
                  {assignments.length > 1 && (
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeAssignment(index)}
                    />
                  )}
                </Space>

                <InputNumber
                  min={1}
                  max={remaining + (Number(assignment.assignedQuantity) || 0)}
                  value={assignment.assignedQuantity}
                  onChange={(v) =>
                    updateAssignment(index, "assignedQuantity", v)
                  }
                  addonAfter="qty"
                  style={{ width: "100%" }}
                />

                <Select
                  style={{ width: "100%" }}
                  placeholder="Select Floor *"
                  value={assignment.floorId}
                  onChange={(v) => updateAssignment(index, "floorId", v)}
                >
                  {(floors || []).map((f) => (
                    <Option key={f.floorId} value={f.floorId}>
                      {f.floorName}
                    </Option>
                  ))}
                </Select>

                {assignment.floorId && (
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Room (optional)"
                    value={assignment.roomId}
                    onChange={(v) => updateAssignment(index, "roomId", v)}
                    allowClear
                  >
                    {floor?.rooms?.map((r) => (
                      <Option key={r.roomId} value={r.roomId}>
                        {r.roomName} {r.type && `(${r.type})`}
                      </Option>
                    ))}
                  </Select>
                )}

                {assignment.roomId && (
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Area / Section (optional)"
                    value={assignment.areaId}
                    onChange={(v) => updateAssignment(index, "areaId", v)}
                    allowClear
                  >
                    {room?.areas?.map((a) => (
                      <Option key={a.id} value={a.id}>
                        {a.name}
                      </Option>
                    ))}
                  </Select>
                )}
              </Space>
            </div>
          );
        })}

        {remaining > 0 && (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addNewAssignment}
            block
          >
            Add Another Location
          </Button>
        )}
      </Space>
    </Modal>
  );
}
