import React, { useState, useEffect, useRef } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllCompaniesQuery,
  useDeleteCompanyMutation,
} from "../../api/companyApi";
import { BiEdit, BiTrash } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import AddCompany from "./AddCompany";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { toast } from "sonner";

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
  const [deleteCompany] = useDeleteCompanyMutation();
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const companies = Array.isArray(data?.companies) ? data.companies : [];

  // Format companies for tableData prop
  const formattedCompanies = companies.map((company) => ({
    companyId: company.companyId,
    name: company.name,
    address: company.address || "N/A",
    website: company.website || "N/A",
    slug: company.slug || "N/A",
    createdDate: company.createdDate
      ? new Date(company.createdDate).toLocaleDateString()
      : "N/A",
    parentCompanyId: company.parentCompanyId || "None",
  }));

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
      if (currentCompanies.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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

  // Calculate the companies to show on current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCompanies = companies.slice(indexOfFirstItem, indexOfLastItem);

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
          tableData={formattedCompanies} // Pass formatted companies to PageHeader
        />
        <div className="cm-table-wrapper">
          <table className="cm-table">
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
                  <td>{company.name}</td>
                  <td>{company.address || "N/A"}</td>
                  <td>{company.website || "N/A"}</td>
                  <td>{company.slug || "N/A"}</td>
                  <td>
                    {company.createdDate
                      ? new Date(company.createdDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{company.parentCompanyId || "None"}</td>
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
              {currentCompanies.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-end my-3">
          <DataTablePagination
            totalItems={companies.length}
            itemNo={itemsPerPage}
            onPageChange={handlePageChange}
          />
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
        <ViewCompany company={selectedCompany} onClose={handleCloseViewModal} />
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
  );
};

export default CmList;
