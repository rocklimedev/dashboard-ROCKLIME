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
import { generateQuotationReportPDF } from "../../components/Reports/generateQuotationReport";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import {
  useGetAllProductsQuery,
  useGetLowStockProductsQuery,
} from "../../api/productApi";
import { useGetPurchaseOrdersQuery } from "../../api/poApi"; // ← Added
import { generateOrderReportPDF } from "../../components/Reports/generateOrderReport";
import { generatePOReportPDF } from "../../components/Reports/generatePOReport";
import { generateInventoryReportPDF } from "../../components/Reports/generateInventoryReport";
import { generateLowStockReportPDF } from "../../components/Reports/lowStockReport";
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
      limit: 100000,
      tab: "all",
    });
  const { data: poData, isLoading: loadingPOs } = useGetPurchaseOrdersQuery({
    limit: 500,
  });
  const { data: lowStockData, isLoading: loadingLowStock } =
    useGetLowStockProductsQuery({
      page: 1,
      limit: 100000,
      threshold: 20,
    });
  const quotations = quotationsData?.data || [];
  const orders = ordersData?.data || [];
  const products = productsData?.data || [];

  const lowStockCount = lowStockData?.totalLowStock || 0;
  const lowStockProducts = lowStockData?.data || [];
  const purchaseOrders =
    poData?.purchaseOrders?.data || poData?.data || poData || [];

  const isLoading =
    loadingQuotations ||
    loadingOrders ||
    loadingProducts ||
    loadingPOs ||
    loadingLowStock;
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
      switch (type) {
        // ================= STOCK =================
        case "stock": {
          const filteredProducts = getFilteredData(products);

          const reportData = filteredProducts.map((p, i) => ({
            "S.No": i + 1,
            "Product Name": p.name,
            "Company Code":
              p.metaDetails?.find((d) => d.value?.match(/^[A-Za-z0-9]{6,12}$/))
                ?.value || "—",
            "Current Stock": p.quantity,
            Status:
              p.quantity === 0
                ? "OUT OF STOCK"
                : p.quantity <= 20
                  ? "LOW STOCK"
                  : "IN STOCK",
            "Last Updated": p.updatedAt
              ? new Date(p.updatedAt).toLocaleDateString("en-IN")
              : "—",
          }));

          generateInventoryReportPDF(filteredProducts);
          message.success("Inventory Report generated!");
          break;
        }

        // ================= ORDER =================
        case "order": {
          const filteredOrders = getFilteredData(orders, "createdAt");

          await generateOrderReportPDF(
            filteredOrders,
            dateRange?.[0]?.format?.("DD/MM/YYYY"),
            dateRange?.[1]?.format?.("DD/MM/YYYY"),
          );

          message.success("Order Report generated!");
          break;
        }

        // ================= QUOTATION =================
        case "quotation": {
          const filteredQuotations = getFilteredData(
            quotations,
            "quotation_date",
          );

          const today = new Date();
          const currentDate = [
            String(today.getDate()).padStart(2, "0"),
            String(today.getMonth() + 1).padStart(2, "0"),
            today.getFullYear(),
          ].join("/");

          const reportStartDate =
            dateRange?.[0]?.format?.("DD/MM/YYYY") || currentDate;

          const reportEndDate =
            dateRange?.[1]?.format?.("DD/MM/YYYY") || currentDate;

          await generateQuotationReportPDF(
            filteredQuotations,
            reportStartDate,
            reportEndDate,
          );

          message.success("Quotation Report generated!");
          break;
        }

        // ================= PURCHASE ORDER =================
        case "po": {
          const filteredPOs = getFilteredData(purchaseOrders, "orderDate");

          await generatePOReportPDF(
            filteredPOs,
            dateRange?.[0]?.format?.("DD/MM/YYYY"),
            dateRange?.[1]?.format?.("DD/MM/YYYY"),
          );

          message.success("Purchase Order Report generated!");
          break;
        }

        // ================= LOW STOCK =================
        case "lowstock": {
          await generateLowStockReportPDF(lowStockProducts);

          message.success("Low Stock Report generated!");
          break;
        }

        default:
          message.warning("Report type not implemented");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to generate report");
    } finally {
      setLoadingReport(null);
    }
  };

  // Stats for info display
  const stats = useMemo(
    () => ({
      totalOrders: orders.length,
      totalQuotations: quotations.length,
      totalPOs: purchaseOrders.length,
      lowStock: lowStockCount,
    }),
    [orders, quotations, purchaseOrders, lowStockCount],
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
