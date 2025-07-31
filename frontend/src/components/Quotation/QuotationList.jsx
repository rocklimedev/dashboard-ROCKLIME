import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGetAllQuotationsQuery,
  useDeleteQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { FaSearch } from "react-icons/fa";
import QuotationProductModal from "./QuotationProductModal";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import ReactPaginate from "react-paginate";
import Actions from "../Common/Actions";
import PageHeader from "../Common/PageHeader";
const QuotationList = () => {
  const navigate = useNavigate();
  const {
    data: quotationsData,
    isLoading,
    isError,
    refetch,
  } = useGetAllQuotationsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const [deleteQuotation, { isLoading: isDeleting }] =
    useDeleteQuotationMutation();

  const quotations = quotationsData || [];
  const customers = customersData?.data || [];
  const users = usersData?.users || [];

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const itemsPerPage = 10;

  // Define helper functions
  const getProductCount = (products) => {
    const parsedProducts =
      typeof products === "string"
        ? JSON.parse(products || "[]")
        : products || [];
    return parsedProducts.length;
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.name : "Unknown";
  };

  const getUserName = (createdBy) => {
    if (!users || users.length === 0 || !createdBy) return "Unknown";
    const user = users.find(
      (u) => u.userId && u.userId.trim() === createdBy.trim()
    );
    return user ? user.name : "Unknown";
  };

  // Memoized grouped quotations for tab-based filtering
  const groupedQuotations = useMemo(
    () => ({
      All: quotations,
      Accepted: quotations.filter(
        (q) => q.status?.toLowerCase() === "accepted"
      ),
      Pending: quotations.filter((q) => q.status?.toLowerCase() === "pending"),
      Rejected: quotations.filter(
        (q) => q.status?.toLowerCase() === "rejected"
      ),
    }),
    [quotations]
  );

  // Filtered and sorted quotations
  const filteredQuotations = useMemo(() => {
    let result = groupedQuotations[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((q) => {
        const customerName = getCustomerName(q.customerId);
        return (
          q.document_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.reference_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          (a.reference_number || "").localeCompare(b.reference_number || "")
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          (b.reference_number || "").localeCompare(a.reference_number || "")
        );
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.quotation_date) - new Date(a.quotation_date)
        );
        break;
      default:
        break;
    }

    return result;
  }, [groupedQuotations, activeTab, searchTerm, sortBy]);

  // Paginated quotations
  const currentQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuotations, currentPage]);

  // Handlers
  const handleAddQuotation = () => navigate("/quotations/add");

  const handleDeleteClick = (quotation) => {
    setQuotationToDelete(quotation);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!quotationToDelete?.quotationId) {
      toast.error("No quotation selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteQuotation(quotationToDelete.quotationId).unwrap();
      toast.success("Quotation deleted successfully!");
      setShowDeleteModal(false);
      setQuotationToDelete(null);
      refetch();
      if (currentQuotations.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      toast.error(
        `Failed to delete quotation: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleOpenProductModal = (products) => {
    const parsedProducts =
      typeof products === "string"
        ? JSON.parse(products || "[]")
        : products || [];
    setSelectedProducts(parsedProducts);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProducts([]);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected + 1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
    toast.success("Filters cleared!");
  };

  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading quotations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error fetching quotations!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="card">
        <PageHeader
          title="Quotations"
          subtitle="Manage your Quotations"
          onAdd={handleAddQuotation}
        />
        <div className="card-body">
          <div className="row">
            <div className="col-lg-4">
              <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                <h6 className="me-2">Status</h6>
                <ul
                  className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                  id="pills-tab"
                  role="tablist"
                >
                  {Object.keys(groupedQuotations).map((status) => (
                    <li className="nav-item" role="presentation" key={status}>
                      <button
                        className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                          activeTab === status ? "active" : ""
                        }`}
                        id={`tab-${status}`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${status}`}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === status}
                        onClick={() => setActiveTab(status)}
                      >
                        {status} ({groupedQuotations[status].length})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                <div className="d-flex align-items-center border p-2 rounded">
                  <span className="d-inline-flex me-2">Sort By: </span>
                  <div className="dropdown">
                    <a
                      href="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center border-0 bg-transparent p-0 text-dark"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {sortBy}
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      {["Recently Added", "Ascending", "Descending"].map(
                        (option) => (
                          <li key={option}>
                            <a
                              href="#"
                              className="dropdown-item rounded-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSortBy(option);
                              }}
                            >
                              {option}
                            </a>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
                <div className="input-icon-start position-relative">
                  <span className="input-icon-addon">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Quotations"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search quotations"
                  />
                </div>
                <button
                  className="btn btn-outline-secondary ms-2"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          <div className="tab-content" id="pills-tabContent">
            {Object.entries(groupedQuotations).map(([status, list]) => (
              <div
                className={`tab-pane fade ${
                  activeTab === status ? "show active" : ""
                }`}
                id={`pills-${status}`}
                role="tabpanel"
                aria-labelledby={`tab-${status}`}
                key={status}
              >
                {currentQuotations.length === 0 ? (
                  <p className="text-muted">
                    No {status.toLowerCase()} quotations match the applied
                    filters
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Quotation Title</th>
                          <th>Quotation Date</th>
                          <th>Due Date</th>
                          <th>Reference Number</th>
                          <th>Include GST</th>
                          <th>Products</th>
                          <th>Discount Type</th>
                          <th>Round Off</th>
                          <th>Created By</th>
                          <th>Customer</th>
                          <th>Final Amount</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentQuotations.map((quotation) => (
                          <tr key={quotation.quotationId}>
                            <td>{quotation.document_title || "N/A"}</td>
                            <td>
                              {new Date(
                                quotation.quotation_date
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              {new Date(
                                quotation.due_date
                              ).toLocaleDateString()}
                            </td>
                            <td>{quotation.reference_number || "N/A"}</td>
                            <td>{quotation.include_gst ? "Yes" : "No"}</td>
                            <td>
                              <button
                                className="btn btn-link"
                                onClick={() =>
                                  handleOpenProductModal(quotation.products)
                                }
                                style={{ color: "#e31e24" }}
                                aria-label="View products"
                              >
                                View Products (
                                {getProductCount(quotation.products)})
                              </button>
                            </td>
                            <td>{quotation.discountType || "N/A"}</td>
                            <td>{quotation.roundOff || "N/A"}</td>
                            <td>{getUserName(quotation.createdBy)}</td>
                            <td>{getCustomerName(quotation.customerId)}</td>
                            <td>₹{quotation.finalAmount || 0}</td>
                            <td>
                              <Actions
                                viewUrl={`/quotations/${quotation.quotationId}`}
                                editUrl={`/quotations/${quotation.quotationId}/edit`}
                                onDelete={() => handleDeleteClick(quotation)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredQuotations.length > itemsPerPage && (
                      <div className="pagination-section mt-4">
                        <ReactPaginate
                          previousLabel={"Previous"}
                          nextLabel={"Next"}
                          breakLabel={"..."}
                          pageCount={Math.ceil(
                            filteredQuotations.length / itemsPerPage
                          )}
                          marginPagesDisplayed={2}
                          pageRangeDisplayed={3}
                          onPageChange={handlePageChange}
                          containerClassName={
                            "pagination justify-content-end mb-0"
                          }
                          pageClassName={"page-item"}
                          pageLinkClassName={"page-link"}
                          previousClassName={"page-item"}
                          previousLinkClassName={"page-link"}
                          nextClassName={"page-item"}
                          nextLinkClassName={"page-link"}
                          breakClassName={"page-item"}
                          breakLinkClassName={"page-link"}
                          activeClassName={"active"}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <QuotationProductModal
        show={showProductModal}
        onHide={handleCloseProductModal}
        products={selectedProducts}
      />
      {showDeleteModal && (
        <DeleteModal
          item={quotationToDelete}
          itemType="Quotation"
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setQuotationToDelete(null);
          }}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default QuotationList;
