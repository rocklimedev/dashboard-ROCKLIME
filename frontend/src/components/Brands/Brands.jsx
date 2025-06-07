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
import { toast } from "sonner";
import DataTablePagination from "../Common/DataTablePagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const itemsPerPage = 20;

  // Format brands for tableData prop
  const formattedBrands = brands.map((brand) => ({
    id: brand.id,
    brandName: brand.brandName,
    brandSlug: brand.brandSlug,
    createdAt: new Date(brand.createdAt).toLocaleDateString(),
    status: "Active", // Hardcoded to match table display; adjust if dynamic
  }));

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
      if (paginatedBrands.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setBrandToDelete(null);
      setSelectedBrands([]);
      refetch();
    } catch (err) {
      toast.error(
        `Failed to delete brand: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedBrand(null);
    refetch();
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedBrands([]);
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
      <div className="content">
        <PageHeader
          title="Brands"
          subtitle="Manage your brands"
          onAdd={handleAddBrand}
          tableData={formattedBrands} // Pass formatted brands to PageHeader
        />
        <div className="card">
          <div className="card-body-2 p-0">
            {paginatedBrands.map((brand) => (
              <div className="card-list" key={brand.id}>
                <div className="card-content">
                  <span>{brand.brandName}</span>
                  <div className="actions">
                    <AiOutlineEdit onClick={() => handleEditBrand(brand)} />
                    <FcEmptyTrash onClick={() => handleDeleteBrand(brand)} />
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
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default Brands;
