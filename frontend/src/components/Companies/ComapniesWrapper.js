import React, { useState } from "react";
import {
  useGetVendorsQuery,
  useDeleteVendorMutation,
} from "../../api/vendorApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import PageHeader from "../Common/PageHeader";
import AddCompanyModal from "./AddCompanyModal";
import DeleteModal from "../Common/DeleteModal";
import { BiEdit, BiTrash } from "react-icons/bi";
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

  const [deleteVendor] = useDeleteVendorMutation();

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const vendors = Array.isArray(vendorsData) ? vendorsData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  if (vendorsLoading || brandsLoading) return <p>Loading...</p>;
  if (vendorsError || brandsError) return <p>Error fetching data.</p>;
  if (vendors.length === 0) return <p>No vendors available.</p>;

  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "Unknown";
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!vendorToDelete?.id) return;
    try {
      await deleteVendor(vendorToDelete.id).unwrap();
      toast.success("Vendor deleted successfully!");
      setShowDeleteModal(false);
      setVendorToDelete(null);
    } catch (err) {
      toast.error("Failed to delete vendor.");
      console.error("Error deleting vendor:", err);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader title="Vendors" subtitle="Manage your Vendors" />

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
                      <td className="action-table-data">
                        <div className="edit-delete-action d-flex">
                          <button
                            className="me-2 p-2 btn btn-link"
                            onClick={() => handleEditVendor(vendor)}
                          >
                            <BiEdit />
                          </button>
                          <button
                            className="p-2 btn btn-link text-danger"
                            onClick={() => {
                              setVendorToDelete(vendor);
                              setShowDeleteModal(true);
                            }}
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
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          item={vendorToDelete}
          itemType="Vendor"
          show={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <AddCompanyModal
          show={showModal}
          onClose={() => setShowModal(false)}
          existingVendor={selectedVendor}
        />
      )}
    </div>
  );
};

export default CompaniesWrapper;
