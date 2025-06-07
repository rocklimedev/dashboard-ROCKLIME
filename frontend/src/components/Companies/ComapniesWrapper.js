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
import { toast } from "sonner";
import DataTablePagination from "../Common/DataTablePagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const vendors = Array.isArray(vendorsData) ? vendorsData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  // Get brand name by brandId
  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "Unknown";
  };

  // Format vendors for tableData prop
  const formattedVendors = vendors.map((vendor) => ({
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    brand: getBrandName(vendor.brandId),
    brandSlug: vendor.brandSlug,
    createdAt: new Date(vendor.createdAt).toLocaleDateString(),
  }));

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
          tableData={formattedVendors} // Pass formatted vendors to PageHeader
        />
        <div className="card">
          <div className="card-body-2 p-0">
            {paginatedVendors.map((vendor) => (
              <div className="card-list" key={vendor.id}>
                <div className="card-content">
                  <span>
                    {vendor.vendorName} -{getBrandName(vendor.brandId)}
                  </span>

                  <div className="actions">
                    <BiShowAlt onClick={() => setViewCompanyId(vendor.id)} />

                    <BiEdit onClick={() => handleEditVendor(vendor)} />

                    <BiTrash onClick={() => handleDeleteVendor(vendor)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <DataTablePagination
              totalItems={vendors.length}
              itemNo={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
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
  );
};

export default CompaniesWrapper;
