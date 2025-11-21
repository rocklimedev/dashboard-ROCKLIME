import React, { useState, useEffect, useMemo } from "react";
import { Modal, Table, Spin, Empty, Alert } from "antd";
import { useGetHistoryByProductIdQuery } from "../../api/productApi";
import { useGetAllUsersQuery } from "../../api/userApi";

const HistoryModalAntD = ({ open, onCancel, product }) => {
  const { data: usersData } = useGetAllUsersQuery();
  const [userMap, setUserMap] = useState({});

  const {
    data: response,
    error,
    isLoading,
  } = useGetHistoryByProductIdQuery(product?.productId, {
    skip: !product?.productId || !open,
  });

  // Build userMap: userId → username or name
  useEffect(() => {
    if (usersData?.users) {
      const map = usersData.users.reduce((acc, user) => {
        const name = user.username || user.name || "Unknown User";
        acc[user.userId] = name;
        return acc;
      }, {});
      setUserMap(map);
    }
  }, [usersData]);

  // Memoized columns to avoid recreating on every render
  const columns = useMemo(
    () => [
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
        render: (act) =>
          act === "add-stock"
            ? "Stock In"
            : act === "remove-stock"
            ? "Stock Out"
            : act,
      },
      {
        title: "Quantity",
        dataIndex: "quantity",
        key: "quantity",
        render: (qty) => (
          <span style={{ color: qty > 0 ? "green" : "red", fontWeight: 500 }}>
            {qty > 0 ? `+${qty}` : qty}
          </span>
        ),
      },
      {
        title: "Order No",
        dataIndex: "orderNo",
        key: "orderNo",
        render: (orderNo) => orderNo ?? "-",
      },
      {
        title: "User",
        dataIndex: "userId",
        key: "userId",
        render: (userId) => {
          if (!userId) return <span style={{ color: "#999" }}>System</span>;
          const name = userMap[userId];
          if (!name) return <span style={{ color: "#999" }}>Loading...</span>;
          return <strong>{name}</strong>;
        },
      },
    ],
    [userMap]
  );

  return (
    <Modal
      title={`Stock History – ${product?.name ?? ""}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin tip="Loading history…" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert
          message="Failed to load history"
          description={error?.data?.message || "Unknown error"}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Empty */}
      {!isLoading &&
        !error &&
        (!response?.history || response.history.length === 0) && (
          <Empty description="No history found" />
        )}

      {/* Table */}
      {!isLoading && !error && response?.history?.length > 0 && (
        <Table
          dataSource={response.history}
          columns={columns}
          rowKey="_id"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      )}
    </Modal>
  );
};

export default HistoryModalAntD;
