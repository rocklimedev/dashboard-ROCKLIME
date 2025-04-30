import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllBrandsQuery,
  useDeleteBrandMutation,
} from "../../api/brandsApi";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
import AddBrand from "./AddBrandModal";
import DeleteModal from "../Common/DeleteModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataTablePagination from "../Common/DataTablePagination"; // Import pagination component

const Brands = () => {
  const { data, error, isLoading, refetch } = useGetAllBrandsQuery();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();
  const brands = Array.isArray(data) ? data : [];

  // State for modals, selected brand, deletion, pagination, and checkboxes
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [selectedBrands, setSelectedBrands] = useState([]); // Checkbox state
  const itemsPerPage = 20; // Matches itemNo default in DataTablePagination

  // Handle add brand
  const handleAddBrand = () => {
    setEditMode(false);
    setSelectedBrand(null);
    setShowModal(true);
  };

  // Handle edit brand
  const handleEditBrand = (brand) => {
    setEditMode(true);
    setSelectedBrand(brand);
    setShowModal(true);
  };

  // Handle delete brand
  const handleDeleteBrand = (brand) => {
    setBrandToDelete(brand);
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!brandToDelete?.id) {
      toast.error("No brand selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteBrand(brandToDelete.id).unwrap();
      toast.success("Brand deleted successfully!");
      // Reset to previous page if current page becomes empty
      if (paginatedBrands.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setBrandToDelete(null);
      setSelectedBrands([]); // Clear selections
      refetch(); // Refresh brand list
    } catch (err) {
      toast.error(
        `Failed to delete brand: ${err.data?.message || "Unknown error"}`
      );
      console.error("Error deleting brand:", err);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedBrand(null);
    refetch(); // Refresh brand list
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedBrands([]); // Clear selections on page change
  };

  // Checkbox handlers
  const handleSelectAll = () => {
    const currentPageBrandIds = paginatedBrands.map((brand) => brand.id);
    setSelectedBrands(
      selectedBrands.length === currentPageBrandIds.length
        ? []
        : currentPageBrandIds
    );
  };

  const toggleBrand = (id) => {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Paginated brands
  const paginatedBrands = (() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return brands.slice(startIndex, endIndex);
  })();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching brands: {JSON.stringify(error)}</p>;
  if (brands.length === 0) return <p>No brands available.</p>;

  return (
    <div className="page-wrapper">
      <ToastContainer />
      <div className="content">
        <PageHeader
          title="Brands"
          subtitle="Manage your brands"
          onAdd={handleAddBrand}
        />

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <label className="checkboxs">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={
                            selectedBrands.length === paginatedBrands.length &&
                            paginatedBrands.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                        <span className="checkmarks"></span>
                      </label>
                    </th>
                    <th>Brand</th>
                    <th>Brand Slug</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th className="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBrands.map((brand) => (
                    <tr key={brand.id}>
                      <td>
                        <label className="checkboxs">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand.id)}
                            onChange={() => toggleBrand(brand.id)}
                          />
                          <span className="checkmarks"></span>
                        </label>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <a href="javascript:void(0);">{brand.brandName}</a>
                        </div>
                      </td>
                      <td>{brand.brandSlug}</td>
                      <td>{new Date(brand.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="badge table-badge bg-success fw-medium fs-10">
                          Active
                        </span>
                      </td>
                      <td className="action-table-data">
                        <div className="edit-delete-action">
                          <a
                            className="me-2 p-2"
                            onClick={() => handleEditBrand(brand)}
                            aria-label="Edit brand"
                          >
                            <AiOutlineEdit />
                          </a>
                          <a
                            className="p-2"
                            onClick={() => handleDeleteBrand(brand)}
                            aria-label="Delete brand"
                          >
                            <FcEmptyTrash />
                          </a>
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
              totalItems={brands.length}
              itemNo={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
      {showModal && (
        <AddBrand onClose={handleCloseModal} existingBrand={selectedBrand} />
      )}
      {showDeleteModal && (
        <DeleteModal
          item={brandToDelete}
          itemType="Brand"
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setBrandToDelete(null);
          }}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default Brands;
