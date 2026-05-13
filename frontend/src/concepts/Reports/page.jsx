import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  Table,
  DatePicker,
  Select,
  Input,
  message,
  Empty,
  Spin,
} from "antd";
import {
  DownloadOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
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
  const [selectedReportType, setSelectedReportType] = useState("monthly");

  // Date Filters
  const [dateRange, setDateRange] = useState([null, null]);

  // Fetch necessary data
  const { data: quotationsData } = useGetAllQuotationsQuery({ limit: 500 });
  const { data: ordersData } = useGetAllOrdersQuery({ limit: 500 });
  const { data: productsData } = useGetAllProductsQuery({
    limit: 1000,
    tab: "all",
  });

  const quotations = quotationsData?.data || [];
  const orders = ordersData?.data || [];
  const products = productsData?.data || [];

  // Quick Reports Data
  const reportStats = useMemo(() => {
    const totalQuotations = quotations.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (Number(o.finalAmount) || 0),
      0,
    );
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= 20,
    ).length;

    return { totalQuotations, totalOrders, totalRevenue, lowStock };
  }, [quotations, orders, products]);

  // ==================== REPORT GENERATORS ====================

  const generateMonthlyStockReport = () => {
    setLoadingReport("monthly");
    try {
      const now = new Date();
      const monthName = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      const reportData = products.map((p, i) => ({
        "S.No": i + 1,
        "Company Code":
          p.metaDetails?.find?.((d) => d.value?.match?.(/^[A-Za-z0-9]{6,12}$/))
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

      generatePDF(reportData, `Monthly Stock Report - ${monthName}`);
      message.success("Monthly Stock Report downloaded successfully!");
    } catch (err) {
      message.error("Failed to generate report");
    } finally {
      setLoadingReport(null);
    }
  };

  const generateSalesReport = () => {
    setLoadingReport("sales");
    try {
      const reportData = orders.map((order, i) => ({
        "S.No": i + 1,
        "Order No": order.orderNo || "—",
        Customer: order.customer?.name || "Walk-in",
        Date: new Date(order.createdAt).toLocaleDateString("en-IN"),
        Amount: `₹${Number(order.finalAmount || 0).toLocaleString("en-IN")}`,
        Status: order.status.replace("_", " "),
      }));

      generatePDF(reportData, "Sales Report");
      generateExcel(reportData, "Sales_Report");
      message.success("Sales Report generated!");
    } catch (err) {
      message.error("Failed to generate sales report");
    } finally {
      setLoadingReport(null);
    }
  };

  const generateLowStockReport = () => {
    setLoadingReport("lowstock");
    try {
      const lowStockProducts = products.filter(
        (p) => p.quantity > 0 && p.quantity <= 20,
      );

      const reportData = lowStockProducts.map((p, i) => ({
        "S.No": i + 1,
        "Product Name": p.name,
        "Current Stock": p.quantity,
        "Company Code":
          p.metaDetails?.find?.((d) => d.value?.match?.(/^[A-Za-z0-9]{6,12}$/))
            ?.value || "—",
      }));

      generatePDF(reportData, "Low Stock Alert Report");
      message.success(`${lowStockProducts.length} Low Stock items reported`);
    } catch (err) {
      message.error("Failed to generate low stock report");
    } finally {
      setLoadingReport(null);
    }
  };

  const generateQuotationReport = () => {
    setLoadingReport("quotation");
    try {
      const reportData = quotations.map((q, i) => ({
        "S.No": i + 1,
        "Quotation No": q.reference_number || "—",
        Customer: q.customer?.name || "—",
        Date: new Date(q.quotation_date).toLocaleDateString("en-IN"),
        Amount: `₹${Number(q.finalAmount || 0).toLocaleString("en-IN")}`,
      }));

      generatePDF(reportData, "Quotations Report");
      message.success("Quotations Report generated!");
    } catch (err) {
      message.error("Failed to generate quotation report");
    } finally {
      setLoadingReport(null);
    }
  };

  // Report Cards
  const quickReports = [
    {
      title: "Monthly Stock Report",
      icon: <FileTextOutlined style={{ fontSize: 28, color: "#1890ff" }} />,
      desc: "Current month stock summary",
      onClick: generateMonthlyStockReport,
      loadingKey: "monthly",
    },
    {
      title: "Sales Report",
      icon: <ShoppingOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
      desc: "Orders & Revenue Analysis",
      onClick: generateSalesReport,
      loadingKey: "sales",
    },
    {
      title: "Low Stock Alert",
      icon: <BarChartOutlined style={{ fontSize: 28, color: "#faad14" }} />,
      desc: "Products running low",
      onClick: generateLowStockReport,
      loadingKey: "lowstock",
    },
    {
      title: "Quotation Report",
      icon: <FileTextOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
      desc: "All quotations summary",
      onClick: generateQuotationReport,
      loadingKey: "quotation",
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Reports"
          subtitle="Generate and export business reports"
        />

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {quickReports.map((report, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                style={{ height: "100%", borderRadius: 12 }}
                bodyStyle={{ padding: 24 }}
              >
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div>{report.icon}</div>
                  <Title level={4} style={{ margin: 0 }}>
                    {report.title}
                  </Title>
                  <Text type="secondary">{report.desc}</Text>

                  <Button
                    type="primary"
                    block
                    icon={<DownloadOutlined />}
                    loading={loadingReport === report.loadingKey}
                    onClick={report.onClick}
                  >
                    Generate Report
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Custom Report Section */}
        <Card
          style={{ marginTop: 32, borderRadius: 12 }}
          title="Custom Report Builder"
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select Report Type"
                value={selectedReportType}
                onChange={setSelectedReportType}
                options={[
                  { value: "monthly", label: "Monthly Stock" },
                  { value: "sales", label: "Sales Summary" },
                  { value: "quotations", label: "Quotations" },
                  { value: "lowstock", label: "Low Stock" },
                ]}
              />
            </Col>

            <Col xs={24} md={8}>
              <RangePicker style={{ width: "100%" }} onChange={setDateRange} />
            </Col>

            <Col xs={24} md={8}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                block
                onClick={() =>
                  message.info(
                    "Advanced custom report coming soon with filters",
                  )
                }
              >
                Generate Custom Report
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Recent Reports Info */}
        <Card style={{ marginTop: 24 }} title="Quick Stats">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Quotations"
                value={reportStats.totalQuotations}
              />
            </Col>
            <Col span={6}>
              <Statistic title="Total Orders" value={reportStats.totalOrders} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Total Revenue"
                value={`₹${reportStats.totalRevenue.toLocaleString("en-IN")}`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Low Stock Items"
                value={reportStats.lowStock}
                suffix={<Tag color="orange">Alert</Tag>}
              />
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

// Simple Statistic Component
const Statistic = ({ title, value, suffix }) => (
  <div style={{ textAlign: "center" }}>
    <Text type="secondary" style={{ fontSize: 14 }}>
      {title}
    </Text>
    <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
      {value} {suffix}
    </div>
  </div>
);

export default ReportsPage;
