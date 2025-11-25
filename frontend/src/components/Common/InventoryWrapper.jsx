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
  Tag,
} from "antd";
import {
  SearchOutlined,
  MoreOutlined,
  FilterOutlined,
  PlusOutlined,
  MinusOutlined,
  HistoryOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import {
  useGetAllProductsQuery,
  useAddStockMutation,
  useRemoveStockMutation,
} from "../../api/productApi";
import PageHeader from "../Common/PageHeader";
import pos from "../../assets/img/default.png";
import HistoryModalAntD from "./HistoryModal";
const { TabPane } = Tabs;
const { Text, Title } = Typography;

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
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [maxStockFilter, setMaxStockFilter] = useState(null);
  const [priceRange, setPriceRange] = useState([null, null]);
  const [priceSort, setPriceSort] = useState(null); // null | "asc" | "desc"

  // Modals
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState("add"); // "add" | "remove"

  const itemsPerPage = 30;
  const [stockForm] = Form.useForm();

  // Helpers
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
      (d) => d.slug && d.slug.toLowerCase() === "companycode"
    );
    return entry ? String(entry.value || "N/A") : "N/A";
  };

  const getSellingPrice = (metaDetails) => {
    if (!Array.isArray(metaDetails)) return null;
    const entry = metaDetails.find(
      (d) => d.slug && d.slug.toLowerCase() === "sellingprice"
    );
    return entry ? Number(entry.value) : null;
  };

  // Base products
  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : []),
    [productsData]
  );

  // Filters
  const filteredProducts = useMemo(() => {
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

  // Tab logic
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

  // Price sorting
  const sortedProducts = useMemo(() => {
    if (!priceSort) return tabFilteredProducts;
    return [...tabFilteredProducts].sort((a, b) => {
      const priceA = getSellingPrice(a.metaDetails) ?? -Infinity;
      const priceB = getSellingPrice(b.metaDetails) ?? -Infinity;
      return priceSort === "asc" ? priceA - priceB : priceB - priceA;
    });
  }, [tabFilteredProducts, priceSort]);

  // Pagination
  const currentItems = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalItems = sortedProducts.length;

  useEffect(
    () => setCurrentPage(1),
    [activeTab, search, maxStockFilter, priceRange, priceSort]
  );

  // Counts
  const counts = useMemo(() => {
    const inStock = products.filter((p) => p.quantity > 0).length;
    const outStock = products.filter((p) => p.quantity === 0).length;
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= lowStockThreshold
    ).length;
    return { all: products.length, inStock, outStock, lowStock };
  }, [products, lowStockThreshold]);

  // Actions
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
      title: "Product Name",
      dataIndex: "name",
      render: (_, record) => (
        <Link to={`/product/${record.productId}`} style={{ fontWeight: 500 }}>
          {record.name || "Unnamed Product"}
        </Link>
      ),
    },
    {
      title: "Code",
      dataIndex: "product_code",
      render: (code) => (
        <Text
          copyable={!!code}
          code
          style={{ cursor: code ? "pointer" : "default" }}
        >
          {code || "—"}
        </Text>
      ),
    },
    {
      title: "Company Code",
      dataIndex: "metaDetails",
      render: (meta) => {
        const code = getCompanyCode(meta);
        return (
          <Text copyable={code !== "N/A"} code>
            {code}
          </Text>
        );
      },
    },
    {
      title: () => (
        <Space>
          Selling Price
          {priceSort === "asc" ? (
            <SortAscendingOutlined
              onClick={() => setPriceSort("desc")}
              style={{ cursor: "pointer", color: "#1890ff" }}
            />
          ) : priceSort === "desc" ? (
            <SortDescendingOutlined
              onClick={() => setPriceSort(null)}
              style={{ cursor: "pointer", color: "#1890ff" }}
            />
          ) : (
            <SortAscendingOutlined
              onClick={() => setPriceSort("asc")}
              style={{ cursor: "pointer", opacity: 0.5 }}
            />
          )}
        </Space>
      ),
      dataIndex: "metaDetails",
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
        if (qty === 0) return <Tag color="red">Out of Stock</Tag>;
        if (qty <= lowStockThreshold)
          return <Tag color="orange">{qty} Low</Tag>;
        return <Tag color="green">{qty} In Stock</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openStockModal(record, "add")}
            title="Add Stock"
          />
          <Button
            size="small"
            danger
            icon={<MinusOutlined />}
            disabled={record.quantity === 0}
            onClick={() => openStockModal(record, "remove")}
            title="Remove Stock"
          />
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => openHistoryModal(record)}
            title="View History"
          />
        </Space>
      ),
    },
  ];

  // Render
  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading inventory..." />
      </div>
    );
  if (error)
    return (
      <div style={{ padding: 20 }}>
        <Empty description="Failed to load products" />
      </div>
    );

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Inventory Management"
          subtitle="Track stock levels, add/remove stock, and view history"
          exportOptions={{ pdf: false, excel: false }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/inventory/product/add")}
            >
              Add Product
            </Button>
          }
        />

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <Space wrap>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search products..."
              allowClear
              size="large"
              style={{ width: 300 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Space>
              <Text>Price:</Text>
              <InputNumber
                placeholder="Min"
                value={priceRange[0]}
                onChange={(v) => setPriceRange([v, priceRange[1]])}
              />
              <Text>to</Text>
              <InputNumber
                placeholder="Max"
                value={priceRange[1]}
                onChange={(v) => setPriceRange([priceRange[0], v])}
              />
              <Button size="small" onClick={() => setPriceRange([null, null])}>
                Clear
              </Button>
            </Space>
            <Space>
              <Text>Max Stock ≤</Text>
              <InputNumber
                value={maxStockFilter}
                onChange={setMaxStockFilter}
                style={{ width: 100 }}
              />
              <Button size="small" onClick={() => setMaxStockFilter(null)}>
                Clear
              </Button>
            </Space>
            <Space>
              <Text>Low stock alert:</Text>
              <InputNumber
                min={1}
                value={lowStockThreshold}
                onChange={(v) => setLowStockThreshold(v || 10)}
                style={{ width: 80 }}
              />
            </Space>
          </Space>
        </div>

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-4">
          <TabPane
            tab={
              <>
                All <Badge count={counts.all} />
              </>
            }
            key="all"
          />
          <TabPane
            tab={
              <>
                In Stock{" "}
                <Badge
                  count={counts.inStock}
                  style={{ backgroundColor: "#52c41a" }}
                />
              </>
            }
            key="in-stock"
          />
          <TabPane
            tab={
              <>
                Low Stock{" "}
                <Badge
                  count={counts.lowStock}
                  style={{ backgroundColor: "#faad14" }}
                />
              </>
            }
            key="low-stock"
          />
          <TabPane
            tab={
              <>
                Out of Stock{" "}
                <Badge
                  count={counts.outStock}
                  style={{ backgroundColor: "#ff4d4f" }}
                />
              </>
            }
            key="out-of-stock"
          />
        </Tabs>

        {/* Table */}
        {totalItems === 0 ? (
          <Empty description="No products found" />
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={currentItems}
              rowKey="productId"
              pagination={false}
              scroll={{ x: 1200 }}
              bordered
            />
            <Pagination
              style={{ marginTop: 16, textAlign: "right" }}
              current={currentPage}
              total={totalItems}
              pageSize={itemsPerPage}
              onChange={setCurrentPage}
              showTotal={(total) => `Total ${total} products`}
            />
          </>
        )}
      </div>

      {/* Stock Modal */}
      <Modal
        title={
          <Title level={4}>
            {stockAction === "add" ? <PlusOutlined /> : <MinusOutlined />}{" "}
            {stockAction === "add" ? "Add" : "Remove"} Stock —{" "}
            {selectedProduct?.name}
          </Title>
        }
        open={stockModalOpen}
        onCancel={() => {
          setStockModalOpen(false);
          setSelectedProduct(null);
        }}
        footer={null}
      >
        <Form form={stockForm} layout="vertical" onFinish={handleStockSubmit}>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: "Enter quantity" },
              { type: "number", min: 1 },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setStockModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isAddingStock || isRemovingStock}
              >
                {stockAction === "add" ? "Add Stock" : "Remove Stock"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
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
