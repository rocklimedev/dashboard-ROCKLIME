import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  Tabs,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  message,
  Modal,
  Tag,
  Empty,
  Form,
  Row,
  Col,
  Grid,
  Pagination, // ← Added
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  HistoryOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import StockModal from "../Common/StockModal";
import {
  useGetAllProductsQuery,
  useAddStockMutation,
  useRemoveStockMutation,
} from "../../api/productApi";
import PageHeader from "./PageHeader";
import pos from "../../assets/img/default.png";
import HistoryModalAntD from "./HistoryModal";
import ReportBuilderModal from "./ReportBuilderModal";
import { generatePDF, generateExcel } from "../../data/helpers";

const { TabPane } = Tabs;
const { Text } = Typography;

const InventoryWrapper = () => {
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Match backend default if possible

  // Pass pagination (and optionally search) to the query
  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useGetAllProductsQuery({
    page: currentPage,
    limit: pageSize,
    // search: search || undefined, // ← Uncomment if backend supports server-side search
  });

  const [addStock] = useAddStockMutation();
  const [removeStock] = useRemoveStockMutation();

  const products = useMemo(
    () => (Array.isArray(response?.data) ? response?.data : []),
    [response?.data]
  );

  const pagination = response?.pagination || {
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  };

  // UI States
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [maxStockFilter, setMaxStockFilter] = useState(null);
  const [priceRange, setPriceRange] = useState([null, null]);

  // Modals
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState("add");
  const [selectedReportProducts, setSelectedReportProducts] = useState([]);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);

  const [stockForm] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const parseImages = (images) => {
    try {
      if (typeof images === "string") {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [pos];
      }
      return Array.isArray(images) && images.length > 0 ? images : [pos];
    } catch {
      return [pos];
    }
  };

  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails) || metaDetails.length === 0) {
      return "N/A";
    }

    // Try to find a likely company/product code entry
    // Most reliable in your current data → last item
    const lastEntry = metaDetails[metaDetails.length - 1];
    if (
      lastEntry?.value &&
      typeof lastEntry.value === "string" &&
      lastEntry.value.trim() !== ""
    ) {
      return lastEntry.value.trim();
    }

    // Fallback: search for any reasonable-looking code-like value
    const codeLike = metaDetails.find(
      (d) =>
        d.value &&
        typeof d.value === "string" &&
        d.value.match(/^[A-Za-z0-9]{6,12}$/) // e.g. 33965000, 23200000, FFAS9127-...
    );

    return codeLike ? String(codeLike.value).trim() : "N/A";
  };

  const getSellingPrice = (metaDetails) => {
    if (!Array.isArray(metaDetails) || metaDetails.length === 0) return null;

    // Strategy 1: look for numeric-looking value that is not UUID / code
    for (const d of metaDetails) {
      const val = String(d.value || "").trim();
      if (!val) continue;

      // Skip UUIDs and short alphanumeric codes
      if (val.match(/^[0-9a-f-]{30,}/i)) continue; // UUID-like
      if (val.match(/^[A-Za-z0-9]{8,12}$/) && !val.includes(".")) continue; // codes like 33965000

      // Looks like money (has digits, maybe decimal)
      if (val.match(/^\d+(?:\.\d+)?$/)) {
        const num = Number(val);
        if (!isNaN(num) && num > 10) {
          // avoid very small numbers that might be tax %
          return num;
        }
      }
    }

    // Strategy 2: fallback → last numeric-ish entry
    for (let i = metaDetails.length - 1; i >= 0; i--) {
      const val = String(metaDetails[i].value || "").trim();
      const num = Number(val);
      if (!isNaN(num) && num > 50) {
        // reasonable price threshold
        return num;
      }
    }

    return null;
  };

  // Client-side filtering (only on current page data)
  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.product_code?.toLowerCase().includes(term) ||
        getCompanyCode(p.metaDetails).toLowerCase().includes(term);

      const matchesMaxStock =
        maxStockFilter === null || p.quantity <= maxStockFilter;

      const price = getSellingPrice(p.metaDetails);
      const matchesPrice =
        (priceRange[0] == null || price >= priceRange[0]) &&
        (priceRange[1] == null || price <= priceRange[1]);

      return matchesSearch && matchesMaxStock && matchesPrice;
    });
  }, [products, search, maxStockFilter, priceRange]);

  // Tab-based filtering
  const tabFilteredProducts = useMemo(() => {
    if (activeTab === "in-stock")
      return filteredProducts.filter((p) => p.quantity > 0);
    if (activeTab === "low-stock")
      return filteredProducts.filter(
        (p) => p.quantity > 0 && p.quantity <= lowStockThreshold
      );
    if (activeTab === "out-of-stock")
      return filteredProducts.filter((p) => p.quantity === 0);
    return filteredProducts; // "all"
  }, [filteredProducts, activeTab, lowStockThreshold]);

  // Approximate counts (based on current page only)
  const counts = useMemo(() => {
    return {
      all: pagination.total,
      inStock: products.filter((p) => p.quantity > 0).length,
      lowStock: products.filter(
        (p) => p.quantity > 0 && p.quantity <= lowStockThreshold
      ).length,
      outStock: products.filter((p) => p.quantity === 0).length,
    };
  }, [products, pagination.total, lowStockThreshold]);

  // Report handlers
  const generateCustomReport = (format) => {
    const selectedData = products.filter((p) =>
      selectedReportProducts.includes(p.productId)
    );
    const reportData = selectedData.map((p) => ({
      Name: p.name || "Unnamed Product",
      "Product Code": p.product_code || "—",
      "Company Code": getCompanyCode(p.metaDetails),
      "Selling Price": getSellingPrice(p.metaDetails)
        ? `₹${getSellingPrice(p.metaDetails).toLocaleString("en-IN")}`
        : "—",
      Stock: p.quantity,
      Status:
        p.quantity === 0
          ? "Out of Stock"
          : p.quantity <= lowStockThreshold
          ? "Low Stock"
          : "In Stock",
    }));
    const title = `Custom Inventory Report - ${new Date().toLocaleDateString(
      "en-IN"
    )}`;
    format === "pdf"
      ? generatePDF(reportData, title)
      : generateExcel(reportData, title);
    setReportModalOpen(false);
    setSelectedReportProducts([]);
    message.success("Report generated successfully!");
  };

  const generateMonthlyReport = () => {
    setGeneratingMonthly(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthName = now.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const updatedThisMonth = products.filter((p) => {
      if (!p.updatedAt) return false;
      return new Date(p.updatedAt) >= startOfMonth;
    });

    if (updatedThisMonth.length === 0) {
      message.info("No products updated this month");
      setGeneratingMonthly(false);
      return;
    }

    const reportData = updatedThisMonth.map((p) => ({
      Name: p.name || "Unnamed Product",
      "Product Code": p.product_code || "—",
      "Company Code": getCompanyCode(p.metaDetails),
      "Selling Price": getSellingPrice(p.metaDetails)
        ? `₹${getSellingPrice(p.metaDetails).toLocaleString("en-IN")}`
        : "—",
      Stock: p.quantity,
      Status:
        p.quantity === 0
          ? "Out of Stock"
          : p.quantity <= lowStockThreshold
          ? "Low Stock"
          : "In Stock",
      "Last Updated": new Date(p.updatedAt).toLocaleDateString("en-IN"),
    }));

    generatePDF(
      reportData,
      `Monthly Report - ${monthName} (${updatedThisMonth.length} updated)`
    );
    setGeneratingMonthly(false);
    message.success(
      `Monthly report generated – ${updatedThisMonth.length} products`
    );
  };

  const openStockModal = (product, action) => {
    setSelectedProduct(product);
    setStockAction(action);
    setStockModalOpen(true);
    stockForm.resetFields();
  };

  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setHistoryModalOpen(true);
  };

  const handleStockSubmit = async (values) => {
    try {
      if (stockAction === "add") {
        await addStock({
          productId: selectedProduct.productId,
          quantity: values.quantity,
        }).unwrap();
        message.success(`Added ${values.quantity} units`);
      } else {
        await removeStock({
          productId: selectedProduct.productId,
          quantity: values.quantity,
        }).unwrap();
        message.success(`Removed ${values.quantity} units`);
      }
    } catch (err) {
      message.error(err?.data?.message || "Failed to update stock");
    } finally {
      setStockModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      width: 70,
      render: (images) => (
        <img
          src={parseImages(images)[0]}
          alt="Product"
          style={{
            width: 50,
            height: 50,
            objectFit: "cover",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
          }}
        />
      ),
    },
    {
      title: "Product",
      dataIndex: "name",
      render: (_, record) => (
        <div>
          <Link to={`/product/${record.productId}`} style={{ fontWeight: 500 }}>
            {record.name || "Unnamed Product"}
          </Link>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {record.product_code && (
              <Text code className="black-code">
                {record.product_code}
              </Text>
            )}

            {record.product_code &&
              getCompanyCode(record.metaDetails) !== "N/A" &&
              " • "}

            <Text code className="black-code">
              {getCompanyCode(record.metaDetails)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "metaDetails",
      responsive: ["md"], // Hide on mobile
      render: (meta) => {
        const price = getSellingPrice(meta);
        return price != null ? (
          <strong>₹{price.toLocaleString("en-IN")}</strong>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      align: "center",
      render: (qty) => {
        if (qty === 0) return <Tag color="red">Out</Tag>;
        if (qty <= lowStockThreshold)
          return <Tag color="orange">{qty} Low</Tag>;
        return <Tag color="green">{qty}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openStockModal(record, "add")}
          />
          <Button
            size="small"
            danger
            icon={<MinusOutlined />}
            disabled={record.quantity === 0}
            onClick={() => openStockModal(record, "remove")}
          />
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => openHistoryModal(record)}
          />
        </Space>
      ),
    },
  ];

  // Handle page change
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <Empty description="Failed to load products" />;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Inventory Management"
          subtitle="Track stock levels, add/remove stock, and view history"
          exportOptions={{ pdf: false, excel: false }}
        />

        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={8}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search products..."
                allowClear
                size="large"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>

            <Col xs={24} md={12} lg={16}>
              <Space
                direction={isMobile ? "vertical" : "horizontal"}
                wrap
                style={{ width: "100%", justifyContent: "flex-end" }}
              >
                {/* Price Filter */}
                <Space size="small">
                  <Text>Price:</Text>
                  <InputNumber
                    placeholder="Min"
                    size="middle"
                    value={priceRange[0]}
                    onChange={(v) => setPriceRange([v, priceRange[1]])}
                  />
                  <Text>to</Text>
                  <InputNumber
                    placeholder="Max"
                    size="middle"
                    value={priceRange[1]}
                    onChange={(v) => setPriceRange([priceRange[0], v])}
                  />
                  <Button
                    size="small"
                    onClick={() => setPriceRange([null, null])}
                  >
                    Clear
                  </Button>
                </Space>

                {/* Max Stock */}
                <Space size="small">
                  <Text>Max ≤</Text>
                  <InputNumber
                    size="middle"
                    value={maxStockFilter}
                    onChange={setMaxStockFilter}
                  />
                  <Button size="small" onClick={() => setMaxStockFilter(null)}>
                    Clear
                  </Button>
                </Space>

                {/* Low Stock Threshold */}
                <Space size="small">
                  <Text>Low alert:</Text>
                  <InputNumber
                    min={1}
                    size="middle"
                    value={lowStockThreshold}
                    onChange={(v) => setLowStockThreshold(v || 10)}
                  />
                </Space>
              </Space>
            </Col>
          </Row>

          {/* Action Buttons - Right aligned, stack on mobile */}
          <div
            style={{ marginTop: 16, textAlign: isMobile ? "left" : "right" }}
          >
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              size="middle"
              wrap
            >
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => setReportModalOpen(true)}
                style={{ backgroundColor: "#333333" }}
              >
                Build Report
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={generateMonthlyReport}
                loading={generatingMonthly}
              >
                Monthly Report
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/product/add")}
                style={{ backgroundColor: "#333333" }}
              >
                Add Product
              </Button>
            </Space>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarGutter={isMobile ? 10 : 30}
          size={isMobile ? "small" : "middle"}
        >
          <TabPane tab={`All (${counts.all})`} key="all" />
          <TabPane tab={`In Stock (${counts.inStock})`} key="in-stock" />
          <TabPane tab={`Low (${counts.lowStock})`} key="low-stock" />
          <TabPane tab={`Out (${counts.outStock})`} key="out-of-stock" />
        </Tabs>

        {tabFilteredProducts.length === 0 ? (
          <Empty description="No products found" />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <Table
                columns={columns}
                dataSource={tabFilteredProducts}
                rowKey="productId"
                pagination={false}
                bordered
                loading={isFetching}
              />
            </div>

            {/* Pagination Controls */}
            <div style={{ marginTop: 24, textAlign: "right" }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={["10", "25", "50", "100"]}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} products`
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Modals remain unchanged */}
      <ReportBuilderModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        products={products}
        getCompanyCode={getCompanyCode}
        getSellingPrice={getSellingPrice}
        generatePDF={generatePDF}
        generateExcel={generateExcel}
        onGenerate={generateCustomReport}
        selectedProducts={selectedReportProducts}
        setSelectedProducts={setSelectedReportProducts}
      />
      <StockModal
        open={stockModalOpen}
        onCancel={() => {
          setStockModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        action={stockAction}
      />
      <HistoryModalAntD
        open={historyModalOpen}
        onCancel={() => {
          setHistoryModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
};

export default InventoryWrapper;
