import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Table,
  Spin,
  Empty,
  Alert,
  Tag,
  Typography,
  Button,
  Space,
  message,
} from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useGetHistoryByProductIdQuery } from "../../api/productApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import dayjs from "dayjs";
import * as XLSX from "xlsx"; // Excel export
import jsPDF from "jspdf"; // PDF export
import autoTable from "jspdf-autotable"; // PDF table plugin

const { Text } = Typography;

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

  // Build userMap
  useEffect(() => {
    if (usersData?.users) {
      const map = {};
      usersData.users.forEach((user) => {
        const displayName = user.name || user.username || "Unknown User";
        map[user.userId] = displayName;
      });
      setUserMap(map);
    }
  }, [usersData]);

  const dataSource = response?.history || [];

  // EXCEL EXPORT
  const exportToExcel = () => {
    if (!dataSource.length) return message.warning("No data to export");

    const worksheetData = dataSource.map((item) => ({
      Date: dayjs(item.createdAt).format("DD MMM YYYY HH:mm"),
      Action: item.action === "add-stock" ? "Stock In" : "Stock Out",
      Change: item.change > 0 ? `+${item.change}` : item.change,
      "Qty After": item.quantityAfter,
      "Order No": item.orderNo || "-",
      User: item.userId ? userMap[item.userId] || "Unknown" : "System",
      Note: item.message || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock History");

    // Auto-size columns
    const colWidths = [
      { wch: 18 }, // Date
      { wch: 12 }, // Action
      { wch: 10 }, // Change
      { wch: 10 }, // Qty After
      { wch: 12 }, // Order No
      { wch: 15 }, // User
      { wch: 25 }, // Note
    ];
    ws["!cols"] = colWidths;

    const fileName = `${
      product?.name || "Product"
    }_Stock_History_${dayjs().format("YYYY-MM-DD")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    message.success("Excel report downloaded!");
  };

  // PDF EXPORT (FIXED - using autoTable plugin correctly)
  const exportToPDF = () => {
    if (!dataSource.length) return message.warning("No data to export");

    const doc = new jsPDF("l", "mm", "a4"); // landscape
    const head = [
      ["Date", "Action", "Change", "Qty After", "Order No", "User", "Note"],
    ];
    const body = dataSource.map((item) => [
      dayjs(item.createdAt).format("DD MMM YYYY HH:mm"),
      item.action === "add-stock" ? "Stock In" : "Stock Out",
      item.change > 0 ? `+${item.change}` : item.change,
      item.quantityAfter,
      item.orderNo || "-",
      item.userId ? userMap[item.userId] || "Unknown" : "System",
      item.message || "-",
    ]);

    doc.setFontSize(16);
    doc.text(`Stock History Report - ${product?.name || "Product"}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${dayjs().format("DD MMMM YYYY HH:mm")}`, 14, 22);
    doc.text(`Current Stock: ${product?.quantity || 0} units`, 14, 28);

    // FIXED: Use autoTable as a function call
    autoTable(doc, {
      head,
      body,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [46, 125, 50] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const fileName = `${
      product?.name || "Product"
    }_Stock_Report_${dayjs().format("YYYY-MM-DD")}.pdf`;
    doc.save(fileName);
    message.success("PDF report downloaded!");
  };

  const columns = useMemo(
    () => [
      {
        title: "Date & Time",
        dataIndex: "createdAt",
        key: "date",
        width: 170,
        render: (date) => dayjs(date).format("DD MMM YYYY, HH:mm"),
      },
      {
        title: "Action",
        dataIndex: "action",
        key: "action",
        width: 130,
        render: (action) => {
          const colorMap = {
            "add-stock": "green",
            "remove-stock": "red",
            sale: "volcano",
            return: "blue",
            adjustment: "orange",
            correction: "purple",
          };
          const labelMap = {
            "add-stock": "Stock In",
            "remove-stock": "Stock Out",
            sale: "Sale",
            return: "Return",
            adjustment: "Adjustment",
            correction: "Correction",
          };
          return (
            <Tag color={colorMap[action] || "default"}>
              {labelMap[action] || action}
            </Tag>
          );
        },
      },
      {
        title: "Change",
        dataIndex: "change",
        key: "change",
        width: 100,
        align: "center",
        render: (change) => (
          <Text strong style={{ color: change > 0 ? "#52c41a" : "#f5222d" }}>
            {change > 0 ? `+${change}` : change}
          </Text>
        ),
      },
      {
        title: "Qty After",
        dataIndex: "quantityAfter",
        key: "quantityAfter",
        width: 100,
        align: "center",
        render: (qty) => <Text strong>{qty}</Text>,
      },
      {
        title: "Order No",
        dataIndex: "orderNo",
        key: "orderNo",
        width: 120,
        render: (orderNo) =>
          orderNo ? (
            <Text code>{orderNo}</Text>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
      {
        title: "User",
        dataIndex: "userId",
        key: "user",
        render: (userId) => {
          if (!userId)
            return (
              <Text italic type="secondary">
                System
              </Text>
            );
          const name = userMap[userId];
          return name ? (
            <strong>{name}</strong>
          ) : (
            <Text type="secondary">Loading…</Text>
          );
        },
      },
      {
        title: "Note",
        dataIndex: "message",
        key: "message",
        render: (msg) =>
          msg ? (
            <Text type="secondary">{msg}</Text>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
    ],
    [userMap]
  );

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>Stock History</strong> — {product?.name || "Product"}
            {product?.sku && (
              <span style={{ marginLeft: 8, fontWeight: 400, color: "#888" }}>
                #{product.sku}
              </span>
            )}
          </div>

          {/* EXPORT BUTTONS */}
          {dataSource.length > 0 && (
            <Space>
              <Button
                icon={<FileExcelOutlined style={{ color: "#1d6f42" }} />}
                onClick={exportToExcel}
                size="middle"
              >
                Excel
              </Button>
              <Button
                icon={<FilePdfOutlined style={{ color: "#d4380d" }} />}
                onClick={exportToPDF}
                size="middle"
              >
                PDF
              </Button>
            </Space>
          )}
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
      bodyStyle={{ padding: "16px 0" }}
    >
      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Spin size="large" tip="Loading stock history…" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert
          message="Failed to Load History"
          description={error?.data?.message || "Please try again later."}
          type="error"
          showIcon
          style={{ margin: "0 24px 16px" }}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && dataSource.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No stock movements recorded yet"
          style={{ margin: "40px 0" }}
        />
      )}

      {/* Table */}
      {!isLoading && !error && dataSource.length > 0 && (
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} records`,
          }}
          scroll={{ x: 1000 }}
          size="middle"
          bordered
        />
      )}
    </Modal>
  );
};

export default HistoryModalAntD;
