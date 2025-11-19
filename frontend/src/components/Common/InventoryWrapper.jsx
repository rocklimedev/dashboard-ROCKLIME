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
  Tabs,
  InputNumber,
  Badge,
  Space,
  Typography,
  message,
  Modal,
  Alert,
  Form as AntForm,
} from "antd";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
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
import PageHeader from "../Common/PageHeader";
import pos from "../../assets/img/default.png";
import { useGetHistoryByProductIdQuery } from "../../api/productApi";
import { Dropdown } from "react-bootstrap";
import HistoryModalAntD from "./HistoryModal";
const { TabPane } = Tabs;
const { Text } = Typography;

const InventoryWrapper = () => {
  const navigate = useNavigate();
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const [addStock, { isLoading: isAddingStock }] = useAddStockMutation();
  const [removeStock, { isLoading: isRemovingStock }] =
    useRemoveStockMutation();

  // ────── State ──────
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [maxStockFilter, setMaxStockFilter] = useState(null);
  const [priceRange, setPriceRange] = useState([null, null]);

  // **New** – sort state
  const [priceSort, setPriceSort] = useState(null); // or "asc" | "desc" | null
  // Modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState("add");

  const itemsPerPage = 30;
  const [stockForm] = AntForm.useForm();

  // ────── Helpers ──────
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

  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails)) return "N/A";
    const entry = metaDetails.find(
      (d) => d.slug && d.slug.toLowerCase() === "companycode"
    );
    return entry ? String(entry.value) : "N/A";
  };

  const getSellingPrice = (metaDetails) => {
    if (!Array.isArray(metaDetails)) return null;
    const entry = metaDetails.find(
      (d) => d.slug && d.slug.toLowerCase() === "sellingprice"
    );
    return entry ? Number(entry.value) : null;
  };

  // ────── Base products ──────
  const products = useMemo(() => {
    if (!Array.isArray(productsData)) {
      return [];
    }
    return productsData;
  }, [productsData]);

  // ────── Search + Max-Stock + Price-Range filter ──────
  const searchedAndFiltered = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.product_code && p.product_code.toLowerCase().includes(term)) ||
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

  // ────── Tab filter ──────
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

  // ────── **Price sorting** ──────
  const sortedProducts = useMemo(() => {
    if (!priceSort) return tabFilteredProducts;

    return [...tabFilteredProducts].sort((a, b) => {
      const priceA = getSellingPrice(a.metaDetails) ?? -Infinity;
      const priceB = getSellingPrice(b.metaDetails) ?? -Infinity;
      return priceSort === "asc" ? priceA - priceB : priceB - priceA;
    });
  }, [tabFilteredProducts, priceSort]);

  // ────── Pagination ──────
  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = useMemo(
    () => sortedProducts.slice(offset, offset + itemsPerPage),
    [sortedProducts, currentPage, itemsPerPage]
  );
  const totalItems = sortedProducts.length;

  // Reset page when any filter/tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, maxStockFilter, priceRange, priceSort]);

  // ────── Actions ──────
  const handleAddProduct = () => navigate("/inventory/product/add");

  const handleCopy = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    message.success("Copied to clipboard");
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
    const { quantity } = values;
    const payload = { productId: selectedProduct.productId, quantity };

    try {
      if (stockAction === "add") {
        await addStock(payload).unwrap();
        toast.success(`Added ${quantity} unit(s)`);
      } else {
        await removeStock(payload).unwrap();
        toast.success(`Removed ${quantity} unit(s)`);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    } finally {
      setStockModalOpen(false);
      setSelectedProduct(null);
    }
  };

  // ────── Dropdown ──────
  const ActionDropdown = ({ product }) => (
    <Dropdown>
      <Dropdown.Toggle
        variant="link"
        bsPrefix="p-0"
        id={`dropdown-${product.productId}`}
        className="text-muted"
        style={{ boxShadow: "none" }}
      >
        <MoreOutlined style={{ fontSize: 18 }} />
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        <Dropdown.Item onClick={() => openStockModal(product, "add")}>
          Add Stock
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => openStockModal(product, "remove")}
          disabled={product.quantity === 0}
        >
          Remove Stock
        </Dropdown.Item>
        <Dropdown.Item onClick={() => openHistoryModal(product)}>
          View History
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  // ────── Table Columns ──────
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
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
      render: (text) => (
        <Text
          code
          onClick={() => handleCopy(text)}
          style={{
            cursor: text ? "pointer" : "default",
            userSelect: "none",
          }}
        >
          {text || "N/A"}
        </Text>
      ),
    },
    {
      title: "Company Code",
      dataIndex: "metaDetails",
      key: "company_code",
      render: (meta) => {
        const companyCode = getCompanyCode(meta);
        return (
          <Text
            code
            onClick={() => handleCopy(companyCode)}
            style={{
              cursor: companyCode !== "N/A" ? "pointer" : "default",
              userSelect: "none",
            }}
          >
            {companyCode}
          </Text>
        );
      },
    },
    {
      title: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          Selling Price
          {priceSort === "asc" ? (
            <SortAscendingOutlined
              style={{ cursor: "pointer" }}
              onClick={() => setPriceSort("desc")}
            />
          ) : priceSort === "desc" ? (
            <SortDescendingOutlined
              style={{ cursor: "pointer" }}
              onClick={() => setPriceSort(null)}
            />
          ) : (
            <span
              style={{ cursor: "pointer", opacity: 0.4 }}
              onClick={() => setPriceSort("asc")}
            >
              <SortAscendingOutlined />
            </span>
          )}
        </div>
      ),
      dataIndex: "metaDetails",
      key: "sellingPrice",
      render: (meta) => {
        const price = getSellingPrice(meta);
        return price != null ? `₹${price.toLocaleString()}` : "N/A";
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
      render: (_, record) => <ActionDropdown product={record} />,
    },
  ];

  // ────── Tab counts ──────
  const counts = useMemo(() => {
    if (!Array.isArray(products)) {
      return { all: 0, inStock: 0, outStock: 0, lowStock: 0 };
    }
    const inStock = products.filter((p) => p.quantity > 0).length;
    const outStock = products.filter((p) => p.quantity === 0).length;
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= lowStockThreshold
    ).length;

    return {
      all: products.length,
      inStock,
      outStock,
      lowStock,
    };
  }, [products, lowStockThreshold]);

  // ────── Loading / Error ──────
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

  // ────── Render ──────
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

                {/* Price Range */}
                <Space>
                  <Text>Price range (₹)</Text>
                  <InputNumber
                    min={0}
                    placeholder="Min"
                    size="middle"
                    value={priceRange[0]}
                    onChange={(v) => setPriceRange([v, priceRange[1]])}
                    style={{ width: 100 }}
                  />
                  <Text>to</Text>
                  <InputNumber
                    min={0}
                    placeholder="Max"
                    size="middle"
                    value={priceRange[1]}
                    onChange={(v) => setPriceRange([priceRange[0], v])}
                    style={{ width: 100 }}
                  />
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setPriceRange([null, null])}
                    disabled={!priceRange[0] && !priceRange[1]}
                  >
                    Clear
                  </Button>
                </Space>

                {/* Max Stock */}
                <Space>
                  <Text>Stock ≤</Text>
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
              scroll={{ x: 1000 }}
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

      {/* Stock Modal */}
      <Modal
        title={`${stockAction === "add" ? "Add" : "Remove"} Stock – ${
          selectedProduct?.name || ""
        }`}
        open={stockModalOpen}
        onCancel={() => {
          setStockModalOpen(false);
          setSelectedProduct(null);
        }}
        footer={null}
      >
        <AntForm
          form={stockForm}
          layout="vertical"
          onFinish={handleStockSubmit}
        >
          <AntForm.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: "Please enter quantity" },
              {
                type: "number",
                min: 1,
                message: "Quantity must be at least 1",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={1}
              disabled={isAddingStock || isRemovingStock}
            />
          </AntForm.Item>

          <AntForm.Item className="mb-0">
            <Space>
              <Button
                onClick={() => {
                  setStockModalOpen(false);
                  setSelectedProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isAddingStock || isRemovingStock}
              >
                {stockAction === "add" ? "Add Stock" : "Remove Stock"}
              </Button>
            </Space>
          </AntForm.Item>
        </AntForm>
      </Modal>

      {/* History Modal */}
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
