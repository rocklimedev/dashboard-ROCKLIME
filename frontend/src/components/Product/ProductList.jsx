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
  HeartOutlined,
  HeartFilled,
} from "@ant-design/icons";
import {
  useGetAllProductsQuery,
  useDeleteProductMutation,
} from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useUpdateProductFeaturedMutation } from "../../api/userApi";
import {
  useAddToCartMutation,
  useGetCartQuery,
  useRemoveFromCartMutation,
} from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import pos from "../../assets/img/default.png";
import DeleteModal from "../Common/DeleteModal";
import HistoryModal from "../Common/HistoryModal";
import StockModal from "../Common/StockModal";
import Cart from "./Cart";
import "./productlist.css";
import PageHeader from "../Common/PageHeader";
import { useAddProductToCartMutation } from "../../api/cartApi";
const { Option } = Select;

const ProductsList = ({ isAdmin = false }) => {
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: cartData } = useGetCartQuery();
  const { data: user, isLoading: userLoading } = useGetProfileQuery();
  const [updateProductFeatured, { isLoading: isUpdatingFeatured }] =
    useUpdateProductFeaturedMutation(); // Add mutation hook
  // State for heart button loading
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [addProductToCart, { isLoading: mutationLoading }] =
    useAddProductToCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const navigate = useNavigate();
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
  const [featuredLoadingStates, setFeaturedLoadingStates] = useState({});
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
    return brandId
      ? brands.find((b) => b.id === brandId)?.brandName || "Not Branded"
      : "Not Branded";
  };

  const getCategoryName = (categoryId) => {
    return categoryId
      ? categories.find((cat) => cat.categoryId === categoryId)?.name ||
          "Uncategorized"
      : "Uncategorized";
  };

  const formatPrice = (price) => {
    return price !== null && !isNaN(Number(price))
      ? `₹${Number(price).toFixed(2)}`
      : "N/A";
  };

  const applyFilters = useMemo(() => {
    return (products, customers) => {
      if (!products) return [];
      return products
        .filter((product) => {
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
            product.name?.toLowerCase().includes(searchTerm) ||
            product.product_code?.toLowerCase().includes(searchTerm) ||
            product.company_code?.toLowerCase().includes(searchTerm);
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
        })
        .sort((a, b) => {
          switch (filters.sortBy) {
            case "Ascending":
              return a.name?.localeCompare(b.name || "") || 0;
            case "Descending":
              return b.name?.localeCompare(a.name || "") || 0;
            case "Recently Added":
              return new Date(b.createdAt) - new Date(a.createdAt);
            case "Price Low to High":
              return (
                (Number(a.sellingPrice) || 0) - (Number(b.sellingPrice) || 0)
              );
            case "Price High to Low":
              return (
                (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0)
              );
            default:
              return 0;
          }
        });
    };
  }, [filters]);

  const filteredProducts = applyFilters(products, customers);
  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(offset, offset + itemsPerPage);

  const handleAddProduct = () => navigate("/inventory/product/add");
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
      if (currentItems.length === 1 && currentPage > 1)
        setCurrentPage(currentPage - 1);
    } catch (error) {
      toast.error(
        `Failed to delete product: ${error.data?.message || "Unknown error"}`
      );
    } finally {
      setDeleteModalVisible(false);
      setSelectedProduct(null);
    }
  };
  const handleToggleFeatured = async (product) => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }

    const productId = product.productId;
    if (!productId) {
      toast.error("Invalid product ID");
      return;
    }

    const newIsFeatured = !product.isFeatured; // Toggle the isFeatured state

    setFeaturedLoadingStates((prev) => ({ ...prev, [productId]: true }));

    try {
      await updateProductFeatured({
        productId,
        isFeatured: newIsFeatured,
      }).unwrap();
      toast.success(
        newIsFeatured
          ? `${product.name} marked as featured!`
          : `${product.name} unmarked as featured!`
      );
    } catch (error) {
      toast.error(
        `Failed to update featured status: ${
          error.data?.message || "Unknown error"
        }`
      );
    } finally {
      setFeaturedLoadingStates((prev) => ({ ...prev, [productId]: false }));
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
      const response = await addProductToCart({ userId, productId }).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
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
    setStockHistoryMap((prev) => {
      const productId = selectedProduct.productId;
      return {
        ...prev,
        [productId]: [
          ...(prev[productId] || []),
          { ...stockData, date: new Date(), productId },
        ],
      };
    });
    setStockModalVisible(false);
  };

  const handleFilterChange = (changedFields) => {
    setFilters((prev) => ({ ...prev, ...changedFields }));
    setCurrentPage(1);
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
    // Implement order conversion logic
  };

  if (isLoading || userLoading) {
    return (
      <div className="loading-container text-center py-5">
        <Spin size="large" />
        <p className="mt-2">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container text-center py-5">
        <Empty
          description={`Error: ${error?.data?.message || "Unknown error"}`}
        />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Shop Products"
          subtitle="Explore our latest collection"
          onAdd={handleAddProduct}
          extra={
            <Button
              style={{ color: "#c72c41" }}
              icon={<ShoppingCartOutlined />}
              onClick={() => document.getElementById("cart-modal").click()}
            >
              Cart ({cartItems.length})
            </Button>
          }
        />
        <Cart
          cartItems={cartItems}
          onRemoveFromCart={handleRemoveFromCart}
          onConvertToOrder={handleConvertToOrder}
        />
        <div className="filter-bar sticky-top bg-white p-3 shadow-sm">
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
                size="large"
              />
            </Form.Item>
            <Form.Item name="brand" className="filter-item">
              <Select
                placeholder="Filter by Brand"
                allowClear
                size="large"
                style={{ minWidth: 180 }}
              >
                {brands.map((brand) => (
                  <Option key={brand.id} value={brand.id}>
                    {brand.brandName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="category" className="filter-item">
              <Select
                placeholder="Filter by Category"
                allowClear
                size="large"
                style={{ minWidth: 180 }}
              >
                {categories.map((cat) => (
                  <Option key={cat.categoryId} value={cat.categoryId}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="sortBy" className="filter-item">
              <Select
                placeholder="Sort by"
                allowClear
                size="large"
                style={{ minWidth: 180 }}
              >
                <Option value="Ascending">Name: A-Z</Option>
                <Option value="Descending">Name: Z-A</Option>
                <Option value="Recently Added">Recently Added</Option>
                <Option value="Price Low to High">Price: Low to High</Option>
                <Option value="Price High to Low">Price: High to Low</Option>
                <Option value="Last 7 Days">Last 7 Days</Option>
                <Option value="Last Month">Last Month</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="default" size="large" onClick={handleResetFilters}>
                <FilterOutlined /> Reset Filters
              </Button>
            </Form.Item>
          </Form>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="empty-container text-center py-5">
            <Empty description="No products match the filters." />
          </div>
        ) : (
          <div className="products-section">
            <Row gutter={[24, 24]} justify="center">
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
                    className="ecommerce-product-card"
                    cover={
                      <div className="product-image-container">
                        <div className="product-image-wrapper">
                          <img
                            src={product?.images?.[0] || pos}
                            alt={product.name || "Product"}
                            className="product-image"
                          />
                          <Button
                            type="text"
                            icon={
                              featuredLoadingStates[product.productId] ? (
                                <Spin size="small" />
                              ) : product.isFeatured ? (
                                <HeartFilled style={{ color: "#ff4d4f" }} />
                              ) : (
                                <HeartOutlined style={{ color: "#ff4d4f" }} />
                              )
                            }
                            onClick={() => handleToggleFeatured(product)}
                            className="heart-button"
                            disabled={featuredLoadingStates[product.productId]}
                          />
                          {product.quantity <= 0 && (
                            <Badge
                              count="Out of Stock"
                              className="out-of-stock-badge"
                            />
                          )}
                        </div>
                      </div>
                    }
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
                        <div className="product-details">
                          <div className="product-brand">
                            {getBrandsName(product.brandId)}
                          </div>
                          <div className="product-price">
                            {formatPrice(product.sellingPrice)}
                          </div>
                          <div className="product-stock">
                            {product.quantity > 0
                              ? `${product.quantity} in stock`
                              : "Out of Stock"}
                          </div>
                        </div>
                      }
                    />
                    <div className="product-actions">
                      <Tooltip
                        title={product.quantity <= 0 ? "Out of stock" : ""}
                      >
                        <Button
                          style={{ color: "#c72c41" }}
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
                            (product.quantity ?? 0) <= 0
                          }
                          block
                          size="large"
                        >
                          {product.quantity <= 0
                            ? "Out of Stock"
                            : "Add to Cart"}
                        </Button>
                      </Tooltip>
                      <Dropdown overlay={menu(product)} trigger={["click"]}>
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          size="large"
                          className="more-options-btn"
                        />
                      </Dropdown>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            <div className="pagination-container text-center mt-4">
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
      <button
        id="cart-modal"
        data-bs-toggle="modal"
        data-bs-target="#cartModal"
        style={{ display: "none" }}
      ></button>
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
              stockHistory={stockHistoryMap[selectedProduct.productId] || []}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProductsList;
