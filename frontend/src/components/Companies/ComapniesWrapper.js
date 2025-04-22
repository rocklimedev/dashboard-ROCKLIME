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

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewCompanyId, setViewCompanyId] = useState(null);

  const vendors = Array.isArray(vendorsData) ? vendorsData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "Unknown";
  };

  const handleEditVendor = (vendor) => {
    console.log("Editing vendor:", vendor);
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const handleAddVendor = () => {
    console.log("Adding new vendor");
    setSelectedVendor(null);
    setShowModal(true);
  };

  const handleDeleteVendor = (vendor) => {
    console.log("Opening delete modal for vendor:", vendor);
    setVendorToDelete(vendor);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!vendorToDelete?.id) {
      toast.error("No vendor selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      console.log("Deleting vendor with ID:", vendorToDelete.id);
      await deleteVendor(vendorToDelete.id).unwrap();
      toast.success("Vendor deleted successfully!");
      setShowDeleteModal(false);
      setVendorToDelete(null);
    } catch (err) {
      toast.error(
        `Failed to delete vendor: ${err.data?.message || "Unknown error"}`
      );
      console.error("Error deleting vendor:", err);
    }
  };

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
                  {vendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td>{vendor.vendorId}</td>
                      <td>{vendor.vendorName}</td>
                      <td>{getBrandName(vendor.brandId)}</td>
                      <td>{vendor.brandSlug}</td>
                      <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-2">
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
              console.log("Canceling delete modal");
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
              console.log("Closing AddCompanyModal");
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
