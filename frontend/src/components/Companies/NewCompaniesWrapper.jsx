import React, { useState, useCallback } from "react";
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
import { toast } from "sonner";
import DataTablePagination from "../Common/DataTablePagination";

const NewCompaniesWrapper = () => {
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

  // State management
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewCompanyId, setViewCompanyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Handle data
  const vendors = Array.isArray(vendorsData) ? vendorsData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  // Get brand name by brandId
  const getBrandName = useCallback(
    (brandId) => {
      const brand = brands.find((b) => b.id === brandId);
      return brand ? brand.brandName : "Unknown";
    },
    [brands]
  );

  // Format vendors for table
  const formattedVendors = vendors.map((vendor) => ({
    id: vendor.id,
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    brand: getBrandName(vendor.brandId),
    createdAt: new Date(vendor.createdAt).toLocaleDateString(),
  }));

  // Pagination
  const paginatedVendors = (() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return formattedVendors.slice(startIndex, endIndex);
  })();

  // Handlers
  const handleEditVendor = useCallback((vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  }, []);

  const handleAddVendor = useCallback(() => {
    setSelectedVendor(null);
    setShowModal(true);
  }, []);

  const handleDeleteVendor = useCallback((vendor) => {
    setVendorToDelete(vendor);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!vendorToDelete?.id) {
      toast.error("No vendor selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteVendor(vendorToDelete.id).unwrap();
      toast.success("Vendor deleted successfully!");
      if (paginatedVendors.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setVendorToDelete(null);
    } catch (err) {
      toast.error(
        `Failed to delete vendor: ${err.data?.message || "Unknown error"}`
      );
    }
  }, [vendorToDelete, deleteVendor, paginatedVendors.length, currentPage]);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  // Loading and error states
  if (vendorsLoading || brandsLoading)
    return <div className="loading">Loading...</div>;
  if (vendorsError || brandsError) {
    toast.error(
      `Error fetching data: ${JSON.stringify(vendorsError || brandsError)}`
    );
    return (
      <div className="error">
        Error loading vendors. Please try again later.
      </div>
    );
  }
  if (vendors.length === 0)
    return <div className="empty">No vendors available.</div>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Vendors"
          subtitle="Manage your Vendors"
          onAdd={handleAddVendor}
          tableData={formattedVendors}
        />
        <div className="cm-table-wrapper">
          <table className="cm-table">
            <thead>
              <tr>
                <th>Vendors Name</th>
                <th>Vendor ID</th>
                <th>Brand</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td data-label="Vendor Name">{vendor.vendorName}</td>
                  <td data-label="Vendor ID">{vendor.vendorId}</td>
                  <td data-label="Brand">{vendor.brand}</td>
                  <td data-label="Date">{vendor.createdAt}</td>
                  <td data-label="Actions">
                    <div className="actions">
                      <BiShowAlt
                        aria-label={`View ${vendor.vendorName}`}
                        onClick={() => setViewCompanyId(vendor.id)}
                        className="action-icon"
                      />
                      <BiEdit
                        aria-label={`Edit ${vendor.vendorName}`}
                        onClick={() => handleEditVendor(vendor)}
                        className="action-icon"
                      />
                      <BiTrash
                        aria-label={`Delete ${vendor.vendorName}`}
                        onClick={() => handleDeleteVendor(vendor)}
                        className="action-icon"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <DataTablePagination
            currentPage={currentPage}
            totalItems={vendors.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
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
            onClose={() => setShowModal(false)}
            existingVendor={selectedVendor}
          />
        )}
      </div>
    </div>
  );
};

export default NewCompaniesWrapper;
