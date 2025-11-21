import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllBrandsQuery,
  useDeleteBrandMutation,
} from "../../api/brandsApi";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import AddBrand from "./AddBrandModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { message } from "antd";
const Brands = () => {
  const { data, error, refetch } = useGetAllBrandsQuery();
  const [deleteBrand] = useDeleteBrandMutation();
  const brands = Array.isArray(data) ? data : [];

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const formattedBrands = brands.map((brand) => ({
    id: brand.id,
    brandName: brand.brandName,
    brandSlug: brand.brandSlug,
    createdAt: new Date(brand.createdAt).toLocaleDateString(),
    status: "Active",
  }));

  const handleAddBrand = () => {
    setEditMode(false);
    setSelectedBrand(null);
    setShowModal(true);
  };

  const handleEditBrand = (brand) => {
    setEditMode(true);
    setSelectedBrand(brand);
    setShowModal(true);
  };

  const handleDeleteBrand = (brand) => {
    setBrandToDelete(brand);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!brandToDelete?.id) {
      message.error("No brand selected for deletion");
      setShowDeleteModal(false);
      return;
    }

    try {
      await deleteBrand(brandToDelete.id).unwrap();

      if (paginatedBrands.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setBrandToDelete(null);
      refetch();
    } catch (err) {
      message.error(
        `Failed to delete brand: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedBrand(null);
    refetch();
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const paginatedBrands = brands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">
            Error fetching brands: {JSON.stringify(error)}
          </p>
        </div>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>No brands available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Brands"
          subtitle="Manage your brands"
          onAdd={handleAddBrand}
          tableData={formattedBrands}
        />
        <div className="card">
          <div className="card-body-2">
            {paginatedBrands.map((brand) => (
              <div className="card-list" key={brand.id}>
                <div className="card-content">
                  <span>{brand.brandName}</span>
                  <div className="actions">
                    <AiOutlineEdit
                      className="action-icon edit-icon"
                      onClick={() => handleEditBrand(brand)}
                      aria-label={`Edit ${brand.brandName}`}
                    />
                    <AiOutlineDelete
                      className="action-icon delete-icon"
                      onClick={() => handleDeleteBrand(brand)}
                      aria-label={`Delete ${brand.brandName}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
        />
      )}
    </div>
  );
};

export default Brands;
