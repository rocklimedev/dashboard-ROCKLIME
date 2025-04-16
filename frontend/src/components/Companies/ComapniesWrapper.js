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

  const [deleteVendor] = useDeleteVendorMutation();

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewCompanyId, setViewCompanyId] = useState(null);

  const vendors = Array.isArray(vendorsData) ? vendorsData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  if (vendorsLoading || brandsLoading) return <p>Loading...</p>;
  if (vendorsError || brandsError)
    return (
      <p>Error fetching data: {JSON.stringify(vendorsError || brandsError)}</p>
    );
  if (vendors.length === 0) return <p>No vendors available.</p>;

  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "Unknown";
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const handleAddVendor = () => {
    setSelectedVendor(null);
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
                    <tr key={vendor.id} onClick={(e) => e.stopPropagation()}>
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
                          >
                            <BiEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
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

        {viewCompanyId && (
          <ViewCompanies
            companyId={viewCompanyId}
            onClose={() => setViewCompanyId(null)}
          />
        )}

        <DeleteModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor?"
        />

        <AddCompanyModal
          show={showModal}
          onClose={() => setShowModal(false)} // Close modal when called
          existingVendor={selectedVendor} // Pass selectedVendor for editing
        />
      </div>
    </div>
  );
};

export default CompaniesWrapper;
