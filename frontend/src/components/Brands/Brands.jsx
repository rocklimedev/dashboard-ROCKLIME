import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
import AddBrand from "./AddBrandModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Brands = () => {
  const { data, error, isLoading, refetch } = useGetAllBrandsQuery();
  const brands = Array.isArray(data) ? data : [];

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

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

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedBrand(null);
    refetch(); // Refresh brand list
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching brands.</p>;
  if (brands.length === 0) return <p>No brands available.</p>;
  return (
    <div class="page-wrapper">
      <div class="content">
        <PageHeader
          title="Brands"
          subtitle="Manage your brands"
          onAdd={handleAddBrand}
        />

        <div class="card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table datatable">
                <thead class="thead-light">
                  <tr>
                    <th class="no-sort">
                      <label class="checkboxs">
                        <input type="checkbox" id="select-all" />
                        <span class="checkmarks"></span>
                      </label>
                    </th>
                    <th>Brand</th>
                    <th>Brand Slug</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th class="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id}>
                      <td>
                        <label class="checkboxs">
                          <input type="checkbox" />
                          <span class="checkmarks"></span>
                        </label>
                      </td>
                      <td>
                        <div class="d-flex align-items-center">
                          <a href="javascript:void(0);">{brand.brandName}</a>
                        </div>
                      </td>
                      <td>{brand.brandSlug}</td>
                      <td> {new Date(brand.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span class="badge table-badge bg-success fw-medium fs-10">
                          Active
                        </span>
                      </td>
                      <td class="action-table-data">
                        <div class="edit-delete-action">
                          <a
                            className="me-2 p-2"
                            onClick={() => handleEditBrand(brand)}
                          >
                            <AiOutlineEdit />
                          </a>

                          <a class="p-2" href="javascript:void(0);">
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
    </div>
  );
};

export default Brands;
