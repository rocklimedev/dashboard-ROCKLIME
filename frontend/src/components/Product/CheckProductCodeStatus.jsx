import React, { useState, useMemo } from "react";
import { Modal, Table, Pagination } from "react-bootstrap";
import { useGetAllProductCodesQuery } from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { Link } from "react-router-dom";

// Define styles object for professional look
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
    margin: "0 auto",
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
  categoryBox: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "15px",
    backgroundColor: "#fff",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
  },
  categoryBoxHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
    backgroundColor: "#007bff",
    color: "#fff",
  },
  categoryParent: {
    fontSize: "12px",
    color: "#777",
    marginTop: "5px",
  },
  modalHeader: {
    backgroundColor: "#007bff",
    color: "#fff",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "500",
  },
  table: {
    fontSize: "14px",
    borderRadius: "8px",
    overflow: "hidden",
  },
  pagination: {
    marginTop: "20px",
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
  const [filteredProduct, setFilteredProduct] = useState(null);
  const [productNotFound, setProductNotFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const products = Array.isArray(productData?.data) ? productData.data : [];
  const categories = categoryData?.categories || [];

  // Category ID to name mapping
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.categoryId] = cat.name;
    });
    return map;
  }, [categories]);

  const handleSearch = () => {
    const result = products.find(
      (p) => p.product_code?.toLowerCase() === searchCode.trim().toLowerCase()
    );
    setFilteredProduct(result || null);
    setProductNotFound(!result);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowModal(true);
    setPage(1);
  };

  const filteredCategoryProducts = products.filter(
    (p) => p.categoryId === selectedCategory
  );

  const paginatedProducts = filteredCategoryProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalPages = Math.ceil(filteredCategoryProducts.length / pageSize);

  // Condensed pagination logic
  const getPaginationItems = () => {
    const maxPagesToShow = 5; // Show current page + 2 before + 2 after
    const items = [];

    // Always show first page
    items.push(
      <Pagination.Item key={1} active={1 === page} onClick={() => setPage(1)}>
        {1}
      </Pagination.Item>
    );

    // Add ellipsis if there's a gap after the first page
    if (page > maxPagesToShow - 1) {
      items.push(<Pagination.Ellipsis key="start-ellipsis" />);
    }

    // Calculate the range of pages to show
    const startPage = Math.max(2, page - 2);
    const endPage = Math.min(totalPages - 1, page + 2);

    // Add pages around the current page
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item key={i} active={i === page} onClick={() => setPage(i)}>
          {i}
        </Pagination.Item>
      );
    }

    // Add ellipsis if there's a gap before the last page
    if (endPage < totalPages - 1) {
      items.push(<Pagination.Ellipsis key="end-ellipsis" />);
    }

    // Always show last page if there are 2 or more pages
    if (totalPages > 1) {
      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === page}
          onClick={() => setPage(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    return items;
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div style={styles.pageWrapper}>
        <div className="content text-center">
          <p>Loading products and categories...</p>
        </div>
      </div>
    );
  }

  if (productsError || categoriesError) {
    return (
      <div>
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
          <div className="card-body p-4 text-center">
            <div style={styles.searchInputWrapper}>
              <span style={styles.searchIcon}>
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Product Code"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={styles.searchInput}
                aria-label="Search product code"
              />
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
            <div className="row">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="col-lg-4 col-md-6 col-sm-12 mb-3"
                  >
                    <div
                      className="category-box"
                      style={styles.categoryBox}
                      onClick={() => handleCategoryClick(cat.categoryId)}
                      onMouseEnter={(e) =>
                        Object.assign(
                          e.currentTarget.style,
                          styles.categoryBoxHover
                        )
                      }
                      onMouseLeave={(e) =>
                        Object.assign(e.currentTarget.style, styles.categoryBox)
                      }
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
                          Parent: {cat.parentcategories.name}
                        </small>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted">
                  No categories available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton style={styles.modalHeader}>
            <Modal.Title style={styles.modalTitle}>
              Products in Selected Category
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
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product, idx) => (
                      <tr key={product.id}>
                        <td>{(page - 1) * pageSize + idx + 1}</td>
                        <td>
                          <Link to={`/product/${product.productId}`}>
                            {product.name}
                          </Link>
                        </td>
                        <td>{product.product_code}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination
                  className="justify-content-center"
                  style={styles.pagination}
                >
                  <Pagination.Prev
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  />
                  {getPaginationItems()}
                  <Pagination.Next
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={page === totalPages}
                  />
                </Pagination>
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
