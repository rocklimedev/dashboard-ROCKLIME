import React from "react";
import { Modal, Table, Spin, Empty, Alert } from "antd";
import { useGetHistoryByProductIdQuery } from "../../api/productApi";

const HistoryModalAntD = ({ open, onCancel, product }) => {
  const {
    data: response,
    error,
    isLoading,
  } = useGetHistoryByProductIdQuery(product?.productId, {
    skip: !product?.productId || !open,
  });

  const columns = [
    {
      title: "Date",
      dataIndex: "timestamp",
      key: "date",
      render: (ts) => new Date(ts).toLocaleString(),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (act) => (act === "add-stock" ? "Stock In" : "Stock Out"),
    },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
  ];

  return (
    <Modal
      title={`Stock History – ${product?.name ?? ""}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={680}
    >
      {isLoading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin tip="Loading history…" />
        </div>
      )}

      {error && (
        <Alert message="Failed to load history" type="error" showIcon />
      )}

      {!isLoading &&
        !error &&
        (!response?.history || response.history.length === 0) && (
          <Empty description="No history found" />
        )}

      {!isLoading && !error && response?.history?.length > 0 && (
        <Table
          dataSource={response.history}
          columns={columns}
          rowKey={(r, i) => i}
          pagination={false}
          size="small"
        />
      )}
    </Modal>
  );
};

export default HistoryModalAntD;
