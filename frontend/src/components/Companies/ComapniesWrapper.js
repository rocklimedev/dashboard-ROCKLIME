import React, { useState } from "react";
import {
  useGetVendorsQuery,
  useDeleteVendorMutation,
} from "../../api/vendorApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import PageHeader from "../Common/PageHeader";
import AddCompanyModal from "./AddCompanyModal";
import DeleteModal from "../Common/DeleteModal";
import ViewCompanies from "./ViewCompanies";
import { BiEdit, BiTrash, BiShowAlt } from "react-icons/bi";
import { toast } from "react-toastify";
import DataTablePagination from "../Common/DataTablePagination"; // Import pagination component

const CompaniesWrapper = () => {
  const {
    data: vendorsData,
    error: vendorsError,
    isLoading: vendorsLoading,
  } = useGetVendorsQuery();

  const {
    data: brandsData,
    error: brandsError,
    isLoading: brandsLoading,
  } = useGetAllBrandsQuery();

  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

  // State for modals, selected vendor, and pagination
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewCompanyId, setViewCompanyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const itemsPerPage = 20; // Matches itemNo default in DataTablePagination

  const vendors = Array.isArray(vendorsData) ? vendorsData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  // Get brand name by brandId
  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "Unknown";
  };

  // Handle edit vendor
  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  // Handle add vendor
  const handleAddVendor = () => {
    setSelectedVendor(null);
    setShowModal(true);
  };

  // Handle delete vendor
  const handleDeleteVendor = (vendor) => {
    setVendorToDelete(vendor);
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!vendorToDelete?.id) {
      toast.error("No vendor selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteVendor(vendorToDelete.id).unwrap();
      toast.success("Vendor deleted successfully!");
      // Reset to previous page if current page becomes empty
      if (paginatedVendors.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setVendorToDelete(null);
    } catch (err) {
      toast.error(
        `Failed to delete vendor: ${err.data?.message || "Unknown error"}`
      );
      console.error("Error deleting vendor:", err);
    }
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Paginated vendors
  const paginatedVendors = (() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return vendors.slice(startIndex, endIndex);
  })();

  if (vendorsLoading || brandsLoading) return <p>Loading...</p>;
  if (vendorsError || brandsError)
    return (
      <p>Error fetching data: {JSON.stringify(vendorsError || brandsError)}</p>
    );
  if (vendors.length === 0) return <p>No vendors available.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Vendors"
          subtitle="Manage your Vendors"
          onAdd={handleAddVendor}
        />

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Vendor ID</th>
                    <th>Vendor Name</th>
                    <th>Brand</th>
                    <th>Brand Slug</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td>{vendor.vendorId}</td>
                      <td>{vendor.vendorName}</td>
                      <td>{getBrandName(vendor.brandId)}</td>
                      <td>{vendor.brandSlug}</td>
                      <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => setViewCompanyId(vendor.id)}
                            aria-label="View vendor"
                          >
                            <BiShowAlt />
                          </button>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEditVendor(vendor)}
                            aria-label="Edit vendor"
                          >
                            <BiEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteVendor(vendor)}
                            aria-label="Delete vendor"
                            disabled={isDeleting}
                          >
                            <BiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination Component */}
          <div className="card-footer">
            <DataTablePagination
              totalItems={vendors.length}
              itemNo={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

        {viewCompanyId && (
          <ViewCompanies
            companyId={viewCompanyId}
            onClose={() => setViewCompanyId(null)}
          />
        )}

        {showDeleteModal && (
          <DeleteModal
            item={vendorToDelete}
            itemType="Vendor"
            isVisible={showDeleteModal}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setShowDeleteModal(false);
              setVendorToDelete(null);
            }}
            isLoading={isDeleting}
          />
        )}

        {showModal && (
          <AddCompanyModal
            show={showModal}
            onClose={() => {
              setShowModal(false);
            }}
            existingVendor={selectedVendor}
          />
        )}
      </div>
    </div>
  );
};

export default CompaniesWrapper;
