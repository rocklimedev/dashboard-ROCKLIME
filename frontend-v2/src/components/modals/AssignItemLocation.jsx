import ModalShell from '../Common/ModalShell';
import './AssignItemLocation.styles.css';
// src/components/modals/AssignItemLocation.jsx
import React, { useState, useEffect } from 'react';
import { Select, Space, Typography, InputNumber, Button, Tag, Divider } from 'antd';
import { toast } from 'sonner';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export default function AssignItemModal({
  visible,
  onCancel,
  onAssign,
  item, // the product being assigned
  floors,
}) {
  const [assignments, setAssignments] = useState([
    {
      floorId: null,
      roomId: null,
      assignedQuantity: 1,
      floorName: null,
      roomName: null,
    },
  ]);

  // Resolve quantity regardless of which caller shape is passed in
  // (AddQuotation uses `qty`, some older/other callers use `quantity`)
  const itemQty = Number(item?.qty ?? item?.quantity) || 1;

  // Resolve id regardless of which caller shape is passed in
  const itemId = item?.productId ?? item?.id;

  const totalAssigned = assignments.reduce((sum, a) => sum + (Number(a.assignedQuantity) || 0), 0);

  const remaining = itemQty - totalAssigned;

  // Reset when modal opens — hydrate from existing split data if present,
  // instead of always collapsing back to a single full-quantity row.
  useEffect(() => {
    if (visible && item) {
      const existingLocations = Array.isArray(item.locations)
        ? item.locations
        : item.floorId
          ? [
              {
                floorId: item.floorId,
                roomId: item.roomId || null,
                assignedQuantity: item.qty ?? item.quantity ?? 1,
                floorName: item.floorName || null,
                roomName: item.roomName || null,
              },
            ]
          : [];

      if (existingLocations.length > 0) {
        setAssignments(
          existingLocations.map((loc) => ({
            floorId: loc.floorId ?? null,
            roomId: loc.roomId ?? null,
            assignedQuantity: Number(loc.assignedQuantity) || 1,
            floorName: loc.floorName ?? null,
            roomName: loc.roomName ?? null,
          })),
        );
      } else {
        setAssignments([
          {
            floorId: null,
            roomId: null,
            assignedQuantity: itemQty,
            floorName: null,
            roomName: null,
          },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, item]);

  const addNewAssignment = () => {
    if (remaining <= 0) return;
    setAssignments([
      ...assignments,
      {
        floorId: null,
        roomId: null,
        assignedQuantity: Math.min(remaining, 1),
        floorName: null,
        roomName: null,
      },
    ]);
  };

  const updateAssignment = (index, field, value) => {
    const newAssignments = [...assignments];

    newAssignments[index][field] = value;

    // === Capture real names when selection changes ===
    if (field === 'floorId') {
      const selectedFloor = floors?.find((f) => f.floorId === value);
      newAssignments[index].floorName = selectedFloor?.floorName || null;
      // Clear child field
      newAssignments[index].roomId = null;
      newAssignments[index].roomName = null;
    }

    if (field === 'roomId') {
      const floor = floors?.find((f) => f.floorId === newAssignments[index].floorId);
      const selectedRoom = floor?.rooms?.find((r) => r.roomId === value);
      newAssignments[index].roomName = selectedRoom?.roomName || null;
    }

    setAssignments(newAssignments);
  };

  const removeAssignment = (index) => {
    if (assignments.length === 1) return;
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!itemId) {
      return toast.error('Could not identify this item — please retry');
    }
    if (totalAssigned === 0) {
      return toast.error('Please assign at least some quantity');
    }
    if (assignments.some((a) => !a.floorId)) {
      return toast.error('Please select a floor for every assignment row');
    }
    if (totalAssigned > itemQty) {
      return toast.error('Assigned quantity cannot exceed available quantity');
    }

    // Pass assignments with names to parent
    onAssign(itemId, assignments);
    onCancel();
  };

  const selectedFloor = (floorId) => floors?.find((f) => f.floorId === floorId);

  return (
    <ModalShell
      title={`${item?.name || 'Item'} - Assign Location`}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Save Assignments"
      width={650}
    >
      <Space className="fv2-assignitemlocation-0175fe9e6b" direction="vertical" size="large">
        <div>
          <Text strong>Available Quantity:</Text> <Tag color="blue">{itemQty}</Tag>
          <Text type="secondary">
            {' '}
            | Assigned: {totalAssigned} | Remaining: {remaining}
          </Text>
        </div>

        <Divider />

        {assignments.map((assignment, index) => {
          const floor = selectedFloor(assignment.floorId);

          return (
            <div className="fv2-assignitemlocation-4954be4880" key={index}>
              <Space
                className="fv2-assignitemlocation-0175fe9e6b"
                direction="vertical"
                size="small"
              >
                <Space className="fv2-assignitemlocation-542f6603e5" align="center">
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
                  className="fv2-assignitemlocation-0175fe9e6b"
                  min={1}
                  max={remaining + (Number(assignment.assignedQuantity) || 0)}
                  value={assignment.assignedQuantity}
                  onChange={(v) => updateAssignment(index, 'assignedQuantity', v)}
                  addonAfter="qty"
                />

                <Select
                  className="fv2-assignitemlocation-0175fe9e6b"

                  placeholder="Select Floor *"
                  value={assignment.floorId}
                  onChange={(v) => updateAssignment(index, 'floorId', v)}
                >
                  {(floors || []).map((f) => (
                    <Option key={f.floorId} value={f.floorId}>
                      {f.floorName}
                    </Option>
                  ))}
                </Select>

                {assignment.floorId && (
                  <Select
                    className="fv2-assignitemlocation-0175fe9e6b"

                    placeholder="Room (optional)"
                    value={assignment.roomId}
                    onChange={(v) => updateAssignment(index, 'roomId', v)}
                    allowClear
                  >
                    {floor?.rooms?.map((r) => (
                      <Option key={r.roomId} value={r.roomId}>
                        {r.roomName} {r.type && `(${r.type})`}
                      </Option>
                    ))}
                  </Select>
                )}
              </Space>
            </div>
          );
        })}

        {remaining > 0 && (
          <Button type="dashed" icon={<PlusOutlined />} onClick={addNewAssignment} block>
            Add Another Location
          </Button>
        )}
      </Space>
    </ModalShell>
  );
}
