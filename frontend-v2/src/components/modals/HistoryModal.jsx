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
  FileExcelOutlined,
  FilePdfOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetHistoryByProductIdQuery } from "../../api/productApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Text } = Typography;

const HistoryModalAntD = ({ open, onCancel, product }) => {
  const navigate = useNavigate();

  const { data: usersData } = useGetAllUsersQuery();
  const [userMap, setUserMap] = useState({});

  const {
    data: response,
    error,
    isLoading,
  } = useGetHistoryByProductIdQuery(product?.productId, {
    skip: !product?.productId || !open,
  });

  useEffect(() => {
    if (usersData?.users) {
      const map = {};

      usersData.users.forEach((user) => {
        map[user.userId] = user.name || user.username || "Unknown User";
      });

      setUserMap(map);
    }
  }, [usersData]);

  const dataSource = response?.history || [];

  const previewData = useMemo(() => {
    return [...dataSource]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // ← Changed
      .slice(0, 10);
  }, [dataSource]);
  const exportToExcel = () => {
    if (!dataSource.length) {
      return message.warning("No data to export");
    }

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

    ws["!cols"] = [
      { wch: 18 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
    ];

    XLSX.writeFile(
      wb,
      `${product?.name || "Product"}_Stock_History_${dayjs().format(
        "YYYY-MM-DD",
      )}.xlsx`,
    );

    message.success("Excel report downloaded");
  };

  const exportToPDF = () => {
    if (!dataSource.length) {
      return message.warning("No data to export");
    }

    const doc = new jsPDF("landscape", "mm", "a4");

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

    doc.text(`Generated On: ${dayjs().format("DD MMM YYYY HH:mm")}`, 14, 22);

    autoTable(doc, {
      head,
      body,
      startY: 30,
      theme: "grid",
      styles: {
        fontSize: 8,
      },
    });

    doc.save(`${product?.name || "Product"}_Stock_History.pdf`);

    message.success("PDF report downloaded");
  };

  const columns = useMemo(
    () => [
      {
        title: "Date & Time",
        dataIndex: "timestamp", // ← Changed
        key: "date",
        width: 180,
        render: (timestamp) => dayjs(timestamp).format("DD MMM YYYY, HH:mm"),
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
        width: 100,
        align: "center",
        render: (change) => (
          <Text
            strong
            style={{
              color: change > 0 ? "#52c41a" : "#f5222d",
            }}
          >
            {change > 0 ? `+${change}` : change}
          </Text>
        ),
      },
      {
        title: "Qty After",
        dataIndex: "quantityAfter",
        width: 100,
        align: "center",
      },
      {
        title: "Order No",
        dataIndex: "orderNo",
        width: 130,
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
        render: (userId) =>
          userId ? userMap[userId] || "Unknown User" : "System",
      },
      {
        title: "Note",
        dataIndex: "message",
        render: (msg) => msg || <Text type="secondary">—</Text>,
      },
    ],
    [userMap],
  );

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {" "}
          <div>
            {" "}
            <strong>Stock History </strong> — {product?.name}{" "}
          </div>
          {dataSource.length > 0 && (
            <Space>
              <Button icon={<FileExcelOutlined />} onClick={exportToExcel}>
                Excel
              </Button>

              <Button icon={<FilePdfOutlined />} onClick={exportToPDF}>
                PDF
              </Button>
            </Space>
          )}
        </div>
      }
    >
      {isLoading && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
          }}
        >
          <Spin size="large" />
        </div>
      )}

      {error && (
        <Alert type="error" showIcon message="Failed to load history" />
      )}

      {!isLoading && !error && dataSource.length === 0 && (
        <Empty description="No stock movements recorded yet" />
      )}

      {!isLoading && !error && dataSource.length > 0 && (
        <>
          <Table
            columns={columns}
            dataSource={previewData}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1000 }}
            bordered
          />

          {dataSource.length > 10 && (
            <div
              style={{
                marginTop: 16,
                textAlign: "center",
              }}
            >
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => {
                  onCancel();

                  navigate(`/product/${product?.productId}/inventory`, {
                    state: {
                      product,
                    },
                  });
                }}
              >
                View All ({dataSource.length})
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default HistoryModalAntD;
