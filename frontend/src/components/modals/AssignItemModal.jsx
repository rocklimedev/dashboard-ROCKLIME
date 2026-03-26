import React from "react";
import { Modal, Select, Space, Typography } from "antd";

const { Text } = Typography;
const { Option } = Select;

export default function AssignItemModal({
  visible,
  onCancel,
  onOk,
  item,
  floors,
  selectedFloorId,
  selectedRoomId,
  selectedAreaId,
  setSelectedFloorId,
  setSelectedRoomId,
  setSelectedAreaId,
}) {
  const selectedFloor = floors?.find((f) => f.floorId === selectedFloorId);
  const selectedRoom = selectedFloor?.rooms?.find(
    (r) => r.roomId === selectedRoomId
  );

  return (
    <Modal
      title="Assign Item to Location"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="Assign"
      width={500}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <Text strong>Product:</Text>{" "}
          <Text>{item?.name || "—"}</Text>
        </div>

        <div>
          <Text strong>Floor *</Text>
          <Select
            style={{ width: "100%", marginTop: 8 }}
            value={selectedFloorId}
            onChange={(v) => {
              setSelectedFloorId(v);
              setSelectedRoomId(null);
              setSelectedAreaId(null);
            }}
            placeholder="Select floor"
          >
            {(floors || []).map((f) => (
              <Option key={f.floorId} value={f.floorId}>
                {f.floorName}
              </Option>
            ))}
          </Select>
        </div>

        {selectedFloorId && (
          <div>
            <Text strong>Room (optional)</Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              value={selectedRoomId}
              onChange={(v) => {
                setSelectedRoomId(v);
                setSelectedAreaId(null);
              }}
              allowClear
              placeholder="Apply to whole floor"
            >
              {selectedFloor?.rooms?.map((r) => (
                <Option key={r.roomId} value={r.roomId}>
                  {r.roomName} {r.type && `(${r.type})`}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {selectedRoomId && (
          <div>
            <Text strong>Area / Section (optional)</Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              value={selectedAreaId}
              onChange={setSelectedAreaId}
              allowClear
              placeholder="Apply to whole room"
            >
              {selectedRoom?.areas?.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.name}
                </Option>
              ))}
            </Select>
          </div>
        )}
      </Space>
    </Modal>
  );
}