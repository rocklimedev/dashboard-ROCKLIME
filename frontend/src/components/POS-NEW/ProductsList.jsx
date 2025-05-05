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
} from "react-bootstrap";
import { BsCartPlus, BsTag, BsBox } from "react-icons/bs";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import DataTablePagination from "../Common/DataTablePagination";
import pos from "../../assets/img/products/pos-product-01.jpg";
import { toast } from "react-toastify";
import { BsSearch } from "react-icons/bs";
const ProductsList = ({ products = [] }) => {
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: user, isLoading: userLoading } = useGetProfileQuery();
  const [addProductToCart, { isLoading: cartLoading }] =
    useAddProductToCartMutation();

  const userId = user?.user?.userId;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];
  const baseProducts = Array.isArray(productsData) ? productsData : [];
  console.log(baseProducts);
  const displayedProducts = baseProducts.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (currentPage >= Math.ceil(displayedProducts.length / itemsPerPage)) {
      setCurrentPage(0);
    }
  }, [displayedProducts.length, currentPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const getCategoryName = (categoryId) => {
    return (
      categories.find((cat) => cat.categoryId === categoryId)?.name ||
      "Uncategorized"
    );
  };

  const handleAddToCart = async (product) => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }

    const productId = product.productId || product.productId;
    if (!productId) {
      toast.error("Invalid product ID");
      return;
    }

    try {
      await addProductToCart({ userId, productId }).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    }
  };

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

  if (!displayedProducts.length) {
    return (
      <div className="text-center py-4 text-muted">No products available.</div>
    );
  }

  const offset = currentPage * itemsPerPage;
  const currentItems = displayedProducts.slice(offset, offset + itemsPerPage);

  return (
    <div className="products-list py-4">
      {/* Search Bar */}
      <Form.Group className="mb-4" controlId="search-products">
        <Form.Label className="d-flex align-items-center">
          <BsSearch className="me-2 text-muted" />
          Search Products
        </Form.Label>
        <Form.Control
          type="text"
          placeholder="Search by product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      {/* Product Grid */}
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
                  <a
                    href={`/product/${product.productId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none text-dark"
                  >
                    {product.name}
                  </a>
                </Card.Title>
                <Card.Text className="fs-13 text-muted mb-2">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-decoration-none"
                  >
                    {getCategoryName(product.categoryId)}
                  </a>
                </Card.Text>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-teal fs-14 fw-bold">
                    ₹{product.sellingPrice}
                  </span>
                  <span className="text-pink fs-13">
                    {product.quantity} Pcs
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
                    disabled={cartLoading}
                    className="w-100 d-flex align-items-center justify-content-center"
                  >
                    {cartLoading ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      <BsCartPlus className="me-2" />
                    )}
                    Add to Cart
                  </Button>
                </OverlayTrigger>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      <div className="mt-4">
        <DataTablePagination
          totalItems={displayedProducts.length}
          itemNo={itemsPerPage}
          onPageChange={(selectedPage) => setCurrentPage(selectedPage - 1)}
        />
      </div>
    </div>
  );
};

export default ProductsList;
