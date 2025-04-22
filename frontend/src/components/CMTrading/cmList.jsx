import React, { useState, useEffect, useRef } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllCompaniesQuery,
  useDeleteCompanyMutation,
} from "../../api/companyApi";
import { BiEdit, BiTrash } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import AddCompany from "./AddCompany";
import { toast } from "react-toastify"; // Optional: for notifications
import DeleteModal from "../Common/DeleteModal";
const ViewCompany = ({ company, onClose }) => {
  const modalRef = useRef(null);

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Handle click outside modal
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
                  <strong>Company Name:</strong> {company.name}
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
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`badge ${
                      company.status === "Active"
                        ? "badge-success"
                        : "badge-danger"
                    }`}
                  >
                    {company.status || "Unknown"}
                  </span>
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
  const [deleteCompany, { isLoading: isDeleting }] = useDeleteCompanyMutation();
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for DeleteModal
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null); // New state for company to delete
  const [editingCompany, setEditingCompany] = useState(null);

  const companies = Array.isArray(data?.companies) ? data.companies : [];

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

  const handleConfirmDelete = async (company) => {
    try {
      await deleteCompany(company.companyId).unwrap();
      toast.success("Company deleted successfully!");
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

  if (isLoading) return <p>Loading...</p>;
  if (error)
    return (
      <p>Error loading companies: {error.data?.message || "Unknown error"}</p>
    );

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Companies"
          subtitle="Manage your companies"
          onAdd={handleAddCompany}
        />

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
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
                  {companies.map((company) => (
                    <tr key={company.companyId}>
                      <td>{company.name}</td>
                      <td>{company.address || "N/A"}</td>
                      <td>{company.website || "N/A"}</td>
                      <td>{company.slug || "N/A"}</td>
                      <td>
                        {company.createdDate
                          ? new Date(company.createdDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            company.status === "Active"
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {company.parentCompanyId || "None"}
                        </span>
                      </td>
                      <td>
                        <div className="edit-delete-action">
                          <a
                            className="me-2 p-2"
                            href="javascript:void(0);"
                            onClick={() => handleViewCompany(company)}
                          >
                            <FaEye />
                          </a>
                          <a
                            className="me-2 p-2"
                            onClick={() => handleEditCompany(company)}
                          >
                            <BiEdit />
                          </a>
                          <a
                            className="p-2"
                            onClick={() => handleDeleteCompany(company)}
                          >
                            <BiTrash />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Company Modal */}
      {showCompanyModal && (
        <AddCompany
          onClose={handleCloseCompanyModal}
          companyToEdit={editingCompany}
        />
      )}

      {/* View Company Modal */}
      {showViewModal && (
        <ViewCompany company={selectedCompany} onClose={handleCloseViewModal} />
      )}

      {/* Delete Company Modal */}
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
  );
};

export default CmList;
