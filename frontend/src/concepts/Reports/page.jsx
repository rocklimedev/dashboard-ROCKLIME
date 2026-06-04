import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Select,
  message,
  DatePicker,
  Spin,
} from "antd";
import {
  DownloadOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import { Statistic } from "antd";
import { generatePDF, generateExcel } from "../../utils/helpers";
import PageHeader from "../../components/Common/PageHeader";

import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetPurchaseOrdersQuery } from "../../api/poApi"; // ← Added

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ReportsPage = () => {
  const [loadingReport, setLoadingReport] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState("order");
  const [dateRange, setDateRange] = useState([null, null]);
  const [quickFilter, setQuickFilter] = useState("all");

  // ==================== DATA FETCHING ====================
  const { data: quotationsData, isLoading: loadingQuotations } =
    useGetAllQuotationsQuery({ limit: 500 });
  const { data: ordersData, isLoading: loadingOrders } = useGetAllOrdersQuery({
    limit: 500,
  });
  const { data: productsData, isLoading: loadingProducts } =
    useGetAllProductsQuery({
      limit: 1000,
      tab: "all",
    });
  const { data: poData, isLoading: loadingPOs } = useGetPurchaseOrdersQuery({
    limit: 500,
  });

  const quotations = quotationsData?.data || [];
  const orders = ordersData?.data || [];
  const products = productsData?.data || [];
  const purchaseOrders =
    poData?.purchaseOrders?.data || poData?.data || poData || [];

  const isLoading =
    loadingQuotations || loadingOrders || loadingProducts || loadingPOs;

  // ==================== DATE FILTER LOGIC ====================
  const getFilteredData = (data, dateField = "createdAt") => {
    if (!data.length) return [];

    const now = new Date();

    let startDate = null;
    let endDate = new Date();

    if (quickFilter !== "all") {
      switch (quickFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "yesterday":
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last7":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "last30":
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case "last3m":
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case "last6m":
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        default:
          break;
      }
    } else if (dateRange[0] && dateRange[1]) {
      startDate = dateRange[0].toDate();
      endDate = dateRange[1].toDate();
    } else {
      return data; // All time
    }

    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // ==================== REPORT GENERATORS ====================
  const generateReport = async (type) => {
    setLoadingReport(type);
    try {
      let reportData = [];
      let title = "";
      let fileName = "";

      switch (type) {
        case "stock":
          reportData = products.map((p, i) => ({
            "S.No": i + 1,
            "Company Code":
              p.metaDetails?.find((d) => d.value?.match(/^[A-Za-z0-9]{6,12}$/))
                ?.value || "—",
            "Product Name": p.name,
            "Current Stock": p.quantity,
            Status:
              p.quantity === 0
                ? "Out of Stock"
                : p.quantity <= 20
                  ? "Low Stock"
                  : "In Stock",
            "Last Updated": p.updatedAt
              ? new Date(p.updatedAt).toLocaleDateString("en-IN")
              : "—",
          }));
          title = "Stock Report";
          fileName = `Stock_Report_${new Date().toISOString().slice(0, 10)}`;
          break;

        case "quotation":
          const filteredQuotations = getFilteredData(
            quotations,
            "quotation_date",
          );
          reportData = filteredQuotations.map((q, i) => ({
            "S.No": i + 1,
            "Quotation No": q.reference_number || "—",
            "Quotation Date": new Date(q.quotation_date).toLocaleDateString(
              "en-IN",
            ),
            "Client Name": q.customer?.name || "—",
            Amount: `₹${Number(q.finalAmount || 0).toLocaleString("en-IN")}`,
          }));
          title = "Quotation Report";
          fileName = `Quotation_Report_${new Date().toISOString().slice(0, 10)}`;
          break;

        case "order":
          const filteredOrders = getFilteredData(orders);
          reportData = filteredOrders.map((o, i) => ({
            "S.No": i + 1,
            "Order No": o.orderNo || "—",
            "Order Date": new Date(o.createdAt).toLocaleDateString("en-IN"),
            "Client Name": o.customer?.name || "Walk-in",
            Address: o.customer?.address || "—",
            Amount: `₹${Number(o.finalAmount || 0).toLocaleString("en-IN")}`,
            Status: o.status.replace("_", " ").toUpperCase(),
          }));
          title = "Order Report";
          fileName = `Order_Report_${new Date().toISOString().slice(0, 10)}`;
          break;

        case "po":
          const filteredPOs = getFilteredData(purchaseOrders, "orderDate");

          reportData = filteredPOs.map((po, i) => {
            return {
              "S.No": i + 1,
              "PO Number": po.poNumber || po.id || "—",
              "PO Date": po.orderDate
                ? new Date(po.orderDate).toLocaleDateString("en-IN")
                : "—",
              "Vendor Name":
                po.vendor?.vendorName || po.vendorName || "Unknown",
              Amount: `₹${Number(po.totalAmount || 0).toLocaleString("en-IN")}`,
              Status: (po.status || "pending").toUpperCase(),
            };
          });

          title = "Purchase Order Report";
          fileName = `Purchase_Order_Report_${new Date().toISOString().slice(0, 10)}`;
          break;
        case "lowstock":
          const lowStock = products.filter(
            (p) => p.quantity > 0 && p.quantity <= 20,
          );
          reportData = lowStock.map((p, i) => ({
            "S.No": i + 1,
            "Product Name": p.name,
            "Current Stock": p.quantity,
            "Company Code":
              p.metaDetails?.find((d) => d.value?.match(/^[A-Za-z0-9]{6,12}$/))
                ?.value || "—",
          }));
          title = "Low Stock Alert Report";
          fileName = `Low_Stock_Alert_${new Date().toISOString().slice(0, 10)}`;
          break;

        default:
          message.warning("Report type not implemented");
          return;
      }

      if (reportData.length === 0) {
        message.info("No data available for the selected filter.");
        return;
      }

      generatePDF(reportData, title);
      generateExcel(reportData, fileName);

      message.success(`${title} generated successfully!`);
    } catch (err) {
      message.error("Failed to generate report. Please try again.");
    } finally {
      setLoadingReport(null);
    }
  };

  // Stats for info display
  const stats = useMemo(
    () => ({
      totalOrders: orders.length,
      totalQuotations: quotations.length,
      totalPOs: purchaseOrders.length, // This should already work
      lowStock: products.filter((p) => p.quantity > 0 && p.quantity <= 20)
        .length,
    }),
    [orders, quotations, purchaseOrders, products],
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Reports"
        subtitle="Business Intelligence & Analytics"
      />

      <div className="content">
        {isLoading && <Spin size="large" tip="Loading report data..." />}

        {/* Stats Overview */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title="Total Orders" value={stats.totalOrders} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Quotations"
                value={stats.totalQuotations}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title="Purchase Orders" value={stats.totalPOs} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Low Stock Items"
                value={stats.lowStock}
                suffix="items"
              />
            </Card>
          </Col>
        </Row>

        {/* Custom Report Builder */}
        <Card title="Custom Report Builder" style={{ borderRadius: 12 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Select
                style={{ width: "100%" }}
                value={selectedReportType}
                onChange={setSelectedReportType}
                options={[
                  { value: "order", label: "Order Report" },
                  { value: "quotation", label: "Quotation Report" },
                  { value: "po", label: "Purchase Order Report" },
                  { value: "stock", label: "Stock Report" },
                  { value: "lowstock", label: "Low Stock Alert" },
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <Select
                style={{ width: "100%" }}
                value={quickFilter}
                onChange={(value) => {
                  setQuickFilter(value);
                  if (value !== "all") setDateRange([null, null]);
                }}
                options={[
                  { value: "all", label: "All Time" },
                  { value: "today", label: "Today" },
                  { value: "yesterday", label: "Yesterday" },
                  { value: "last7", label: "Last 7 Days" },
                  { value: "last30", label: "Last 30 Days" },
                  { value: "last3m", label: "Last 3 Months" },
                  { value: "last6m", label: "Last 6 Months" },
                ]}
              />
            </Col>

            <Col xs={24} md={8}>
              <RangePicker
                style={{ width: "100%" }}
                value={dateRange}
                onChange={setDateRange}
                disabled={quickFilter !== "all"}
                placeholder={["Start Date", "End Date"]}
              />
            </Col>

            <Col xs={24} md={4}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                block
                loading={loadingReport === selectedReportType}
                onClick={() => generateReport(selectedReportType)}
                disabled={isLoading}
              >
                Generate Report
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
