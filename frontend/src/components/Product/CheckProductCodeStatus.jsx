import React, { useState, useMemo, useEffect } from "react";
import { Modal, Table, Pagination } from "react-bootstrap";
import { useGetAllProductCodesQuery } from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { Link } from "react-router-dom";
import "./checkproductcodestatus.css"; // Import the CSS file

// Define inline styles (unchanged)
const styles = {
  searchCard: {
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    padding: "20px",
    marginBottom: "20px",
  },
  searchInputWrapper: {
    position: "relative",
    maxWidth: "400px",
    margin: "0 auto 15px",
  },
  searchInput: {
    borderRadius: "20px",
    paddingLeft: "40px",
    height: "40px",
    fontSize: "14px",
    border: "1px solid #ddd",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
  },
  resultSection: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #eee",
  },
  resultTitle: {
    fontSize: "18px",
    fontWeight: "500",
    marginBottom: "10px",
    color: "#333",
  },
  resultText: {
    fontSize: "14px",
    color: "#444",
    lineHeight: "1.6",
  },
  categoryCard: {
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    padding: "20px",
    marginBottom: "20px",
  },
  categoryTitle: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#333",
    margin: "0",
  },
  categoryBadge: {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "12px",
    backgroundColor: "#333",
    color: "#fff",
  },
  categoryParent: {
    fontSize: "12px",
    color: "#777",
    marginTop: "5px",
  },
  modalHeader: {
    backgroundColor: "#e31e24",
    color: "#fff",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "500",
    color: "#fff",
  },
  table: {
    fontSize: "14px",
    borderRadius: "8px",
    overflow: "hidden",
  },
  pagination: {
    marginTop: "20px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#666",
  },
};

