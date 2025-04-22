import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllBrandsQuery,
  useDeleteBrandMutation, // Add delete mutation
} from "../../api/brandsApi";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
import AddBrand from "./AddBrandModal";
import DeleteModal from "../Common/DeleteModal"; // Import DeleteModal
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Brands = () => {
  const { data, error, isLoading, refetch } = useGetAllBrandsQuery();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation(); // Add mutation hook
  const brands = Array.isArray(data) ? data : [];

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandToDelete, setBrandToDelete] = useState(null); // Track brand to delete
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Control delete modal visibility

  const handleAddBrand = () => {
    console.log("Adding new brand");
    setEditMode(false);
    setSelectedBrand(null);
    setShowModal(true);
  };

  const handleEditBrand = (brand) => {
    console.log("Editing brand:", brand);
    setEditMode(true);
    setSelectedBrand(brand);
    setShowModal(true);
  };

  const handleDeleteBrand = (brand) => {
    console.log("Opening delete modal for brand:", brand);
    setBrandToDelete(brand);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!brandToDelete?.id) {
      toast.error("No brand selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      console.log("Deleting brand with ID:", brandToDelete.id);
      await deleteBrand(brandToDelete.id).unwrap();
      toast.success("Brand deleted successfully!");
      setShowDeleteModal(false);
      setBrandToDelete(null);
      refetch(); // Refresh brand list
    } catch (err) {
      toast.error(
        `Failed to delete brand: ${err.data?.message || "Unknown error"}`
      );
      console.error("Error deleting brand:", err);
    }
  };

  const handleCloseModal = () => {
    console.log("Closing AddBrand modal");
    setShowModal(false);
    setEditMode(false);
    setSelectedBrand(null);
    refetch(); // Refresh brand list
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching brands: {JSON.stringify(error)}</p>;
  if (brands.length === 0) return <p>No brands available.</p>;

  return (
    <div className="page-wrapper">
      <ToastContainer /> {/* Required for toasts */}
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
                        <input type="checkbox" id="select-all" />
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
                  {brands.map((brand) => (
                    <tr key={brand.id}>
                      <td>
                        <label className="checkboxs">
                          <input type="checkbox" />
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
            console.log("Canceling delete modal");
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
