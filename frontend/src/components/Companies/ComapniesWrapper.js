import React, { useState } from "react";
import { useGetVendorsQuery } from "../../api/vendorApi";
import PageHeader from "../Common/PageHeader";
import AddCompanyModal from "./AddCompanyModal";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { BiEdit, BiTrash } from "react-icons/bi";
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

  const vendors = Array.isArray(vendorsData) ? vendorsData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  if (vendorsLoading || brandsLoading) return <p>Loading...</p>;
  if (vendorsError || brandsError) return <p>Error fetching data.</p>;
  if (vendors.length === 0) return <p>No vendors available.</p>;

  // Function to get brandName from brandId
  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "Unknown";
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td>{vendor.vendorId}</td>
                      <td>{vendor.vendorName}</td>
                      <td>{getBrandName(vendor.brandId)}</td>{" "}
                      {/* Fetch brand name */}
                      <td>{vendor.brandSlug}</td>
                      <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                      <td class="action-table-data">
                        <div class="edit-delete-action">
                          <a
                            class="me-2 p-2"
                            onClick={() => handleEditVendor(vendor)}
                          >
                            <BiEdit />
                          </a>
                          <a
                            data-bs-toggle="modal"
                            data-bs-target="#delete-modal"
                            class="p-2"
                            href="javascript:void(0);"
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