const CheckProductCodeStatus = () => {
  const {
    data: productData,
    isLoading: productsLoading,
    isError: productsError,
  } = useGetAllProductCodesQuery();
  const {
    data: categoryData,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetAllCategoriesQuery();

  const [searchCode, setSearchCode] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [filteredProduct, setFilteredProduct] = useState(null);
  const [productNotFound, setProductNotFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const productPageSize = 25;
  const categoryPageSize = 30;
  const [showModal, setShowModal] = useState(false);

  const products = Array.isArray(productData?.data) ? productData.data : [];
  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];

  // Category ID to name mapping
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.categoryId] = cat.name;
    });
    return map;
  }, [categories]);

  // Filter categories by search term
  const filteredCategories = useMemo(() => {
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchCategory.toLowerCase()) ||
        (cat.parentcategories?.name || "")
          .toLowerCase()
          .includes(searchCategory.toLowerCase())
    );
  }, [categories, searchCategory]);

  // Paginate categories
  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * categoryPageSize,
    categoryPage * categoryPageSize
  );
  const totalCategoryPages = Math.ceil(
    filteredCategories.length / categoryPageSize
  );

  // Filter products by product code only
  const handleSearch = () => {
    let result = products;
    if (searchCode) {
      result = result.filter((p) =>
        p.product_code?.toLowerCase().includes(searchCode.trim().toLowerCase())
      );
    }
    setFilteredProduct(result.length > 0 ? result[0] : null);
    setProductNotFound(result.length === 0);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowModal(true);
    setProductPage(1);
  };

  // Paginate products in modal
  const filteredCategoryProducts = products.filter(
    (p) => p.categoryId === selectedCategory
  );
  const paginatedProducts = filteredCategoryProducts.slice(
    (productPage - 1) * productPageSize,
    productPage * productPageSize
  );
  const totalProductPages = Math.ceil(
    filteredCategoryProducts.length / productPageSize
  );

  // Pagination for categories
  const getCategoryPaginationItems = () => {
    const maxPagesToShow = 5;
    const items = [];

    items.push(
      <Pagination.Item
        key={1}
        active={1 === categoryPage}
        onClick={() => setCategoryPage(1)}
      >
        {1}
      </Pagination.Item>
    );

    if (categoryPage > maxPagesToShow - 1) {
      items.push(<Pagination.Ellipsis key="category-start-ellipsis" />);
    }

    const startPage = Math.max(2, categoryPage - 2);
    const endPage = Math.min(totalCategoryPages - 1, categoryPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === categoryPage}
          onClick={() => setCategoryPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (endPage < totalCategoryPages - 1) {
      items.push(<Pagination.Ellipsis key="category-end-ellipsis" />);
    }

    if (totalCategoryPages > 1) {
      items.push(
        <Pagination.Item
          key={totalCategoryPages}
          active={totalCategoryPages === categoryPage}
          onClick={() => setCategoryPage(totalCategoryPages)}
        >
          {totalCategoryPages}
        </Pagination.Item>
      );
    }

    return items;
  };

  // Pagination for products
  const getProductPaginationItems = () => {
    const maxPagesToShow = 5;
    const items = [];

    items.push(
      <Pagination.Item
        key={1}
        active={1 === productPage}
        onClick={() => setProductPage(1)}
      >
        {1}
      </Pagination.Item>
    );

    if (productPage > maxPagesToShow - 1) {
      items.push(<Pagination.Ellipsis key="product-start-ellipsis" />);
    }

    const startPage = Math.max(2, productPage - 2);
    const endPage = Math.min(totalProductPages - 1, productPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === productPage}
          onClick={() => setProductPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (endPage < totalProductPages - 1) {
      items.push(<Pagination.Ellipsis key="product-end-ellipsis" />);
    }

    if (totalProductPages > 1) {
      items.push(
        <Pagination.Item
          key={totalProductPages}
          active={totalProductPages === productPage}
          onClick={() => setProductPage(totalProductPages)}
        >
          {totalProductPages}
        </Pagination.Item>
      );
    }

    return items;
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Loading products and categories...</p>
        </div>
      </div>
    );
  }

  if (productsError || categoriesError) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">Error fetching data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 style={styles.pageTitle}>Check Product Code Status</h4>
              <h6 style={styles.pageSubtitle}>
                Explore product code availability & category-wise status
              </h6>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="card" style={styles.searchCard}>
          <div className="card-body p-4">
            <div
              style={{
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  ...styles.searchInputWrapper,
                  flex: "1 1 300px",
                  maxWidth: "400px",
                }}
              >
                <span style={styles.searchIcon}>
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Product Code"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  style={styles.searchInput}
                  aria-label="Search product code"
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSearch}
                style={{ height: "40px", borderRadius: "20px" }}
              >
                Search
              </button>
            </div>

            {/* Result display */}
            {filteredProduct && (
              <div style={styles.resultSection}>
                <h5 style={styles.resultTitle}>
                  <i className="ti ti-check me-2 text-success"></i>Product Found
                </h5>
                <p style={styles.resultText}>
                  <strong>Name:</strong> {filteredProduct.name}
                  <br />
                  <strong>Product Code:</strong> {filteredProduct.product_code}
                  <br />
                  <strong>Category:</strong>{" "}
                  {categoryMap[filteredProduct.categoryId] || "Unknown"}
                </p>
                <Link
                  to={`/product/${filteredProduct.productId}/edit`}
                  className="btn btn-sm btn-outline-primary mt-2"
                >
                  Edit Product
                </Link>
              </div>
            )}

            {!filteredProduct && searchCode && productNotFound && (
              <div style={styles.resultSection}>
                <h5 style={styles.resultTitle}>
                  <i className="ti ti-x me-2 text-danger"></i>No Product Found
                </h5>
                <p className="text-success" style={styles.resultText}>
                  <i className="ti ti-check me-2"></i>Product Code is available
                  to use.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Category Grid */}
        <div className="card" style={styles.categoryCard}>
          <div className="card-body">
            <h5 className="mb-3" style={styles.pageTitle}>
              Explore Products by Category
            </h5>
            <div
              style={{
                ...styles.searchInputWrapper,
                maxWidth: "400px",
                marginBottom: "20px",
              }}
            >
              <span style={styles.searchIcon}>
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search Categories"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                style={styles.searchInput}
                aria-label="Search categories"
              />
            </div>
            <div className="row mt-3">
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="col-lg-4 col-md-6 col-sm-12 mb-3"
                  >
                    <div
                      className="category-box"
                      style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        padding: "15px",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => handleCategoryClick(cat.categoryId)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 style={styles.categoryTitle}>{cat.name}</h6>
                        <span style={styles.categoryBadge}>
                          {
                            products.filter(
                              (p) => p.categoryId === cat.categoryId
                            ).length
                          }
                        </span>
                      </div>
                      {cat.parentcategories && (
                        <small style={styles.categoryParent}>
                          {cat.parentcategories.name}
                        </small>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted">
                  No categories match your search.
                </p>
              )}
            </div>
            {totalCategoryPages > 1 && (
              <Pagination
                className="justify-content-center"
                style={styles.pagination}
              >
                <Pagination.Prev
                  onClick={() =>
                    setCategoryPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={categoryPage === 1}
                />
                {getCategoryPaginationItems()}
                <Pagination.Next
                  onClick={() =>
                    setCategoryPage((prev) =>
                      Math.min(totalCategoryPages, prev + 1)
                    )
                  }
                  disabled={categoryPage === totalCategoryPages}
                />
              </Pagination>
            )}
          </div>
        </div>

        {/* Modal for Category Products */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header style={styles.modalHeader}>
            <Modal.Title style={styles.modalTitle}>
              Products in {categoryMap[selectedCategory] || "Selected Category"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {paginatedProducts.length > 0 ? (
              <>
                <Table striped bordered hover style={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Product Code</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product, idx) => (
                      <tr key={product.productId}>
                        <td>{(productPage - 1) * productPageSize + idx + 1}</td>
                        <td>{product.name}</td>
                        <td>{product.product_code}</td>
                        <td>
                          <Link
                            to={`/product/${product.productId}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {totalProductPages > 1 && (
                  <Pagination
                    className="justify-content-center"
                    style={styles.pagination}
                  >
                    <Pagination.Prev
                      onClick={() =>
                        setProductPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={productPage === 1}
                    />
                    {getProductPaginationItems()}
                    <Pagination.Next
                      onClick={() =>
                        setProductPage((prev) =>
                          Math.min(totalProductPages, prev + 1)
                        )
                      }
                      disabled={productPage === totalProductPages}
                    />
                  </Pagination>
                )}
              </>
            ) : (
              <p className="text-center">
                No products found for this category.
              </p>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default CheckProductCodeStatus;
