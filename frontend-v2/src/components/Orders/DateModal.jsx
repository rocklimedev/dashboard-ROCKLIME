import ModalShell from '../Common/ModalShell';
import './DateModal.styles.css';
import React from 'react';
import { Typography, Empty, List } from 'antd';

const { Title, Text } = Typography;

const DatesModal = ({ open, onClose, dueDate, followupDates = [] }) => {
  // Combine and sort dates
  const allDates = [
    ...(dueDate ? [{ date: dueDate, type: 'Due Date' }] : []),
    ...followupDates.map((date) => ({ date, type: 'Follow-up' })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <ModalShell
      open={open}
      onCancel={onClose}
      title={
        <Title className="fv2-datemodal-8d0c6203a7" level={4}>
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
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No dates available." />
      )}
    </ModalShell>
  );
};

export default DatesModal;
