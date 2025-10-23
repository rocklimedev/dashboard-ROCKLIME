import React, { useState, useMemo } from "react";
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
} from "antd";
import { SearchOutlined, MoreOutlined } from "@ant-design/icons";
import {
  useGetAllProductsQuery,
  useAddStockMutation,
  useRemoveStockMutation,
  useGetHistoryByProductIdQuery,
} from "../../api/productApi";
import { toast } from "sonner";
import StockModal from "../Common/StockModal"; // Using the provided StockModal
import HistoryModal from "../Common/HistoryModal"; // Assuming this exists
import PageHeader from "../Common/PageHeader";
import pos from "../../assets/img/default.png";

const InventoryWrapper = () => {
  const navigate = useNavigate();
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const [addStock, { isLoading: isAddingStock }] = useAddStockMutation();
  const [removeStock, { isLoading: isRemovingStock }] =
    useRemoveStockMutation();

  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [isStockModalVisible, setStockModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockHistoryMap, setStockHistoryMap] = useState({});
  const [form] = Form.useForm();
  const [search, setSearch] = useState("");
  const itemsPerPage = 30;

  const parseImages = (images) => {
    try {
      if (typeof images === "string") {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [pos];
      }
      return Array.isArray(images) ? images : [pos];
    } catch (error) {
      return [pos];
    }
  };

  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails)) return "N/A";
    const companyCodeEntry = metaDetails.find(
      (detail) => detail.slug?.toLowerCase() === "companycode"
    );
    return companyCodeEntry ? String(companyCodeEntry.value) : "N/A";
  };

  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : []),
    [productsData]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchTerm = search.toLowerCase();
      const companyCode = getCompanyCode(product.metaDetails);
      return (
        !searchTerm ||
        product.name?.toLowerCase().includes(searchTerm) ||
        product.product_code?.toLowerCase().includes(searchTerm) ||
        companyCode?.toLowerCase().includes(searchTerm)
      );
    });
  }, [products, search]);

  const formattedTableData = useMemo(
    () =>
      filteredProducts.map((product) => ({
        ...product,
        Name: product.name || "N/A",
        Stock:
          product.quantity > 0
            ? `${product.quantity} in stock`
            : "Out of Stock",
        company_code: getCompanyCode(product.metaDetails),
      })),
    [filteredProducts]
  );

  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = formattedTableData.slice(offset, offset + itemsPerPage);

  const handleAddProduct = () => navigate("/inventory/product/add");

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
        toast.success(`Added ${quantity} units to stock`);
      } else {
        await removeStock({ productId, quantity }).unwrap();
        toast.success(`Removed ${quantity} units from stock`);
      }
      setStockHistoryMap((prev) => ({
        ...prev,
        [productId]: [
          ...(prev[productId] || []),
          { quantity, action, date: new Date(), productId },
        ],
      }));
    } catch (error) {
      toast.error(
        `Failed to ${action} stock: ${error.data?.message || "Unknown error"}`
      );
    } finally {
      setStockModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const menu = (product) => (
    <Menu>
      <Menu.Item
        key="add-stock"
        onClick={() => handleStockClick(product, "add")}
      >
        Add Stock
      </Menu.Item>
      <Menu.Item
        key="remove-stock"
        onClick={() => handleStockClick(product, "remove")}
      >
        Remove Stock
      </Menu.Item>
      <Menu.Item key="view-history" onClick={() => handleHistoryClick(product)}>
        View Stock History
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      key: "images",
      render: (images) => (
        <img
          src={parseImages(images)[0] || pos}
          alt="Product"
          style={{ width: 50, height: 50, objectFit: "cover" }}
        />
      ),
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Link to={`/product/${record.productId}`}>{text || "N/A"}</Link>
      ),
    },
    {
      title: "Product Code",
      dataIndex: "company_code",
      key: "company_code",
      render: (text) => <p>{text || "N/A"}</p>,
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) =>
        quantity > 0 ? `${quantity} in stock` : "Out of Stock",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown overlay={menu(record)} trigger={["click"]}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

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
          subtitle="Manage product stock and history"
          exportOptions={{ pdf: false, excel: false }}
        />
        <div className="filter-bar bg-white p-3 shadow-sm">
          <Form layout="inline" form={form} className="filter-form">
            <Form.Item className="filter-item">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search products..."
                allowClear
                size="large"
                onChange={handleSearchChange}
              />
            </Form.Item>
          </Form>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="page-wrapper">
            <div className="content">
              <div className="empty-container text-center py-5">
                <Empty description="No products available." />
              </div>
            </div>
          </div>
        ) : (
          <div className="products-section">
            <Table
              columns={columns}
              dataSource={currentItems}
              rowKey="productId"
              pagination={false}
              scroll={{ x: true }}
            />
            <div
              className="pagination-container"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <Pagination
                current={currentPage}
                total={filteredProducts.length}
                pageSize={itemsPerPage}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showQuickJumper
                size="small"
              />
            </div>
          </div>
        )}
      </div>
      {isStockModalVisible && selectedProduct && (
        <StockModal
          show={isStockModalVisible}
          onHide={() => setStockModalVisible(false)}
          product={selectedProduct}
          onSubmit={(data) =>
            handleStockSubmit({ ...data, action: selectedProduct.action })
          }
        />
      )}
      {isHistoryModalVisible && selectedProduct && (
        <HistoryModal
          show={isHistoryModalVisible}
          onHide={() => setHistoryModalVisible(false)}
          product={selectedProduct}
          stockHistory={stockHistoryMap[selectedProduct.productId] || []}
        />
      )}
    </div>
  );
};

export default InventoryWrapper;
