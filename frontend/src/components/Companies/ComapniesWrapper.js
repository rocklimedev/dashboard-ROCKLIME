import React, { useState, useCallback, useMemo } from "react";
import {
  useGetVendorsQuery,
  useDeleteVendorMutation,
} from "../../api/vendorApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import AddCompanyModal from "./AddCompanyModal";
import DeleteModal from "../Common/DeleteModal";
import ViewCompanies from "./ViewCompanies";
import { BiEdit, BiTrash, BiShowAlt } from "react-icons/bi";
import { FaSearch } from "react-icons/fa";
import { toast } from "sonner";
import DataTablePagination from "../Common/DataTablePagination";
import PageHeader from "../Common/PageHeader";
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

  // State management
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewCompanyId, setViewCompanyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
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

  // Memoized grouped vendors for tab-based filtering
  const groupedVendors = useMemo(
    () => ({
      All: vendors,
      Active: vendors.filter((v) => v.isActive !== false), // Assuming isActive boolean
      Inactive: vendors.filter((v) => v.isActive === false),
    }),
    [vendors]
  );

  // Filtered and sorted vendors
  const filteredVendors = useMemo(() => {
    let result = groupedVendors[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((v) =>
        [v.vendorName, v.vendorId, getBrandName(v.brandId)]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          a.vendorName.localeCompare(b.vendorName)
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          b.vendorName.localeCompare(a.vendorName)
        );
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        break;
    }

    return result;
  }, [groupedVendors, activeTab, searchTerm, sortBy, getBrandName]);

  // Paginated vendors
  const paginatedVendors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVendors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVendors, currentPage]);

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

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
    toast.success("Filters cleared!");
  }, []);

  // Loading and error states
  if (vendorsLoading || brandsLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading vendors...</p>
          </div>
        </div>
      </div>
    );
  }

  if (vendorsError || brandsError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error loading vendors:{" "}
              {JSON.stringify(vendorsError || brandsError)}
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
            title="Vendors"
            subtitle="Manage your Vendors   "
            onAdd={handleAddVendor}
            tableData={paginatedVendors}
          />
          <div className="card-body">
            <div className="row">
              <div className="col-lg-12">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <div className="input-icon-start position-relative">
                    <span className="input-icon-addon">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Vendors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search vendors"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="tab-content" id="pills-tabContent">
              {Object.entries(groupedVendors).map(([status, list]) => (
                <div
                  className={`tab-pane fade ${
                    activeTab === status ? "show active" : ""
                  }`}
                  id={`pills-${status}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${status}`}
                  key={status}
                >
                  {paginatedVendors.length === 0 ? (
                    <p className="text-muted">
                      No {status.toLowerCase()} vendors match the applied
                      filters
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Vendor Name</th>
                            <th>Vendor ID</th>
                            <th>Brand</th>
                            <th>Date</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedVendors.map((vendor) => (
                            <tr key={vendor.id}>
                              <td data-label="Vendor Name">
                                {vendor.vendorName || "N/A"}
                              </td>
                              <td data-label="Vendor ID">
                                {vendor.vendorId || "N/A"}
                              </td>
                              <td data-label="Brand">
                                {getBrandName(vendor.brandId)}
                              </td>
                              <td data-label="Date">
                                {vendor.createdAt
                                  ? new Date(
                                      vendor.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td data-label="Actions">
                                <div className="gap-2">
                                  <BiShowAlt
                                    aria-label={`View ${vendor.vendorName}`}
                                    onClick={() => setViewCompanyId(vendor.id)}
                                    className="align-middle fs-18"
                                  />
                                  <BiEdit
                                    aria-label={`Edit ${vendor.vendorName}`}
                                    onClick={() => handleEditVendor(vendor)}
                                    className="align-middle fs-18"
                                  />
                                  <BiTrash
                                    aria-label={`Delete ${vendor.vendorName}`}
                                    onClick={() => handleDeleteVendor(vendor)}
                                    className="align-middle fs-18"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredVendors.length > itemsPerPage && (
                        <div className="pagination-section mt-4">
                          <DataTablePagination
                            currentPage={currentPage}
                            totalItems={filteredVendors.length}
                            itemsPerPage={itemsPerPage}
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

export default CompaniesWrapper;
