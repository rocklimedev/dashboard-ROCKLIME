import React, { useState } from "react";
import { Modal, Table, Pagination } from "react-bootstrap";
import { useGetAllProductCodesQuery } from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";

const CheckProductCodeStatus = () => {
  const { data: productsData } = useGetAllProductCodesQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();

  const [searchCode, setSearchCode] = useState("");
  const [filteredProduct, setFilteredProduct] = useState(null);
  const [productNotFound, setProductNotFound] = useState(false); // New state for handling product availability message
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const products = Array.isArray(productsData?.data) ? productsData?.data : [];
  const categories = categoriesData?.categories || [];

  const handleSearch = () => {
    const match = products.find(
      (p) => p.product_code?.toLowerCase() === searchCode.trim().toLowerCase()
    );
    setFilteredProduct(match || null);
    setProductNotFound(!match); // If no product is found, set the flag to true
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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Check Product Code Status</h4>
              <h6>Search by Product Code or Explore by Category</h6>
            </div>
          </div>
        </div>

        {/* HERO SECTION - Search Bar */}
        <div className="card">
          <div className="card-body p-4 text-center">
            <div className="position-relative input-icon w-50 mx-auto">
              <span className="input-icon-addon">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Product Code"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            {filteredProduct && (
              <div className="mt-4">
                <h5>Product Found:</h5>
                <p>
                  <strong>Name:</strong> {filteredProduct.name} <br />
                  <strong>Product Code:</strong> {filteredProduct.product_code}{" "}
                  <br />
                  <strong>Category ID:</strong> {filteredProduct.categoryId}
                </p>
              </div>
            )}
            {!filteredProduct && searchCode && (
              <div className="mt-3 text-danger">
                No product found. <br />
                {productNotFound && (
                  <span className="text-success">
                    Product code is available to be taken.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CATEGORY CARDS */}
        <div className="row justify-content-center mt-4">
          {categories.map((category) => {
            const count = products.filter(
              (p) => p.categoryId === category.id
            ).length;

            return (
              <div className="col-xxl-4 col-md-6" key={category.id}>
                <div
                  className="card"
                  onClick={() => handleCategoryClick(category.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body">
                    <div className="img-sec w-100 position-relative mb-3">
                      <div className="trend-tag badge bg-soft-info shadow-none fs-10 fw-medium">
                        {category.name}
                      </div>
                      <span className="badge badge-success dot-icon">
                        <i className="ti ti-point-filled"></i> {count} Products
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL FOR CATEGORY PRODUCTS */}
        <Modal
          size="lg"
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Products in Category</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table bordered hover responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Product Code</th>
                  <th>Category ID</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((prod) => (
                  <tr key={prod.productId}>
                    <td>{prod.name}</td>
                    <td>{prod.product_code}</td>
                    <td>{prod.categoryId}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            <div className="d-flex justify-content-center">
              <Pagination>
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i}
                    active={i + 1 === page}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default CheckProductCodeStatus;
