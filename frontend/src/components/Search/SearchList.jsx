import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Spinner,
  Card,
  Row,
  Col,
  Pagination,
} from "react-bootstrap";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";
import { useSearchAllQuery } from "../../api/searchApi";
const SearchList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearchTerm = queryParams.get("query") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [page, setPage] = useState({}); // Object to track page per model
  const limit = 10;

  // Use RTK Query hook to fetch search results
  const { data, isLoading, isError, error } = useSearchAllQuery(
    { query: searchTerm, page: 1, limit },
    { skip: !searchTerm } // Skip query if searchTerm is empty
  );

  // Update search term when URL changes
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    setPage({}); // Reset pagination for all models
    toast.success(`Searching for "${searchTerm}"`);
  };

  const handlePageChange = (modelName, newPage) => {
    setPage((prev) => ({ ...prev, [modelName]: newPage }));
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p>Searching...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-4 text-danger">{error.message}</div>
      );
    }

    if (
      !data ||
      Object.keys(data.results).every((key) => !data.results[key].items.length)
    ) {
      return (
        <div className="text-center py-4 text-muted">
          No results found for "{searchTerm}".
        </div>
      );
    }

    return (
      <div className="search-results">
        {Object.entries(data.results).map(([modelName, result]) => {
          if (!result.items.length) return null;

          const currentPage = page[modelName] || 1;
          const paginatedItems = result.items.slice(
            (currentPage - 1) * limit,
            currentPage * limit
          );

          return (
            <div key={modelName} className="mb-4">
              <h5 className="mb-3">{modelName} Results</h5>
              <Row className="g-3">
                {paginatedItems.map((item) => (
                  <Col
                    key={item[`${modelName.toLowerCase()}Id`] || item.id}
                    md={6}
                  >
                    <Card className="shadow-none">
                      <Card.Body>
                        <Link
                          to={`/${modelName.toLowerCase()}/${
                            item[`${modelName.toLowerCase()}Id`] || item.id
                          }`}
                          className="text-info text-truncate mb-2"
                        >
                          {item.name ||
                            item.title ||
                            item.document_title ||
                            item.invoiceNo ||
                            item.keyword ||
                            item.teamName ||
                            item.vendorName ||
                            item.roleName ||
                            item.username ||
                            item.street ||
                            item.brandName}
                        </Link>
                        <p className="text-truncate line-clamb-2 mb-2">
                          {item.description ||
                            item.address ||
                            item.email ||
                            item.mobileNumber ||
                            item.product_code ||
                            item.company_code ||
                            JSON.stringify(item.products) ||
                            "No additional details available"}
                        </p>
                        <div className="d-flex align-items-center flex-wrap row-gap-2">
                          <span className="text">
                            {" "}
                            {modelName} ID:{" "}
                            {item[`${modelName.toLowerCase()}Id`] || item.id}
                          </span>
                          {item.sellingPrice && (
                            <span className="text-gray-9 ms-3">
                              Price: ${item.sellingPrice}
                            </span>
                          )}
                        </div>
                        {/* Display images for models like Product */}
                        {item.images && Array.isArray(item.images) && (
                          <Row className="g-3 mt-3">
                            {item.images.slice(0, 1).map((img, idx) => (
                              <Col key={idx} xl={2} md={4} className="col-6">
                                <a
                                  href={img}
                                  data-fancybox="gallery"
                                  className="gallery-item"
                                >
                                  <img
                                    src={img}
                                    className="rounded"
                                    alt="product"
                                  />
                                </a>
                              </Col>
                            ))}
                          </Row>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              {result.pages > 1 && (
                <Pagination className="mt-3">
                  <Pagination.Prev
                    onClick={() =>
                      handlePageChange(modelName, Math.max(currentPage - 1, 1))
                    }
                    disabled={currentPage === 1}
                  />
                  {[...Array(result.pages).keys()].map((p) => (
                    <Pagination.Item
                      key={p + 1}
                      active={p + 1 === currentPage}
                      onClick={() => handlePageChange(modelName, p + 1)}
                    >
                      {p + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() =>
                      handlePageChange(
                        modelName,
                        Math.min(currentPage + 1, result.pages)
                      )
                    }
                    disabled={currentPage === result.pages}
                  />
                </Pagination>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Search List</h4>
              <h6>Manage your search</h6>
            </div>
          </div>
          <div className="d-flex flex-sm-row flex-column align-items-sm-center align-items-start">
            <ul className="table-top-head">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setSearchTerm("");
                    setPage({});
                    toast.info("Search reset");
                  }}
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Refresh"
                >
                  <i className="ti ti-refresh"></i>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Collapse"
                  id="collapse-header"
                >
                  <i className="ti ti-chevron-up"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <Form onSubmit={handleSearch}>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="text"
                  className="flex-fill me-3"
                  placeholder="Enter search term (e.g., ceramic, user, invoice)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </Form>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {searchTerm && (
              <h5 className="mb-3">Search result for "{searchTerm}"</h5>
            )}
            {renderResults()}
          </div>
        </div>
      </div>
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014 - 2025 © DreamsPOS. All Right Reserved</p>
        <p>
          Designed & Developed by{" "}
          <a href="javascript:void(0);" className="text-primary">
            Dreams
          </a>
        </p>
      </div>
    </div>
  );
};

export default SearchList;
