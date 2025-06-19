import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  Button,
  Spin,
  Tooltip,
  Badge,
  Dropdown,
  Menu,
  Pagination,
  Empty,
} from "antd";
import {
  ShoppingCartOutlined,
  SearchOutlined,
  MoreOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import {
  useGetAllProductsQuery,
  useDeleteProductMutation,
} from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useAddToCartMutation,
  useGetCartQuery,
  useRemoveFromCartMutation,
} from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import pos from "../../assets/img/default.png";
import DeleteModal from "../Common/DeleteModal";
import HistoryModal from "../Common/HistoryModal";
import StockModal from "../Common/StockModal";
import Cart from "./Cart"; // Import the modal-based Cart component
import "./productlist.css"; // Import custom CSS

const { Option } = Select;

const ProductsList = ({ isAdmin = false }) => {
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: cartData } = useGetCartQuery();
  const { data: user, isLoading: userLoading } = useGetProfileQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const userId = user?.user?.userId;
  const products = useMemo(
    () =>
      Array.isArray(productsData?.data)
        ? productsData.data
        : Array.isArray(productsData)
        ? productsData
        : [],
    [productsData]
  );
  const categories = useMemo(
    () =>
      Array.isArray(categoriesData?.categories)
        ? categoriesData.categories
        : [],
    [categoriesData]
  );
  const brands = useMemo(
    () => (Array.isArray(brandsData) ? brandsData : []),
    [brandsData]
  );
  const customers = useMemo(
    () => (Array.isArray(customersData?.data) ? customersData.data : []),
    [customersData]
  );
  const cartItems = useMemo(
    () => (Array.isArray(cartData?.items) ? cartData.items : []),
    [cartData]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isStockModalVisible, setStockModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [stockHistoryMap, setStockHistoryMap] = useState({});
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [form] = Form.useForm();

  const [filters, setFilters] = useState({
    createdBy: null,
    category: null,
    brand: null,
    sortBy: null,
    search: "",
    company_code: "",
  });

  const itemsPerPage = 30;

  const getBrandsName = (brandId) => {
    if (!brandId) return "Not Branded";
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "Not Branded";
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(Number(price))) {
      return "N/A";
    }
    return `₹${Number(price).toFixed(2)}`;
  };

  const applyFilters = useMemo(() => {
    return (products, customers) => {
      if (!products) return [];

      let filtered = products.filter((product) => {
        const customer = customers.find((c) => c._id === product.customerId);
        const createdByName = customer?.name || "";
        const matchesCreator =
          !filters.createdBy || createdByName === filters.createdBy;
        const matchesCategory =
          !filters.category || product.categoryId === filters.category;
        const matchesBrand =
          !filters.brand || product.brandId === filters.brand;
        const searchTerm = filters.search?.toLowerCase() || "";
        const matchesSearch =
          !searchTerm ||
          (product.name?.toLowerCase() || "").includes(searchTerm) ||
          (product.product_code?.toLowerCase() || "").includes(searchTerm) ||
          (product.company_code?.toLowerCase() || "").includes(searchTerm);
        let matchesDate = true;
        if (filters.sortBy === "Last 7 Days") {
          const daysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = new Date(product.createdAt) >= daysAgo;
        } else if (filters.sortBy === "Last Month") {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          matchesDate = new Date(product.createdAt) >= oneMonthAgo;
        }

        return (
          matchesCreator &&
          matchesCategory &&
          matchesBrand &&
          matchesSearch &&
          matchesDate
        );
      });

      if (filters.sortBy === "Ascending") {
        filtered.sort((a, b) => a.name?.localeCompare(b.name || ""));
      } else if (filters.sortBy === "Descending") {
        filtered.sort((a, b) => b.name?.localeCompare(b.name || ""));
      } else if (filters.sortBy === "Recently Added") {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (filters.sortBy === "Price Low to High") {
        filtered.sort(
          (a, b) =>
            (Number(a.sellingPrice) || 0) - (Number(b.sellingPrice) || 0)
        );
      } else if (filters.sortBy === "Price High to Low") {
        filtered.sort(
          (a, b) =>
            (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0)
        );
      }

      return filtered;
    };
  }, [filters]);

  const filteredProducts = applyFilters(products, customers);
  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(offset, offset + itemsPerPage);

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.productId) {
      toast.error("No product selected for deletion");
      setDeleteModalVisible(false);
      return;
    }

    try {
      await deleteProduct(selectedProduct.productId).unwrap();
      toast.success("Product deleted successfully!");
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast.error(
        `Failed to delete product: ${error.data?.message || "Unknown error"}`
      );
    } finally {
      setDeleteModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const handleAddToCart = async (product) => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }

    const productId = product.productId;
    if (!productId) {
      toast.error("Invalid product ID");
      return;
    }

    setCartLoadingStates((prev) => ({ ...prev, [productId]: true }));

    try {
      await addToCart({ userId, productId, quantity: 1 }).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(
        `Failed to add to cart: ${error.data?.message || "Unknown error"}`
      );
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      await removeFromCart({ userId, productId }).unwrap();
      toast.success("Item removed from cart!");
    } catch (error) {
      toast.error(
        `Failed to remove from cart: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  const handleStockClick = (product) => {
    setSelectedProduct(product);
    setStockModalVisible(true);
  };

  const handleHistoryClick = (product) => {
    setSelectedProduct(product);
    setHistoryModalVisible(true);
  };

  const handleStockSubmit = (stockData) => {
    const updatedStock = {
      ...stockData,
      productId: selectedProduct.productId,
      date: new Date(),
    };

    setStockHistoryMap((prev) => {
      const productId = selectedProduct.productId;
      const newHistory = [...(prev[productId] || []), updatedStock];
      return { ...prev, [productId]: newHistory };
    });

    setStockModalVisible(false);
  };

  const handleFilterChange = (changedFields) => {
    setFilters((prev) => ({ ...prev, ...changedFields }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    form.resetFields();
    setFilters({
      createdBy: null,
      category: null,
      brand: null,
      sortBy: null,
      search: "",
      company_code: "",
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    if (
      filteredProducts.length > 0 &&
      currentPage > Math.ceil(filteredProducts.length / itemsPerPage)
    ) {
      setCurrentPage(1);
    }
  }, [filteredProducts.length, currentPage]);

  const menu = (product) => (
    <Menu>
      <Menu.Item key="view">
        <Link to={`/product/${product.productId}`}>View</Link>
      </Menu.Item>
      <Menu.Item key="edit">
        <Link to={`/product/${product.productId}/edit`}>Edit</Link>
      </Menu.Item>
      <Menu.Item key="manage-stock" onClick={() => handleStockClick(product)}>
        Manage Stock
      </Menu.Item>
      <Menu.Item key="view-history" onClick={() => handleHistoryClick(product)}>
        View History
      </Menu.Item>
      <Menu.Item key="delete" onClick={() => handleDeleteClick(product)}>
        Delete
      </Menu.Item>
    </Menu>
  );

  const handleConvertToOrder = (orderData) => {
    console.log("Order converted:", orderData);
    // Add logic to handle order conversion
  };

  if (isLoading || userLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Empty
          description={`Error: ${error?.data?.message || "Unknown error"}`}
        />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="products-list-wrapper">
          <div className="content">
            <Cart
              cartItems={cartItems}
              onRemoveFromCart={handleRemoveFromCart}
              onConvertToOrder={handleConvertToOrder}
            />
            <div className="filter-section">
              <Form
                form={form}
                layout="inline"
                onValuesChange={(_, values) => handleFilterChange(values)}
                className="filter-form"
              >
                <Form.Item name="search" className="filter-item">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search products..."
                    allowClear
                  />
                </Form.Item>
                <Form.Item name="category" className="filter-item">
                  <Select
                    placeholder="Select Category"
                    allowClear
                    style={{ minWidth: 150 }}
                  >
                    {categories.map((cat) => (
                      <Option key={cat.categoryId} value={cat.categoryId}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="brand" className="filter-item">
                  <Select
                    placeholder="Select Brand"
                    allowClear
                    style={{ minWidth: 150 }}
                  >
                    {brands.map((brand) => (
                      <Option key={brand.id} value={brand.id}>
                        {brand.brandName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="sortBy" className="filter-item">
                  <Select
                    placeholder="Sort By"
                    allowClear
                    style={{ minWidth: 150 }}
                  >
                    <Option value="Ascending">Name: A-Z</Option>
                    <Option value="Descending">Name: Z-A</Option>
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Price Low to High">
                      Price: Low to High
                    </Option>
                    <Option value="Price High to Low">
                      Price: High to Low
                    </Option>
                    <Option value="Last 7 Days">Last 7 Days</Option>
                    <Option value="Last Month">Last Month</Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="default" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                </Form.Item>
              </Form>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="empty-container">
                <Empty description="No products match the filters." />
              </div>
            ) : (
              <>
                <Row gutter={[16, 16]} className="products-grid">
                  {currentItems.map((product) => (
                    <Col
                      key={product.productId}
                      xs={24}
                      sm={12}
                      md={8}
                      lg={6}
                      xl={4}
                    >
                      <Card
                        hoverable
                        className="product-card"
                        cover={
                          <div className="product-image-wrapper">
                            <img
                              src={product?.images?.[0] || pos}
                              alt={product.name || "Product"}
                              className="product-image"
                            />
                            {product.quantity <= 0 && (
                              <div className="out-of-stock">Out of Stock</div>
                            )}
                          </div>
                        }
                        actions={[
                          <Button
                            type="primary"
                            icon={
                              cartLoadingStates[product.productId] ? (
                                <Spin size="small" />
                              ) : (
                                <ShoppingCartOutlined />
                              )
                            }
                            onClick={() => handleAddToCart(product)}
                            disabled={
                              cartLoadingStates[product.productId] ||
                              product.quantity <= 0
                            }
                            block
                            className="add-to-cart-btn"
                          >
                            {product.quantity <= 0
                              ? "Out of Stock"
                              : "Add to Cart"}
                          </Button>,
                        ]}
                      >
                        <Card.Meta
                          title={
                            <Link
                              to={`/product/${product.productId}`}
                              className="product-title"
                            >
                              {product.name || "N/A"}
                            </Link>
                          }
                          description={
                            <div>
                              <div className="product-brand">
                                {getBrandsName(product.brandId)}
                              </div>
                              <div className="product-price-stock">
                                <span className="product-price">
                                  {formatPrice(product.sellingPrice)}
                                </span>
                                <span className="product-stock">
                                  {product.quantity ?? 0} in stock
                                </span>
                              </div>
                            </div>
                          }
                        />
                        {isAdmin && (
                          <Dropdown overlay={menu(product)} trigger={["click"]}>
                            <Button
                              type="text"
                              className="more-options-btn"
                              icon={<MoreOutlined />}
                              aria-label="More options"
                            />
                          </Dropdown>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
                <div className="pagination-container">
                  <Pagination
                    current={currentPage}
                    total={filteredProducts.length}
                    pageSize={itemsPerPage}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                    showQuickJumper
                  />
                </div>
              </>
            )}
            {isAdmin && (
              <>
                <DeleteModal
                  isVisible={isDeleteModalVisible}
                  onConfirm={handleConfirmDelete}
                  onCancel={() => {
                    setDeleteModalVisible(false);
                    setSelectedProduct(null);
                  }}
                  item={selectedProduct}
                  itemType="Product"
                  isLoading={isDeleting}
                />
                {isStockModalVisible && selectedProduct && (
                  <StockModal
                    show={isStockModalVisible}
                    onHide={() => setStockModalVisible(false)}
                    product={selectedProduct}
                    onSubmit={handleStockSubmit}
                  />
                )}
                {isHistoryModalVisible && selectedProduct && (
                  <HistoryModal
                    show={isHistoryModalVisible}
                    onHide={() => setHistoryModalVisible(false)}
                    product={selectedProduct}
                    stockHistory={
                      stockHistoryMap[selectedProduct.productId] || []
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsList;
