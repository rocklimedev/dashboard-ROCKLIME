import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  DatePicker,
  Select,
  message,
  Statistic as AntStatistic,
} from "antd";
import {
  DownloadOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { generatePDF, generateExcel } from "../../utils/helpers";
import PageHeader from "../../components/Common/PageHeader";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetAllProductsQuery } from "../../api/productApi";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ReportsPage = () => {
  const [loadingReport, setLoadingReport] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState("order");
  const [dateRange, setDateRange] = useState([null, null]);
  const [quickFilter, setQuickFilter] = useState("all");

  // Fetch Data
  const { data: quotationsData } = useGetAllQuotationsQuery({ limit: 500 });
  const { data: ordersData } = useGetAllOrdersQuery({ limit: 500 });
  const { data: productsData } = useGetAllProductsQuery({
    limit: 1000,
    tab: "all",
  });

  const quotations = quotationsData?.data || [];
  const orders = ordersData?.data || [];
  const products = productsData?.data || [];

  // ==================== DATE FILTER LOGIC ====================

  const getFilteredData = (data, dateField = "createdAt") => {
    if (!dateRange[0] && quickFilter === "all") return data;

    const now = new Date();
    let startDate = null;

    switch (quickFilter) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "yesterday":
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
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
        startDate = dateRange[0]?.toDate();
    }

    const endDate = dateRange[1]?.toDate() || new Date();

    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      if (startDate) return itemDate >= startDate && itemDate <= endDate;
      return true;
    });
  };

  // ==================== REPORT GENERATORS ====================

  const generateReport = (type) => {
    setLoadingReport(type);
    try {
      let reportData = [];
      let fileName = "";
      let title = "";

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
          fileName = `Quotation_Report`;
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
          fileName = `Order_Report`;
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
          fileName = `Low_Stock_Alert`;
          break;

        default:
          message.warning("Report type not implemented yet");
          return;
      }

      generatePDF(reportData, title);
      generateExcel(reportData, fileName);
      message.success(`${title} generated successfully!`);
    } catch (err) {
      console.error(err);
      message.error("Failed to generate report");
    } finally {
      setLoadingReport(null);
    }
  };

  // Stats
  const stats = useMemo(
    () => ({
      totalQuotations: quotations.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce(
        (sum, o) => sum + Number(o.finalAmount || 0),
        0,
      ),
      lowStock: products.filter((p) => p.quantity > 0 && p.quantity <= 20)
        .length,
    }),
    [quotations, orders, products],
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Reports"
        subtitle="Business Intelligence & Analytics"
      />
      <div className="content">
        {/* Quick Reports */}
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {[
            {
              title: "Stock Report",
              icon: (
                <BarChartOutlined style={{ fontSize: 32, color: "#1890ff" }} />
              ),
              type: "stock",
            },
            {
              title: "Order Report",
              icon: (
                <ShoppingOutlined style={{ fontSize: 32, color: "#52c41a" }} />
              ),
              type: "order",
            },
            {
              title: "Quotation Report",
              icon: (
                <FileTextOutlined style={{ fontSize: 32, color: "#722ed1" }} />
              ),
              type: "quotation",
            },
            {
              title: "Low Stock Alert",
              icon: (
                <BarChartOutlined style={{ fontSize: 32, color: "#faad14" }} />
              ),
              type: "lowstock",
            },
          ].map((report) => (
            <Col xs={24} sm={12} lg={6} key={report.type}>
              <Card hoverable style={{ height: "100%" }}>
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  <div>{report.icon}</div>
                  <Title level={4}>{report.title}</Title>
                  <Button
                    type="primary"
                    block
                    icon={<DownloadOutlined />}
                    loading={loadingReport === report.type}
                    onClick={() => generateReport(report.type)}
                  >
                    Generate PDF + Excel
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Custom Report Builder */}
        <Card title="Custom Report Builder" style={{ borderRadius: 12 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} md={6}>
              <Select
                style={{ width: "100%" }}
                value={selectedReportType}
                onChange={setSelectedReportType}
                options={[
                  { value: "order", label: "Order Report" },
                  { value: "quotation", label: "Quotation Report" },
                  { value: "stock", label: "Stock Report" },
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <Select
                style={{ width: "100%" }}
                value={quickFilter}
                onChange={setQuickFilter}
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
                onChange={setDateRange}
                placeholder={["Start Date", "End Date"]}
              />
            </Col>

            <Col xs={24} md={4}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                block
                loading={loadingReport === "custom"}
                onClick={() => generateReport(selectedReportType)}
              >
                Generate
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
