import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetAllQueriesQuery,
  useDeleteQueryMutation,
} from "../../api/contactApi";
import { FaSearch, FaEye, FaTrash } from "react-icons/fa";
import { Dropdown, Menu, Button, Pagination } from "antd"; // Added Pagination import
import { MoreOutlined } from "@ant-design/icons";
import DeleteModal from "../Common/DeleteModal";
import PageHeader from "../Common/PageHeader";
import { toast } from "sonner";

import { FaTimes } from "react-icons/fa"; // Using react-icons for the close button

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

  // Format the timestamp to resemble email format (e.g., "Mon, Aug 25, 2025, 4:16 PM")
  const formattedDate = new Date(query.createdAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  // Generate a subject line (e.g., truncate message or use a default)
  const subject =
    query.message.length > 50
      ? `${query.message.substring(0, 50)}...`
      : query.message;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      onClick={handleOutsideClick}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="modal-dialog modal-lg email-modal"
        role="document"
        ref={modalRef}
      >
        <div className="modal-content">
          {/* Email Header */}
          <div className="modal-header email-header">
            <div className="email-subject">
              <h5 className="modal-title">{subject}</h5>
            </div>
            <button
              type="button"
              className="email-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
          {/* Email Sender Info */}
          <div className="email-sender-info p-3 border-bottom">
            <div className="d-flex align-items-center">
              <div className="email-avatar">
                <span className="avatar-initial">
                  {query.firstName ? query.firstName[0].toUpperCase() : "U"}
                </span>
              </div>
              <div className="ms-3">
                <div className="email-sender-name">
                  <strong>{`${query.firstName} ${
                    query.lastName || ""
                  }`}</strong>
                  <span className="email-address ms-2">
                    &lt;{query.email}&gt;
                  </span>
                </div>
                <div className="email-meta">
                  <span>to me</span> | <span>{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Email Body */}
          <div className="modal-body email-body">
            <p>{query.message}</p>
            {query.phone && (
              <p className="mt-3">
                <strong>Phone:</strong> {query.phone}
              </p>
            )}
          </div>
          {/* Email Footer */}
          <div className="modal-footer email-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
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
      case "Ascending":
        result = [...result].sort((a, b) =>
          `${a.firstName} ${a.lastName || ""}`.localeCompare(
            `${b.firstName} ${b.lastName || ""}`
          )
        );
        break;
      case "Descending":
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

  // Format data for tableData prop
  const formattedTableData = useMemo(() => {
    return currentQueries.map((query) => ({
      queryId: query._id,
      name: `${query.firstName} ${query.lastName || "N/A"}`,
      email: query.email,
      phone: query.phone || "N/A",
      message: query.message.substring(0, 50) + "...",
      createdDate: new Date(query.createdAt).toLocaleDateString(),
    }));
  }, [currentQueries]);

  // Handlers
  const handleViewQuery = useCallback((query) => {
    setSelectedQuery(query);
    setShowViewModal(true);
  }, []);

  const handleDeleteClick = useCallback((query) => {
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
      await deleteQuery(queryToDelete._id).unwrap();
      toast.success("Query deleted successfully");
      setShowDeleteModal(false);
      setQueryToDelete(null);
      refetch();
      if (currentQueries.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      toast.error(
        `Failed to delete query: ${error?.data?.message || "Unknown error"}`
      );
      setShowDeleteModal(false);
      setQueryToDelete(null);
    }
  }, [queryToDelete, deleteQuery, currentQueries.length, currentPage, refetch]);

  const handleCloseViewModal = useCallback(() => {
    setShowViewModal(false);
    setSelectedQuery(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setQueryToDelete(null);
  }, []);

  // Updated handler for Ant Design Pagination
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page); // Ant Design Pagination passes the page number directly
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setCurrentPage(1);
  }, []);

  // Loading state
  if (isLoading) {
    return (
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
    );
  }

  // Error state
  if (error) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error fetching queries:{" "}
              {error?.data?.message || error?.error || "Unknown error"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="card">
            <PageHeader
              title="Contact Queries"
              subtitle="Manage customer queries"
              tableData={formattedTableData}
            />
            <div className="card-body">
              <div className="row">
                <div className="col-lg-12">
                  <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
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
                      <th>S.No.</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Message</th>
                      <th>Created Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQueries.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-muted text-center">
                          No queries match the applied filters
                        </td>
                      </tr>
                    ) : (
                      currentQueries.map((query, index) => (
                        <tr key={query._id}>
                          <td>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td>{`${query.firstName} ${
                            query.lastName || "N/A"
                          }`}</td>
                          <td>{query.email}</td>
                          <td>{query.phone || "N/A"}</td>
                          <td>{query.message.substring(0, 50)}...</td>
                          <td>
                            {new Date(query.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item
                                    key="view"
                                    onClick={() => handleViewQuery(query)}
                                    title="View Query"
                                  >
                                    <FaEye style={{ marginRight: 8 }} />
                                    View
                                  </Menu.Item>
                                  <Menu.Item
                                    key="delete"
                                    onClick={() => handleDeleteClick(query)}
                                    disabled={isDeleting}
                                    style={{ color: "#ff4d4f" }}
                                    title="Delete Query"
                                  >
                                    <FaTrash style={{ marginRight: 8 }} />
                                    Delete
                                  </Menu.Item>
                                </Menu>
                              }
                              trigger={["click"]}
                              placement="bottomRight"
                            >
                              <Button
                                type="text"
                                icon={<MoreOutlined />}
                                aria-label="More actions"
                              />
                            </Dropdown>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {filteredQueries.length > itemsPerPage && (
                  <div className="pagination-section mt-4 d-flex justify-content-end">
                    <Pagination
                      current={currentPage}
                      total={filteredQueries.length}
                      pageSize={itemsPerPage}
                      onChange={handlePageChange}
                      showSizeChanger={false} // Optional: Disable page size changer
                      showQuickJumper={false} // Optional: Disable quick jumper
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showViewModal && (
        <ViewQuery query={selectedQuery} onClose={handleCloseViewModal} />
      )}
      {showDeleteModal && (
        <DeleteModal
          item={queryToDelete}
          itemType="Query"
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteModal}
          isLoading={isDeleting}
        />
      )}
    </>
  );
};

export default ContactWrapper;
