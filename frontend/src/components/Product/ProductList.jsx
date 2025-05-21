import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Badge,
} from "react-bootstrap";
import { BsCartPlus, BsSearch } from "react-icons/bs";
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
import DataTablePagination from "../Common/DataTablePagination";
import Actions from "../Common/Actions";
import DeleteModal from "../Common/DeleteModal";
import StockModal from "../Common/StockModal";
import HistoryModal from "../Common/HistoryModal";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import pos from "../../assets/img/default.png";

// Minimal Cart Component
const Cart = ({ cartItems, onRemoveFromCart }) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-container position-fixed top-0 end-0 p-3">
      <Badge bg="primary" className="p-2">
        Cart: {totalItems} item{totalItems !== 1 ? "s" : ""}
      </Badge>
      {cartItems.length > 0 && (
        <div className="cart-dropdown bg-light p-3 border rounded mt-2">
          <h5>Cart</h5>
          {cartItems.map((item) => (
            <div
              key={item.productId}
              className="d-flex justify-content-between mb-2"
            >
              <span>
                {item.name} (x{item.quantity})
              </span>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onRemoveFromCart(item.productId)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Link to="/cart" className="btn btn-success btn-sm w-100 mt-2">
            View Cart
          </Link>
        </div>
      )}
    </div>
  );
};

// TableHeader Component
const TableHeader = ({ filters, setFilters, additionalSortOptions = [] }) => {
  return (
    <Form className="mb-4">
      <Row>
        <Col xs={12} md={4}>
          <Form.Group controlId="search-products">
            <Form.Label className="d-flex align-items-center">
              <BsSearch className="me-2 text-muted" />
              Search Products
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by product name or code..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </Form.Group>
        </Col>
        <Col xs={12} md={3}>
          <Form.Group controlId="filter-category">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={filters.category || ""}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value || null })
              }
            >
              <option value="">All Categories</option>
              {filters.categories?.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12} md={3}>
          <Form.Group controlId="filter-brand">
            <Form.Label>Brand</Form.Label>
            <Form.Select
              value={filters.brand || ""}
              onChange={(e) =>
                setFilters({ ...filters, brand: e.target.value || null })
              }
            >
              <option value="">All Brands</option>
              {filters.brands?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brandName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12} md={2}>
          <Form.Group controlId="sort-by">
            <Form.Label>Sort By</Form.Label>
            <Form.Select
              value={filters.sortBy || ""}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value || null })
              }
            >
              <option value="">Default</option>
              <option value="Ascending">Name: A-Z</option>
              <option value="Descending">Name: Z-A</option>
              <option value="Recently Added">Recently Added</option>
              <option value="Price Low to High">Price: Low to High</option>
              <option value="Price High to Low">Price: High to Low</option>
              {additionalSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

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

  const [currentPage, setCurrentPage] = useState(0);
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

  const itemsPerPage = 12;

  const getBrandsName = (brandId) => {
    if (!brandId) return "NOT BRANDED";
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "NOT BRANDED";
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Helper function to format price safely
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
      filtered.sort((a, b) => b.name?.localeCompare(a.name || ""));
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

  const offset = currentPage * itemsPerPage;
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
      if (currentItems.length === 1 && currentPage > 0) {
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
      currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)
    ) {
      setCurrentPage(0);
    }
  }, [filteredProducts.length, currentPage]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, categories, brands }));
  }, [categories, brands]);

  if (isLoading || userLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-danger">
        Error fetching products: {error?.data?.message || "Unknown error"}
      </div>
    );
  }

  if (!filteredProducts.length) {
    return (
      <div className="text-center py-4 text-muted">No products available.</div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <Cart cartItems={cartItems} onRemoveFromCart={handleRemoveFromCart} />
        <div className="products-list py-4">
          <TableHeader
            filters={filters}
            setFilters={setFilters}
            additionalSortOptions={[
              { value: "Price Low to High", label: "Price: Low to High" },
              { value: "Price High to Low", label: "Price: High to Low" },
            ]}
          />
          <Row className="g-3">
            {currentItems.map((product) => (
              <Col key={product.productId} xs={12} sm={6} md={4} lg={3} xl={2}>
                <Card
                  className="shadow-sm border-0 h-100"
                  style={{ transition: "transform 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <div
                    className="product-image-container"
                    style={{
                      height: "150px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    <Card.Img
                      src={product?.images || pos}
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                    />
                  </div>
                  <Card.Body>
                    <Card.Title as="h6" className="fs-14 fw-bold mb-1">
                      <Link
                        to={`/product/${product.productId}`}
                        className="text-decoration-none text-dark"
                      >
                        {product.name || "N/A"}
                      </Link>
                    </Card.Title>
                    <Card.Text className="fs-13 text-muted mb-2">
                      <Link
                        to="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-decoration-none"
                      >
                        {getCategoryName(product.categoryId)}
                      </Link>
                    </Card.Text>
                    <Card.Text className="fs-13 text-muted mb-2">
                      <strong>Brand:</strong> {getBrandsName(product.brandId)}
                    </Card.Text>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-teal fs-14 fw-bold">
                        {formatPrice(product.sellingPrice)}
                      </span>
                      <span className="text-pink fs-13">
                        {product.quantity ?? 0} Pcs
                      </span>
                    </div>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Add to Cart</Tooltip>}
                    >
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={
                          cartLoadingStates[product.productId] ||
                          product.quantity <= 0
                        }
                        className="w-100 d-flex align-items-center justify-content-center"
                      >
                        {cartLoadingStates[product.productId] ? (
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                        ) : (
                          <BsCartPlus className="me-2" />
                        )}
                        {product.quantity <= 0 ? "Out of Stock" : "Add to Cart"}
                      </Button>
                    </OverlayTrigger>
                    {isAdmin && (
                      <div className="mt-2">
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleStockClick(product)}
                          className="w-100 mb-2"
                        >
                          Manage Stock
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleHistoryClick(product)}
                          className="w-100 mb-2"
                        >
                          View History
                        </Button>
                        <Actions
                          viewUrl={`/product/${product.productId}`}
                          editUrl={`/product/${product.productId}/edit`}
                          onDelete={() => handleDeleteClick(product)}
                        />
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="mt-4">
            <DataTablePagination
              totalItems={filteredProducts.length}
              itemNo={itemsPerPage}
              onPageChange={(selectedPage) => setCurrentPage(selectedPage - 1)}
            />
          </div>
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
              stockHistory={stockHistoryMap[selectedProduct.productId] || []}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProductsList;
