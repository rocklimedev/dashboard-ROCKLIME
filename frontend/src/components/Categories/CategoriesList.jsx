import React, { useState } from "react";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllKeywordsQuery } from "../../api/keywordApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import PageHeader from "../Common/PageHeader";
import AddCategoryModal from "./AddCategoryModal";

import DataTablePagination from "../Common/DataTablePagination";
import Keyword from "./Keyword";
import { AiOutlineEdit } from "react-icons/ai";
import { FcFullTrash } from "react-icons/fc";

const CategoriesList = () => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);

  const itemsPerPage = 20;

  const {
    data: categoryData,
    isLoading: categoryLoading,
    error: categoryError,
  } = useGetAllCategoriesQuery();
  const {
    data: keywordData,
    isLoading: keywordLoading,
    error: keywordError,
  } = useGetAllKeywordsQuery();
  const {
    data: parentCategoryData,
    isLoading: parentCategoryLoading,
    error: parentCategoryError,
  } = useGetAllParentCategoriesQuery();

  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];

  const parentCategories = Array.isArray(parentCategoryData?.data)
    ? parentCategoryData.data
    : [];

  const filteredCategories = categories.filter((c) => {
    const categoryNameMatch = c.name
      .toLowerCase()
      .includes(categorySearchTerm.toLowerCase());
    const parentName =
      parentCategories.find((p) => p.id === c.parentCategoryId)?.name || "";
    const parentNameMatch = parentName
      .toLowerCase()
      .includes(parentSearchTerm.toLowerCase());

    const matchesParentId = selectedParentId
      ? c.parentCategoryId === selectedParentId
      : true;

    return categoryNameMatch && parentNameMatch && matchesParentId;
  });

  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * itemsPerPage,
    categoryPage * itemsPerPage
  );

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleCloseCategoryModal = () => setShowCategoryModal(false);

  const handleCloseKeywordModal = () => setShowKeywordModal(false);

  if (categoryLoading || keywordLoading || parentCategoryLoading)
    return <p>Loading data...</p>;
  if (categoryError || parentCategoryError || keywordError)
    return <p>Error fetching data.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Categories"
          subtitle="Manage your categories"
          onAdd={handleAddCategory}
        />

        <div className="mb-4">
          <label className="form-label">Filter by Parent Category:</label>
          <select
            className="form-select"
            value={selectedParentId || ""}
            onChange={(e) => setSelectedParentId(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {parentCategories.map((pc) => (
              <option key={pc.id} value={pc.id}>
                {pc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Inputs */}
        <div className="row mb-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search Category..."
              value={categorySearchTerm}
              onChange={(e) => setCategorySearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search Parent Category..."
              value={parentSearchTerm}
              onChange={(e) => setParentSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Category</th>
                    <th>Parent Category</th>
                    <th>Created On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((category) => {
                    const parentName =
                      parentCategories.find(
                        (p) => p.id === category.parentCategoryId
                      )?.name || "N/A";

                    return (
                      <tr key={category._id}>
                        <td>{category.name}</td>
                        <td>{parentName}</td>
                        <td>
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="action-table-data">
                          <div className="edit-delete-action">
                            <a
                              className="me-2 p-2"
                              title="Edit"
                              onClick={() => {
                                setEditingCategory(category); // Set category data
                                setShowCategoryModal(true); // Open modal
                              }}
                            >
                              <AiOutlineEdit />
                            </a>

                            <a className="me-2 p-2" title="delete">
                              <FcFullTrash />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <DataTablePagination
                totalItems={filteredCategories.length}
                itemNo={itemsPerPage}
                onPageChange={setCategoryPage}
              />
            </div>
          </div>
        </div>

        {showCategoryModal && (
          <AddCategoryModal
            editMode={!!editingCategory} // If editingCategory has value, it's edit mode
            categoryData={editingCategory} // Pass category data to edit
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null); // Clear after close
            }}
          />
        )}

        <Keyword />
      </div>
    </div>
  );
};

export default CategoriesList;
