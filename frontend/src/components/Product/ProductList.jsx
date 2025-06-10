import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  ShoppingCartOutlined,
  SearchOutlined,
  MoreOutlined,
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
import Cart from "./Cart";
import TableHeader from "./TableHeader";

// Minimal Cart Component

// TableHeader Component

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
  const products = Array.isArray(productsData?.data)
    ? productsData.data
    : Array.isArray(productsData)
    ? productsData
    : [];
  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];
  const customers = Array.isArray(customersData?.data)
    ? customersData.data
    : [];
  const cartItems = Array.isArray(cartData?.items) ? cartData.items : [];

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isStockModalVisible, setStockModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [stockHistoryMap, setStockHistoryMap] = useState({});
  const [cartLoadingStates, setCartLoadingStates] = useState({});

  const [filters, setFilters] = useState({
    createdBy: null,
    category: null,
    brand: null,
    sortBy: null,
    search: "",
    company_code: "",
    categories,
    brands,
  });

  const itemsPerPage = 20;

  const getBrandsName = (brandId) => {
    if (!brandId) return "NOT BRANDED";
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "NOT BRANDED";
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

  const applyFilters = (customers = []) => {
    if (!products) return [];

    let filtered = products.filter((product) => {
      const customer = customers.find((c) => c._id === product.customerId);
      const createdByName = customer?.name || "";
      const matchesCreator =
        !filters.createdBy || createdByName === filters.createdBy;
      const matchesCategory =
        !filters.category || product.categoryId === filters.category;
      const matchesBrand = !filters.brand || product.brandId === filters.brand;
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
        (a, b) => (Number(a.sellingPrice) || 0) - (Number(b.sellingPrice) || 0)
      );
    } else if (filters.sortBy === "Price High to Low") {
      filtered.sort(
        (a, b) => (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0)
      );
    }

    return filtered;
  };

  const filteredProducts = applyFilters(customers);

  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(offset, offset + itemsPerPage);

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.productId) {
      toast.error("No product selected for deletion");
      setModalVisible(false);
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
      setModalVisible(false);
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
      await removeFromCart(productId).unwrap();
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

  useEffect(() => {
    if (
      filteredProducts.length > 0 &&
      currentPage > Math.ceil(filteredProducts.length / itemsPerPage)
    ) {
      setCurrentPage(1);
    }
  }, [filteredProducts.length, currentPage]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, categories, brands }));
  }, [categories, brands]);

  if (isLoading || userLoading) {
    return (
      <div style={{ textAlign: "center", padding: 32 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 32, color: "#ff4d4f" }}>
        Error fetching products: {error?.data?.message || "Unknown error"}
      </div>
    );
  }

  if (!filteredProducts.length) {
    return (
      <div style={{ textAlign: "center", padding: 32, color: "#8c8c8c" }}>
        No products available.
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div style={{ padding: 24 }}>
          <Cart cartItems={cartItems} onRemoveFromCart={handleRemoveFromCart} />
          <div>
            <TableHeader
              filters={filters}
              setFilters={setFilters}
              additionalSortOptions={[
                { value: "Price Low to High", label: "Price: Low to High" },
                { value: "Price High to Low", label: "Price: High to Low" },
              ]}
            />
            <Row gutter={[16, 16]}>
              {currentItems.map((product) => {
                const menu = (
                  <Menu>
                    <Menu.Item key="view">
                      <Link to={`/product/${product.productId}`}>View</Link>
                    </Menu.Item>
                    <Menu.Item key="edit">
                      <Link to={`/product/${product.productId}/edit`}>
                        Edit
                      </Link>
                    </Menu.Item>
                    <Menu.Item
                      key="manage-stock"
                      onClick={() => handleStockClick(product)}
                    >
                      Manage Stock
                    </Menu.Item>
                    <Menu.Item
                      key="view-history"
                      onClick={() => handleHistoryClick(product)}
                    >
                      View History
                    </Menu.Item>
                    <Menu.Item
                      key="delete"
                      onClick={() => handleDeleteClick(product)}
                    >
                      Delete
                    </Menu.Item>
                  </Menu>
                );

                return (
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
                        <div
                          style={{
                            height: 150,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={product?.images || pos}
                            alt={product.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "center",
                            }}
                            className="product-image-container"
                          />
                        </div>
                      }
                      actions={[
                        <Tooltip title="Add to Cart" key="add-to-cart">
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
                          >
                            {product.quantity <= 0
                              ? "Out of Stock"
                              : "Add to Cart"}
                          </Button>
                        </Tooltip>,
                      ]}
                    >
                      <Card.Meta
                        title={
                          <Link
                            to={`/product/${product.productId}`}
                            style={{ color: "#000" }}
                          >
                            {product.name || "N/A"}
                          </Link>
                        }
                        description={
                          <>
                            <div>
                              <Link
                                to="#"
                                onClick={(e) => e.preventDefault()}
                                style={{ color: "#8c8c8c" }}
                              >
                                {getBrandsName(product.brandId)}
                              </Link>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 8,
                              }}
                            >
                              <span
                                style={{ color: "#13c2c2", fontWeight: "bold" }}
                              >
                                {formatPrice(product.sellingPrice)}
                              </span>
                              <span style={{ color: "#eb2f96" }}>
                                {product.quantity ?? 0} Pcs
                              </span>
                            </div>
                          </>
                        }
                      />
                      <Dropdown overlay={menu} trigger={["click"]}>
                        <Button
                          type="text"
                          style={{ position: "absolute", top: 8, right: 8 }}
                          icon={<MoreOutlined />}
                        />
                      </Dropdown>
                    </Card>
                  </Col>
                );
              })}
            </Row>
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination
                current={currentPage}
                total={filteredProducts.length}
                pageSize={itemsPerPage}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          </div>

          {isAdmin && (
            <>
              <DeleteModal
                isVisible={isModalVisible}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                  setModalVisible(false);
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
  );
};

export default ProductsList;
