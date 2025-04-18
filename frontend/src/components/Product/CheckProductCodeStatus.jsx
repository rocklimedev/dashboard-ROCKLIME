import React, { useState } from "react";
import { Modal, Table, Pagination } from "react-bootstrap";
import { useGetAllProductCodesQuery } from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";

const CheckProductCodeStatus = () => {
  const { data: productData } = useGetAllProductCodesQuery();
  const { data: categoryData } = useGetAllCategoriesQuery();

  const [searchCode, setSearchCode] = useState("");
  const [filteredProduct, setFilteredProduct] = useState(null);
  const [productNotFound, setProductNotFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const products = Array.isArray(productData?.data) ? productData.data : [];
  const categories = categoryData?.categories || [];

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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Check Product Code Status</h4>
              <h6>Explore product code availability & category-wise status</h6>
            </div>
          </div>
        </div>

        {/* Search Box */}
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

            {/* Result display */}
            {filteredProduct && (
              <div className="mt-4">
                <h5>✅ Product Found</h5>
                <p>
                  <strong>Name:</strong> {filteredProduct.name}
                  <br />
                  <strong>Product Code:</strong> {filteredProduct.product_code}
                  <br />
                  <strong>Category ID:</strong> {filteredProduct.categoryId}
                </p>
              </div>
            )}

            {!filteredProduct && searchCode && (
              <div className="mt-4">
                <h5>❌ No Product Found</h5>
                {productNotFound && (
                  <p className="text-success">
                    ✅ Product Code is available to use.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Grid */}
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="mb-3">Explore Products by Category:</h5>
            <div className="row">
              {categories.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="col-lg-4 col-md-6 col-sm-12 mb-3"
                >
                  <div
                    className="border rounded p-3 shadow-sm category-box cursor-pointer h-100"
                    onClick={() => handleCategoryClick(cat.categoryId)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">{cat.name}</h6>
                      <span className="badge badge-count">
                        {
                          products.filter(
                            (p) => p.categoryId === cat.categoryId
                          ).length
                        }
                      </span>
                    </div>

                    {cat.parentcategories && (
                      <small className="text-muted">
                        Parent: {cat.parentcategories.name}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Products in Selected Category</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {paginatedProducts.length > 0 ? (
              <>
                <Table striped bordered hover>
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
                        <td>{product.name}</td>
                        <td>{product.product_code}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination className="justify-content-center">
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
