import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  useGetAllCompaniesQuery,
  useDeleteCompanyMutation,
} from "../../api/companyApi";
import { BiEdit, BiTrash } from "react-icons/bi";
import { FaEye, FaSearch } from "react-icons/fa";
import AddCompany from "./AddCompany";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { toast } from "sonner";
import PageHeader from "../Common/PageHeader";
import { BsThreeDotsVertical } from "react-icons/bs";
const ViewCompany = ({ company, onClose }) => {
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

  if (!company) return null;

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
            <h5 className="modal-title">Company Details</h5>
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
                  <strong>Company Name:</strong> {company.name || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {company.address || "N/A"}
                </p>
                <p>
                  <strong>Website:</strong> {company.website || "N/A"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Slug:</strong> {company.slug || "N/A"}
                </p>
                <p>
                  <strong>Created Date:</strong>{" "}
                  {company.createdDate
                    ? new Date(company.createdDate).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Parent Company ID:</strong>{" "}
                  {company.parentCompanyId || "N/A"}
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

const CmList = () => {
  const { data, error, isLoading } = useGetAllCompaniesQuery();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const companies = Array.isArray(data?.companies) ? data.companies : [];

  // Memoized grouped companies for tab-based filtering
  const groupedCompanies = useMemo(
    () => ({
      All: companies,
      Active: companies.filter((c) => c.status?.toLowerCase() === "active"),
      Inactive: companies.filter((c) => c.status?.toLowerCase() === "inactive"),
    }),
    [companies]
  );

  // Filtered and sorted companies
  const filteredCompanies = useMemo(() => {
    let result = groupedCompanies[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((c) =>
        [c.name, c.address, c.website, c.slug]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Descending":
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
        );
        break;
      default:
        break;
    }

    return result;
  }, [groupedCompanies, activeTab, searchTerm, sortBy]);

  // Paginated companies
  const currentCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCompanies, currentPage]);

  // Handlers
  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowCompanyModal(true);
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setShowCompanyModal(true);
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setShowViewModal(true);
  };

  const handleDeleteCompany = (company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete?.companyId) {
      toast.error("No company selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteCompany(companyToDelete.companyId).unwrap();
      toast.success("Company deleted successfully!");
      if (currentCompanies.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    } catch (error) {
      toast.error(
        `Failed to delete company: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCompanyToDelete(null);
  };

  const handleCloseCompanyModal = () => {
    setShowCompanyModal(false);
    setEditingCompany(null);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedCompany(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
            <p>Loading companies...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error loading companies: {error.data?.message || "Unknown error"}
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
            title="Companies"
            subtitle="Manage your Companies"
            onAdd={handleAddCompany}
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
                      placeholder="Search Companies"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search companies"
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
              {Object.entries(groupedCompanies).map(([status, list]) => (
                <div
                  className={`tab-pane fade ${
                    activeTab === status ? "show active" : ""
                  }`}
                  id={`pills-${status}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${status}`}
                  key={status}
                >
                  {currentCompanies.length === 0 ? (
                    <p className="text-muted">
                      No {status.toLowerCase()} companies match the applied
                      filters
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Company Name</th>
                            <th>Address</th>
                            <th>Website</th>
                            <th>Slug</th>
                            <th>Created Date</th>
                            <th>Parent Company</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentCompanies.map((company) => (
                            <tr key={company.companyId}>
                              <td>{company.name || "N/A"}</td>
                              <td>{company.address || "N/A"}</td>
                              <td>{company.website || "N/A"}</td>
                              <td>{company.slug || "N/A"}</td>
                              <td>
                                {company.createdDate
                                  ? new Date(
                                      company.createdDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td>{company.parentCompanyId || "None"}</td>
                              <td>
                                <div className="dropdown">
                                  <button
                                    className="btn btn-outline-secondary btn-sm dropdown-toggle"
                                    type="button"
                                    id={`dropdownMenuButton-${company.companyId}`}
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                  >
                                    <BsThreeDotsVertical />
                                  </button>
                                  <ul
                                    className="dropdown-menu"
                                    aria-labelledby={`dropdownMenuButton-${company.companyId}`}
                                  >
                                    <li>
                                      <button
                                        className="dropdown-item"
                                        onClick={() =>
                                          handleViewCompany(company)
                                        }
                                      >
                                        <FaEye className="me-2" />
                                        View
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        className="dropdown-item"
                                        onClick={() =>
                                          handleEditCompany(company)
                                        }
                                      >
                                        <BiEdit className="me-2" />
                                        Edit
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        className="dropdown-item text-danger"
                                        onClick={() =>
                                          handleDeleteCompany(company)
                                        }
                                      >
                                        <BiTrash className="me-2" />
                                        Delete
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredCompanies.length > itemsPerPage && (
                        <div className="pagination-section mt-4">
                          <DataTablePagination
                            totalItems={filteredCompanies.length}
                            itemNo={itemsPerPage}
                            onPageChange={handlePageChange}
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

        {/* Modals */}
        {showCompanyModal && (
          <AddCompany
            onClose={handleCloseCompanyModal}
            companyToEdit={editingCompany}
          />
        )}
        {showViewModal && (
          <ViewCompany
            company={selectedCompany}
            onClose={handleCloseViewModal}
          />
        )}
        {showDeleteModal && (
          <DeleteModal
            item={companyToDelete}
            itemType="Company"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            isVisible={showDeleteModal}
          />
        )}
      </div>
    </div>
  );
};

export default CmList;
