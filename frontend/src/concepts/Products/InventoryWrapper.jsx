import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Table,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  message,
  Empty,
  Row,
  Col,
  Grid,
  Pagination,
  Tag,
  Card,
  Spin,
  Tooltip,
  Dropdown,
  Menu,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  HistoryOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined,
  MoreOutlined,
} from "@ant-design/icons";

import StockModal from "../../components/modals/StockModal";
import {
  useGetAllProductsQuery,
  useAddStockMutation,
  useRemoveStockMutation,
  useDeleteProductMutation,
} from "../../api/productApi";

import PageHeader from "../../components/Common/PageHeader";
import pos from "../../assets/img/default.png";
import HistoryModalAntD from "../../components/modals/HistoryModal";
import ReportBuilderModal from "../../components/modals/ReportBuilderModal";
import DeleteModal from "../../components/Common/DeleteModal";
import PermissionGate from "../../context/PermissionGate";
import { generatePDF, generateExcel } from "../../utils/helpers";

const { Text } = Typography;

const InventoryWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  // Initial values from URL
  const queryParams = new URLSearchParams(location.search);
  const urlTab = queryParams.get("tab");
  const validTabs = ["all", "in-stock", "low-stock", "out-of-stock"];
  const initialTab = validTabs.includes(urlTab) ? urlTab : "all";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentPage, setCurrentPage] = useState(
    Number(queryParams.get("page")) || 1,
  );
  const [pageSize, setPageSize] = useState(() => {
    const limit = Number(queryParams.get("limit"));
    return [10, 25, 50, 100].includes(limit) ? limit : 50;
  });

  const [search, setSearch] = useState(queryParams.get("search") || "");
  const [lowStockThreshold, setLowStockThreshold] = useState(
    Number(queryParams.get("lowStockThreshold")) || 10,
  );
  const [maxStockFilter, setMaxStockFilter] = useState(null);
  const [priceRange, setPriceRange] = useState([null, null]);

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState("add");
  const [selectedReportProducts, setSelectedReportProducts] = useState([]);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);

  // Main Inventory Query
  const queryArgs = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      search: search.trim() || undefined,
      tab: activeTab,
      lowStockThreshold:
        activeTab === "low-stock" ? lowStockThreshold : undefined,
    }),
    [currentPage, pageSize, search, activeTab, lowStockThreshold],
  );

  const {
    data: response,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllProductsQuery(queryArgs, { refetchOnMountOrArgChange: true });

  const [addStock] = useAddStockMutation();
  const [removeStock] = useRemoveStockMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const products = useMemo(() => response?.data || [], [response?.data]);
  const paginationInfo = response?.pagination || {
    total: 0,
    page: 1,
    limit: 50,
  };

  // Separate query for Monthly Report - ENABLED (No skip)
  const {
    data: allProductsResponse,
    isFetching: isFetchingAll,
    refetch: refetchAllProducts,
  } = useGetAllProductsQuery(
    { page: 1, limit: 1000, tab: "all", search: undefined },
    { skip: false },
  );
  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails) || !metaDetails.length) return "N/A";
    const last = metaDetails[metaDetails.length - 1];
    if (last?.value && typeof last.value === "string" && last.value.trim()) {
      return last.value.trim();
    }
    const codeLike = metaDetails.find((d) =>
      d.value?.match?.(/^[A-Za-z0-9]{6,12}$/),
    );
    return codeLike ? String(codeLike.value).trim() : "N/A";
  };

  const getSellingPrice = (metaDetails) => {
    if (!Array.isArray(metaDetails) || !metaDetails.length) return null;
    for (const d of metaDetails) {
      const val = String(d.value || "").trim();
      if (
        !val ||
        val.match(/^[0-9a-f-]{30,}/i) ||
        (val.match(/^[A-Za-z0-9]{8,12}$/) && !val.includes("."))
      )
        continue;
      const num = Number(val);
      if (!isNaN(num) && num > 10) return num;
    }
    for (let i = metaDetails.length - 1; i >= 0; i--) {
      const num = Number(metaDetails[i].value);
      if (!isNaN(num) && num > 50) return num;
    }
    return null;
  };
  // Client-side extra filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesMax =
        maxStockFilter === null || p.quantity <= maxStockFilter;
      const price = getSellingPrice(p.metaDetails);
      const matchesPrice =
        (priceRange[0] == null || price >= priceRange[0]) &&
        (priceRange[1] == null || price <= priceRange[1]);
      return matchesMax && matchesPrice;
    });
  }, [products, maxStockFilter, priceRange]);

  // Fixed Tab Counts
  const counts = useMemo(() => {
    const hasExtraFilter =
      maxStockFilter !== null ||
      priceRange[0] !== null ||
      priceRange[1] !== null;

    if (hasExtraFilter) {
      const inStock = filteredProducts.filter((p) => p.quantity > 0).length;
      const lowStock = filteredProducts.filter(
        (p) => p.quantity > 0 && p.quantity <= lowStockThreshold,
      ).length;
      const outStock = filteredProducts.filter((p) => p.quantity === 0).length;

      return { all: filteredProducts.length, inStock, lowStock, outStock };
    }

    const currentInStock = products.filter((p) => p.quantity > 0).length;
    const currentLowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= lowStockThreshold,
    ).length;
    const currentOutStock = products.filter((p) => p.quantity === 0).length;

    return {
      all: paginationInfo.total,
      inStock: activeTab === "in-stock" ? paginationInfo.total : currentInStock,
      lowStock:
        activeTab === "low-stock" ? paginationInfo.total : currentLowStock,
      outStock:
        activeTab === "out-of-stock" ? paginationInfo.total : currentOutStock,
    };
  }, [
    filteredProducts,
    products,
    paginationInfo.total,
    activeTab,
    maxStockFilter,
    priceRange,
    lowStockThreshold,
  ]);

  // URL Sync
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (activeTab === "all") params.delete("tab");
    else params.set("tab", activeTab);
    if (currentPage <= 1) params.delete("page");
    else params.set("page", currentPage);
    if (pageSize === 50) params.delete("limit");
    else params.set("limit", pageSize);

    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");

    if (activeTab === "low-stock" && lowStockThreshold !== 10) {
      params.set("lowStockThreshold", lowStockThreshold);
    } else {
      params.delete("lowStockThreshold");
    }

    const newSearch = params.toString();
    if (newSearch !== location.search.slice(1)) {
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ""}`, {
        replace: true,
      });
    }
  }, [
    activeTab,
    currentPage,
    pageSize,
    search,
    lowStockThreshold,
    location.pathname,
    navigate,
  ]);

  // Auto-switch to low-stock from dashboard
  useEffect(() => {
    if (queryParams.has("low_stock") && activeTab === "all") {
      setActiveTab("low-stock");
      const newParams = new URLSearchParams(location.search);
      newParams.delete("low_stock");
      newParams.set("tab", "low-stock");
      navigate(`${location.pathname}?${newParams}`, { replace: true });
    }
  }, [location.search, activeTab, navigate]);

  const handleTabChange = (key) => {
    setCurrentPage(1);
    setActiveTab(key);
  };

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  // Helper Functions
  const parseImages = (images) => {
    try {
      if (typeof images === "string") {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) && parsed.length ? parsed : [pos];
      }
      return Array.isArray(images) && images.length ? images : [pos];
    } catch {
      return [pos];
    }
  };

  // ==================== FIXED MONTHLY REPORT ====================
  const generateMonthlyReport = async () => {
    setGeneratingMonthly(true);

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthName = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      // Use refetch to get fresh data
      const freshResponse = await refetchAllProducts().unwrap();
      const allProducts =
        freshResponse?.data || allProductsResponse?.data || [];

      const updatedThisMonth = allProducts.filter((p) => {
        if (!p.updatedAt) return false;
        return new Date(p.updatedAt) >= startOfMonth;
      });

      if (updatedThisMonth.length === 0) {
        message.info("No products were updated this month");
        setGeneratingMonthly(false);
        return;
      }

      // New Monthly Report Format
      const reportData = updatedThisMonth.map((p, index) => {
        const companyCode = getCompanyCode(p.metaDetails);
        const currentQty = Number(p.quantity) || 0;
        const difference = 0; // TODO: Add real difference from history later
        const netQuantity = currentQty + difference;

        return {
          "S.No": index + 1,
          "Company Code": companyCode || "—",
          Name: p.name || "Unnamed Product",
          Quantity: currentQty,
          Difference: difference,
          "Net Quantity": netQuantity,
        };
      });

      generatePDF(
        reportData,
        `Monthly Stock Report - ${monthName} (${updatedThisMonth.length} updated)`,
      );

      message.success(
        `Monthly report generated – ${updatedThisMonth.length} products`,
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to generate monthly report. Please try again.");
    } finally {
      setGeneratingMonthly(false);
    }
  };

  // Handlers
  const openStockModal = (product, action) => {
    setSelectedProduct(product);
    setStockAction(action);
    setStockModalOpen(true);
  };

  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setHistoryModalOpen(true);
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.productId) return;
    try {
      await deleteProduct(selectedProduct.productId).unwrap();
      message.success("Product deleted successfully");
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to delete product");
    } finally {
      setDeleteModalVisible(false);
      setSelectedProduct(null);
    }
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
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to update stock");
    } finally {
      setStockModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const generateCustomReport = (format) => {
    const selectedData = products.filter((p) =>
      selectedReportProducts.includes(p.productId),
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
      "en-IN",
    )}`;
    if (format === "pdf") generatePDF(reportData, title);
    else generateExcel(reportData, title);
    setReportModalOpen(false);
    setSelectedReportProducts([]);
    message.success("Report generated successfully!");
  };

  const moreMenu = (record) => (
    <Menu>
      <Menu.Item key="edit">
        <Link to={`/product/${record.productId}/edit`}>Edit Product</Link>
      </Menu.Item>
      <PermissionGate api="delete" module="products">
        <Menu.Item
          danger
          key="delete"
          onClick={() => handleDeleteClick(record)}
        >
          Delete Product
        </Menu.Item>
      </PermissionGate>
    </Menu>
  );

  // Table Columns
  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      width: 80,
      render: (images) => (
        <img
          src={parseImages(images)[0]}
          alt="Product"
          style={{
            width: 56,
            height: 56,
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
          <Link to={`/product/${record.productId}`} className="product-link">
            {record.name || "Unnamed Product"}
          </Link>
          <div className="product-codes">
            {record.product_code && (
              <Tag className="code-tag">{record.product_code}</Tag>
            )}
            <Tag className="code-tag">{getCompanyCode(record.metaDetails)}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      responsive: ["md"],
      render: (_, r) => {
        const price = getSellingPrice(r.metaDetails);
        return price ? (
          <strong className="price-text">
            ₹{price.toLocaleString("en-IN")}
          </strong>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
      align: "right",
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      align: "center",
      width: 120,
      render: (qty) => {
        if (qty === 0) return <Tag color="error">Out of Stock</Tag>;
        if (qty <= lowStockThreshold)
          return <Tag color="warning">{qty} Low</Tag>;
        return <Tag color="success">{qty} In Stock</Tag>;
      },
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      responsive: ["lg"],
      width: 140,
      render: (date) =>
        date ? (
          <Tooltip title={new Date(date).toLocaleString()}>
            <Text type="secondary">
              {new Date(date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "2-digit",
              })}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: isMobile ? false : "right",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => openStockModal(record, "add")}
          />
          <Button
            type="text"
            danger
            icon={<MinusOutlined />}
            disabled={record.quantity === 0}
            onClick={() => openStockModal(record, "remove")}
          />
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => openHistoryModal(record)}
          />

          <PermissionGate api="edit|delete" module="products">
            <Dropdown overlay={moreMenu(record)} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          background: "#f9fafb",
        }}
      >
        <Spin size="large" />
        <Text style={{ marginTop: 16 }} type="secondary">
          Loading inventory...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ marginTop: 24, textAlign: "center" }}>
        <Empty
          description="Failed to load inventory data"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Inventory"
          subtitle="Manage stock levels, update quantities, and generate reports"
          exportOptions={{ pdf: false, excel: false }}
        />

        {/* Filter Controls */}
        <Card
          bordered={false}
          style={{
            marginTop: 24,
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            background: "white",
          }}
          bodyStyle={{ padding: isMobile ? "16px" : "24px" }}
        >
          <Row gutter={[12, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search by name, code..."
                allowClear
                size="large"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Col>

            <Col xs={12} sm={6} md={5} lg={4}>
              <InputNumber
                placeholder="Low Stock ≤"
                min={1}
                size="large"
                style={{ width: "100%" }}
                value={lowStockThreshold}
                onChange={(v) => setLowStockThreshold(v || 10)}
              />
            </Col>

            <Col xs={12} sm={6} md={5} lg={4}>
              <InputNumber
                placeholder="Max Stock"
                min={0}
                size="large"
                style={{ width: "100%" }}
                value={maxStockFilter}
                onChange={setMaxStockFilter}
              />
            </Col>

            <Col xs={24} sm={12} md={6} lg={5}>
              <Space.Compact style={{ width: "100%" }}>
                <InputNumber
                  placeholder="Min ₹"
                  min={0}
                  style={{ flex: 1 }}
                  value={priceRange[0]}
                  onChange={(v) => setPriceRange([v, priceRange[1]])}
                />
                <InputNumber
                  placeholder="Max ₹"
                  min={0}
                  style={{ flex: 1 }}
                  value={priceRange[1]}
                  onChange={(v) => setPriceRange([priceRange[0], v])}
                />
              </Space.Compact>
            </Col>

            <Col
              xs={24}
              sm="auto"
              style={{ textAlign: isMobile ? "center" : "right" }}
            >
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearch("");
                  setPriceRange([null, null]);
                  setMaxStockFilter(null);
                  setLowStockThreshold(10);
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </Col>
          </Row>

          {/* Action Bar */}
          <div
            style={{ marginTop: 16, textAlign: isMobile ? "center" : "right" }}
          >
            <Space wrap size="middle">
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
                loading={generatingMonthly || isFetchingAll}
                disabled={isFetchingAll}
              >
                Monthly Report
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/product/add")}
              >
                Add New Product
              </Button>
            </Space>
          </div>
        </Card>

        {/* Status Chips */}
        <div style={{ margin: "24px 0" }}>
          <Space wrap size={[8, 12]}>
            {[
              { key: "all", label: "All", count: counts.all, color: "default" },
              {
                key: "in-stock",
                label: "In Stock",
                count: counts.inStock,
                color: "green",
              },
              {
                key: "low-stock",
                label: "Low Stock",
                count: counts.lowStock,
                color: "orange",
              },
              {
                key: "out-of-stock",
                label: "Out of Stock",
                count: counts.outStock,
                color: "red",
              },
            ].map((item) => (
              <Tag
                key={item.key}
                color={activeTab === item.key ? item.color : "default"}
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  cursor: "pointer",
                  borderRadius: 20,
                  fontWeight: activeTab === item.key ? 600 : 400,
                }}
                onClick={() => handleTabChange(item.key)}
              >
                {item.label} ({item.count})
              </Tag>
            ))}
          </Space>
        </div>

        {filteredProducts.length === 0 ? (
          <Card
            bordered={false}
            style={{
              marginTop: 24,
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              background: "white",
              textAlign: "center",
              padding: "60px 20px",
            }}
          >
            <Empty description="No products match your filters" />
          </Card>
        ) : (
          <>
            <Card
              bordered={false}
              style={{
                marginTop: 24,
                borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                background: "white",
                overflow: "hidden",
              }}
            >
              <Table
                columns={columns}
                dataSource={filteredProducts}
                rowKey="productId"
                pagination={false}
                loading={isFetching}
                scroll={{ x: isMobile ? "max-content" : undefined }}
                rowClassName={(record) =>
                  record.quantity === 0
                    ? "stock-critical"
                    : record.quantity <= lowStockThreshold
                      ? "stock-warning"
                      : "stock-ok"
                }
              />
            </Card>

            <div
              style={{ marginTop: 24, padding: "16px 0", textAlign: "center" }}
            >
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={paginationInfo.total}
                onChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={["10", "25", "50", "100"]}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} products`
                }
              />
            </div>
          </>
        )}

        {/* Modals */}
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
          onSubmit={handleStockSubmit}
        />

        <HistoryModalAntD
          open={historyModalOpen}
          onCancel={() => {
            setHistoryModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />

        <DeleteModal
          isVisible={deleteModalVisible}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalVisible(false);
            setSelectedProduct(null);
          }}
          item={selectedProduct}
          itemType="Product"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default InventoryWrapper;
