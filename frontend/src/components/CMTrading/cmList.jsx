import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  useGetAllQueriesQuery,
  useDeleteQueryMutation,
} from "../../api/contactApi";
import { FaEye, FaSearch } from "react-icons/fa";
import { BiTrash } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import PageHeader from "../Common/PageHeader";
import { toast } from "sonner";

// View Query Modal Component
const ViewQuery = ({ query, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleOutsideClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  if (!query) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      onClick={handleOutsideClick}
    >
      <div className="modal-dialog modal-lg" role="document" ref={modalRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Query Details</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>Name:</strong> {query.firstName}{" "}
                  {query.lastName || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {query.email}
                </p>
                <p>
                  <strong>Phone:</strong> {query.phone || "N/A"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Message:</strong> {query.message}
                </p>
                <p>
                  <strong>Created Date:</strong>{" "}
                  {new Date(query.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactWrapper = () => {
  const { data, error, isLoading, refetch } = useGetAllQueriesQuery();
  const [deleteQuery, { isLoading: isDeleting }] = useDeleteQueryMutation();

  // State
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [queryToDelete, setQueryToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debugging: Log when component renders
  useEffect(() => {
    console.log("ContactWrapper rendered", { searchTerm, sortBy, currentPage });
  });

  // Ensure queries is an array
  const queries = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data]
  );

  // Memoized filtered and sorted queries
  const filteredQueries = useMemo(() => {
    let result = [...queries];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((q) =>
        [q.firstName, q.lastName, q.email, q.message]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "Name (A-Z)":
        result = [...result].sort((a, b) =>
          `${a.firstName} ${a.lastName || ""}`.localeCompare(
            `${b.firstName} ${b.lastName || ""}`
          )
        );
        break;
      case "Name (Z-A)":
        result = [...result].sort((a, b) =>
          `${b.firstName} ${b.lastName || ""}`.localeCompare(
            `${a.firstName} ${a.lastName || ""}`
          )
        );
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        break;
    }

    return result;
  }, [queries, searchTerm, sortBy]);

  // Paginated queries
  const currentQueries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQueries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQueries, currentPage]);

  // Handlers
  const handleViewQuery = useCallback((query) => {
    console.log("handleViewQuery called", query._id);
    setSelectedQuery(query);
    setShowViewModal(true);
  }, []);

  const handleDeleteQuery = useCallback((query) => {
    console.log("handleDeleteQuery called", query._id);
    setQueryToDelete(query);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!queryToDelete?._id) {
      toast.error("No query selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      console.log("Deleting query", queryToDelete._id);
      await deleteQuery(queryToDelete._id).unwrap();
      toast.success("Query deleted successfully");

      // Update currentPage only if necessary
      if (currentQueries.length === 1 && currentPage > 1) {
        console.log("Adjusting currentPage due to last item deletion");
        setCurrentPage((prev) => prev - 1);
      }

      setShowDeleteModal(false);
      setQueryToDelete(null);
      // Delay refetch to avoid immediate re-render
      setTimeout(() => {
        console.log("Refetching queries");
        refetch();
      }, 0);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        `Failed to delete query: ${
          error?.data?.message || error?.message || "Unknown error"
        }`
      );
      setShowDeleteModal(false);
      setQueryToDelete(null);
    }
  }, [queryToDelete, deleteQuery, currentQueries.length, currentPage, refetch]);

  const handleCloseViewModal = useCallback(() => {
    console.log("handleCloseViewModal called");
    setShowViewModal(false);
    setSelectedQuery(null);
  }, []);

  const handleCancelDelete = useCallback(() => {
    console.log("handleCancelDelete called");
    setShowDeleteModal(false);
    setQueryToDelete(null);
  }, []);

  const handlePageChange = useCallback((page) => {
    console.log("handlePageChange called", page);
    setCurrentPage(page);
  }, []);

  const clearFilters = useCallback(() => {
    console.log("clearFilters called");
    setSearchTerm("");
    setSortBy("Recently Added");
    setCurrentPage(1);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="card">
            <div className="card-body text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading queries...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="card">
            <div className="card-body">
              <div className="alert alert-danger" role="alert">
                Error loading queries:{" "}
                {error?.data?.message || error?.error || "Unknown error"}
              </div>
              <button className="btn btn-primary" onClick={refetch}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Contact Queries"
            subtitle="Manage customer queries"
            tableData={filteredQueries}
          />
          <div className="card-body">
            <div className="row">
              <div className="col-lg-12">
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
                        {["Recently Added", "Name (A-Z)", "Name (Z-A)"].map(
                          (option) => (
                            <li key={option}>
                              <a
                                href="#"
                                className="dropdown-item rounded-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  console.log("Sort option selected:", option);
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
                      placeholder="Search Queries"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search queries"
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
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Message</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQueries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-muted text-center">
                        No queries match the applied filters
                      </td>
                    </tr>
                  ) : (
                    currentQueries.map((query) => (
                      <tr key={query._id}>
                        <td>
                          {query.firstName} {query.lastName || "N/A"}
                        </td>
                        <td>{query.email}</td>
                        <td>{query.phone || "N/A"}</td>
                        <td>{query.message.substring(0, 50)}...</td>
                        <td>
                          {new Date(query.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="dropdown">
                            <button
                              className="btn btn-outline-secondary btn-sm dropdown-toggle"
                              type="button"
                              id={`dropdownMenuButton-${query._id}`}
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <BsThreeDotsVertical />
                            </button>
                            <ul
                              className="dropdown-menu"
                              aria-labelledby={`dropdownMenuButton-${query._id}`}
                            >
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleViewQuery(query)}
                                >
                                  <FaEye className="me-2" />
                                  View
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDeleteQuery(query)}
                                >
                                  <BiTrash className="me-2" />
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredQueries.length > itemsPerPage && (
                <div className="pagination-section mt-4">
                  <DataTablePagination
                    totalItems={filteredQueries.length}
                    itemNo={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showViewModal && (
          <ViewQuery query={selectedQuery} onClose={handleCloseViewModal} />
        )}
        {showDeleteModal && (
          <DeleteModal
            item={queryToDelete}
            itemType="Query"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            isVisible={showDeleteModal}
            isLoading={isDeleting}
          />
        )}
      </div>
    </div>
  );
};

export default ContactWrapper;
