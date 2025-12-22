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
  Badge,
  Pagination,
  Empty,
  Form,
  Row,
  Grid,
  Col,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  HistoryOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  FileTextOutlined,
  DownloadOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import StockModal from "../Common/StockModal"; // Adjust path as neededs
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
const { Text, Title } = Typography;

const InventoryWrapper = () => {
  const navigate = useNavigate();

  const { data: productsData, error } = useGetAllProductsQuery();
  const [addStock] = useAddStockMutation();
  const [removeStock] = useRemoveStockMutation();

  // UI States
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [maxStockFilter, setMaxStockFilter] = useState(null);
  const [priceRange, setPriceRange] = useState([null, null]);
  const [priceSort, setPriceSort] = useState(null);

  // Modals
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState("add");
  const [selectedReportProducts, setSelectedReportProducts] = useState([]);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);

  const [stockForm] = Form.useForm();
  const itemsPerPage = 30;

  // Responsive breakpoint (optional – helps fine-tune)
  const screens = Grid.useBreakpoint(); // AntD v5+ has this; if v4, remove or use media queries
  const isMobile = !screens.md;

  // ──────── Helpers ────────
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
    if (!Array.isArray(metaDetails)) return "N/A";
    const entry = metaDetails.find(
      (d) => d.slug?.toLowerCase() === "companycode"
    );
    return entry ? String(entry.value || "N/A") : "N/A";
  };

  const getSellingPrice = (metaDetails) => {
    if (!Array.isArray(metaDetails)) return null;
    const entry = metaDetails.find(
      (d) => d.slug?.toLowerCase() === "sellingprice"
    );
    return entry ? Number(entry.value) : null;
  };

  // ──────── Data Preparation ────────
  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : []),
    [productsData]
  );

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

  const tabFilteredProducts = useMemo(() => {
    switch (activeTab) {
      case "in-stock":
        return filteredProducts.filter((p) => p.quantity > 0);
      case "out-of-stock":
        return filteredProducts.filter((p) => p.quantity === 0);
      case "low-stock":
        return filteredProducts.filter(
          (p) => p.quantity > 0 && p.quantity <= lowStockThreshold
        );
      default:
        return filteredProducts;
    }
  }, [filteredProducts, activeTab, lowStockThreshold]);

  const sortedProducts = useMemo(() => {
    if (!priceSort) return tabFilteredProducts;
    return [...tabFilteredProducts].sort((a, b) => {
      const priceA = getSellingPrice(a.metaDetails) ?? -Infinity;
      const priceB = getSellingPrice(b.metaDetails) ?? -Infinity;
      return priceSort === "asc" ? priceA - priceB : priceB - priceA;
    });
  }, [tabFilteredProducts, priceSort]);

  const currentItems = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalItems = sortedProducts.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, maxStockFilter, priceRange, priceSort]);

  const counts = useMemo(() => {
    const inStock = products.filter((p) => p.quantity > 0).length;
    const outStock = products.filter((p) => p.quantity === 0).length;
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= lowStockThreshold
    ).length;
    return { all: products.length, inStock, outStock, lowStock };
  }, [products, lowStockThreshold]);

  // ──────── Report & Actions ────────
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
  // ──────── Responsive Columns (hide less critical on mobile) ────────
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
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            {record.product_code && <Text code>{record.product_code}</Text>}
            {record.product_code &&
              getCompanyCode(record.metaDetails) !== "N/A" &&
              " • "}
            <Text code>{getCompanyCode(record.metaDetails)}</Text>
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

  if (!productsData && !error) return null;
  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <Empty description="Failed to load products" />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Inventory Management"
          subtitle="Track stock levels, add/remove stock, and view history"
          exportOptions={{ pdf: false, excel: false }}
        />

        {/* Responsive Filters */}
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
              >
                Add Product
              </Button>
            </Space>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Table */}
        {totalItems === 0 ? (
          <Empty description="No products found" />
        ) : (
          <>
            <div style={{ overflowX: "auto", marginBottom: 16 }}>
              <Table
                columns={columns}
                dataSource={currentItems}
                rowKey="productId"
                pagination={false}
                bordered
                size={isMobile ? "small" : "middle"}
              />
            </div>

            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={itemsPerPage}
              onChange={setCurrentPage}
              showTotal={(total) => `Total ${total} products`}
              responsive
              style={{ textAlign: "center", marginTop: 16 }}
            />
          </>
        )}
      </div>

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
        action={stockAction} // "add" or "remove"
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
