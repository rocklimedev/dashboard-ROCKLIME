import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Spin,
  Pagination,
  Empty,
  Table,
  Button,
  Dropdown,
  Menu,
  Tabs,
  InputNumber,
  Badge,
  Space,
  Typography,
  message,
} from "antd";
import {
  SearchOutlined,
  MoreOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import {
  useGetAllProductsQuery,
  useAddStockMutation,
  useRemoveStockMutation,
} from "../../api/productApi";
import { toast } from "sonner";
import StockModal from "../Common/StockModal";
import HistoryModal from "../Common/HistoryModal";
import PageHeader from "../Common/PageHeader";
import pos from "../../assets/img/default.png";
import { CopyOutlined } from "@ant-design/icons";

const { TabPane } = Tabs;
const { Text } = Typography;

const InventoryWrapper = () => {
  const navigate = useNavigate();
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const [addStock, { isLoading: isAddingStock }] = useAddStockMutation();
  const [removeStock, { isLoading: isRemovingStock }] =
    useRemoveStockMutation();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(10); // User-defined
  const [maxStockFilter, setMaxStockFilter] = useState(null); // ≤ quantity filter

  const [isStockModalVisible, setStockModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockHistoryMap, setStockHistoryMap] = useState({});

  const [form] = Form.useForm();
  const itemsPerPage = 30;

  // Parse images safely
  const parseImages = (images) => {
    try {
      if (typeof images === "string") {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [pos];
      }
      return Array.isArray(images) ? images : [pos];
    } catch {
      return [pos];
    }
  };

  // Extract company code
  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails)) return "N/A";
    const entry = metaDetails.find(
      (d) => d.slug?.toLowerCase() === "companycode"
    );
    return entry ? String(entry.value) : "N/A";
  };

  // Base products
  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : []),
    [productsData]
  );

  // Filter: Search + Max Stock
  const searchedAndFiltered = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.product_code?.toLowerCase().includes(term) ||
        getCompanyCode(p.metaDetails)?.toLowerCase().includes(term);

      const matchesMaxStock =
        maxStockFilter === null || p.quantity <= maxStockFilter;

      return matchesSearch && matchesMaxStock;
    });
  }, [products, search, maxStockFilter]);

  // Tab-based filtering
  const tabFilteredProducts = useMemo(() => {
    switch (activeTab) {
      case "in-stock":
        return searchedAndFiltered.filter((p) => p.quantity > 0);
      case "out-of-stock":
        return searchedAndFiltered.filter((p) => p.quantity === 0);
      case "low-stock":
        return searchedAndFiltered.filter(
          (p) => p.quantity > 0 && p.quantity <= lowStockThreshold
        );
      default:
        return searchedAndFiltered;
    }
  }, [searchedAndFiltered, activeTab, lowStockThreshold]);

  // Pagination
  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = useMemo(
    () => tabFilteredProducts.slice(offset, offset + itemsPerPage),
    [tabFilteredProducts, currentPage, itemsPerPage]
  );

  const totalItems = tabFilteredProducts.length;

  // Reset page on filter/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, maxStockFilter]);

  // Actions
  const handleAddProduct = () => navigate("/inventory/product/add");
  const handleCopy = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    message.success("Copied to clipboard");
  };

  const handleStockClick = (product, action = "add") => {
    setSelectedProduct({ ...product, action });
    setStockModalVisible(true);
  };

  const handleHistoryClick = (product) => {
    setSelectedProduct(product);
    setHistoryModalVisible(true);
  };

  const handleStockSubmit = async (stockData) => {
    const { productId, quantity, action } = stockData;
    try {
      if (action === "add") {
        await addStock({ productId, quantity }).unwrap();
      } else {
        await removeStock({ productId, quantity }).unwrap();
      }
      setStockHistoryMap((prev) => ({
        ...prev,
        [productId]: [
          ...(prev[productId] || []),
          { quantity, action, date: new Date(), productId },
        ],
      }));
    } catch (err) {
      toast.error(`Failed: ${err.data?.message || "Unknown error"}`);
    } finally {
      setStockModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const menu = (product) => (
    <Menu>
      <Menu.Item key="add" onClick={() => handleStockClick(product, "add")}>
        Add Stock
      </Menu.Item>
      <Menu.Item
        key="remove"
        onClick={() => handleStockClick(product, "remove")}
        disabled={product.quantity === 0}
      >
        Remove Stock
      </Menu.Item>
      <Menu.Item key="history" onClick={() => handleHistoryClick(product)}>
        View History
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      key: "images",
      width: 80,
      render: (images) => (
        <img
          src={parseImages(images)[0] || pos}
          alt="Product"
          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 6 }}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Link to={`/product/${record.productId}`} style={{ fontWeight: 500 }}>
          {text || "N/A"}
        </Link>
      ),
    },
    {
      title: "Company Code",
      dataIndex: "product_code",
      key: "product_code",
      render: (text) => (
        <Text
          code
          onClick={() => handleCopy(text)}
          style={{ cursor: text ? "pointer" : "default", userSelect: "none" }}
        >
          {text || "N/A"}
        </Text>
      ),
    },
    {
      title: "Product Code",
      dataIndex: "metaDetails",
      key: "company_code",
      render: (meta) => {
        const companyCode = getCompanyCode(meta);
        return (
          <Text
            code
            onClick={() => handleCopy(companyCode)}
            style={{
              cursor: companyCode ? "pointer" : "default",
              userSelect: "none",
            }}
          >
            {companyCode || "N/A"}
          </Text>
        );
      },
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty) => (
        <Badge
          status={
            qty > 0
              ? qty <= lowStockThreshold
                ? "warning"
                : "success"
              : "error"
          }
          text={
            qty > 0 ? (
              `${qty} in stock`
            ) : (
              <span style={{ color: "#ff4d4f" }}>Out of Stock</span>
            )
          }
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Dropdown overlay={menu(record)} trigger={["click"]}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  // Count for tabs
  const counts = useMemo(() => {
    const inStock = products.filter((p) => p.quantity > 0).length;
    const outStock = products.filter((p) => p.quantity === 0).length;
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= lowStockThreshold
    ).length;
    return { all: products.length, inStock, outStock, lowStock };
  }, [products, lowStockThreshold]);

  if (isLoading) {
    return (
      <div className="loading-container text-center py-5">
        <Spin size="large" />
        <p>Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="error-container text-center py-5">
            <Empty
              description={`Error: ${error?.data?.message || "Unknown error"}`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Inventory Management"
          subtitle="Manage stock levels, track history, and filter products"
          exportOptions={{ pdf: false, excel: false }}
          extra={
            <Button type="primary" onClick={handleAddProduct}>
              Add Product
            </Button>
          }
        />

        {/* Filters Bar */}
        <div className="filter-bar bg-white p-3 shadow-sm mb-3 border-radius-md">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Form
              layout="inline"
              style={{ justifyContent: "space-between", flexWrap: "wrap" }}
            >
              <Space wrap>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search by name, code..."
                  allowClear
                  size="large"
                  style={{ minWidth: 250 }}
                  onChange={(e) => setSearch(e.target.value)}
                  value={search}
                />

                <Space>
                  <Text>Show products with stock ≤</Text>
                  <InputNumber
                    min={0}
                    placeholder="Qty"
                    size="middle"
                    value={maxStockFilter}
                    onChange={(val) => setMaxStockFilter(val)}
                    style={{ width: 100 }}
                  />
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setMaxStockFilter(null)}
                    disabled={maxStockFilter === null}
                  >
                    Clear
                  </Button>
                </Space>
              </Space>
            </Form>

            {/* Low Stock Threshold */}
            <Space align="center">
              <Text type="secondary">Low stock threshold:</Text>
              <InputNumber
                min={1}
                max={1000}
                value={lowStockThreshold}
                onChange={(val) => setLowStockThreshold(val || 10)}
                style={{ width: 80 }}
              />
              <Text type="secondary">units</Text>
            </Space>
          </Space>
        </div>

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane
            tab={
              <span>
                All{" "}
                <Badge
                  count={counts.all}
                  style={{ backgroundColor: "#52c41a" }}
                />
              </span>
            }
            key="all"
          />
          <TabPane
            tab={
              <span>
                In Stock{" "}
                <Badge
                  count={counts.inStock}
                  style={{ backgroundColor: "#1890ff" }}
                />
              </span>
            }
            key="in-stock"
          />
          <TabPane
            tab={
              <span>
                Out of Stock{" "}
                <Badge
                  count={counts.outStock}
                  style={{ backgroundColor: "#ff4d4f" }}
                />
              </span>
            }
            key="out-of-stock"
          />
          <TabPane
            tab={
              <span>
                Low Stock{" "}
                <Badge
                  count={counts.lowStock}
                  style={{ backgroundColor: "#faad14" }}
                />
              </span>
            }
            key="low-stock"
          />
        </Tabs>

        {/* Table */}
        {totalItems === 0 ? (
          <div className="bg-white p-5 text-center">
            <Empty description="No products match your filters." />
          </div>
        ) : (
          <div className="products-section bg-white shadow-sm">
            <Table
              columns={columns}
              dataSource={currentItems}
              rowKey="productId"
              pagination={false}
              scroll={{ x: 800 }}
            />
            <div
              className="pagination-container"
              style={{ padding: "16px", textAlign: "right" }}
            >
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={itemsPerPage}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                size="default"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <StockModal
        visible={isStockModalVisible}
        onHide={() => {
          setStockModalVisible(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSubmit={(data) =>
          handleStockSubmit({ ...data, action: selectedProduct?.action })
        }
        loading={isAddingStock || isRemovingStock}
      />

      <HistoryModal
        visible={isHistoryModalVisible}
        onHide={() => {
          setHistoryModalVisible(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        stockHistory={stockHistoryMap[selectedProduct?.productId] || []}
      />
    </div>
  );
};

export default InventoryWrapper;
