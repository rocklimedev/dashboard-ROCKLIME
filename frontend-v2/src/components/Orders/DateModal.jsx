import React from "react";
import { Modal, Typography, Empty, List } from "antd";

const { Title, Text } = Typography;

const DatesModal = ({ open, onClose, dueDate, followupDates = [] }) => {
  // Combine and sort dates
  const allDates = [
    ...(dueDate ? [{ date: dueDate, type: "Due Date" }] : []),
    ...followupDates.map((date) => ({ date, type: "Follow-up" })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Title level={4} style={{ margin: 0 }}>
          Order Dates
        </Title>
      }
      footer={null}
      centered
      width={400}
    >
      {allDates.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={allDates}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<Text strong>{item.type}</Text>}
                description={<Text type="secondary">{item.date}</Text>}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No dates available."
        />
      )}
    </Modal>
  );
};

export default DatesModal;
