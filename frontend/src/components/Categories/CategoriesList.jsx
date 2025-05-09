import React, { useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllKeywordsQuery } from "../../api/keywordApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import { useDeleteCategoryMutation } from "../../api/categoryApi";
import PageHeader from "../Common/PageHeader";
import AddCategoryModal from "./AddCategoryModal";
import DeleteModal from "../Common/DeleteModal";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");

  const [deleteCategory] = useDeleteCategoryMutation();

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

  // Define itemsPerPage before paginatedCategories
  const itemsPerPage = 20;

  const formattedCategories = filteredCategories.map((category) => ({
    categoryId: category.categoryId,
    name: category.name,
    parentCategory:
      parentCategories.find((p) => p.id === category.parentCategoryId)?.name ||
      "N/A",
    createdAt: new Date(category.createdAt).toLocaleDateString(),
  }));

  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * itemsPerPage,
    categoryPage * itemsPerPage
  );

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleDelete = async (category) => {
    if (!category || !category.categoryId) {
      console.error("Invalid category or category ID:", category);
      return;
    }

    try {
      await deleteCategory(category.categoryId).unwrap();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      if (paginatedCategories.length === 1 && categoryPage > 1) {
        setCategoryPage(categoryPage - 1);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleCloseKeywordModal = () => setShowKeywordModal(false);

  if (categoryLoading || keywordLoading || parentCategoryLoading)
    return <p>Loading data...</p>;
  if (categoryError || parentCategoryError || keywordError)
    return <p>Error fetching data.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          id="categories-keywords-tabs"
          className="mb-3"
        >
          <Tab eventKey="categories" title="Categories">
            <PageHeader
              title="Categories"
              subtitle="Manage your categories"
              onAdd={handleAddCategory}
              tableData={formattedCategories}
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
                          <tr key={category.categoryId}>
                            <td>{category.name}</td>
                            <td>{parentName}</td>
                            <td>
                              {new Date(
                                category.createdAt
                              ).toLocaleDateString()}
                            </td>
                            <td className="action-table-data">
                              <div className="edit-delete-action">
                                <a
                                  className="me-2 p-2"
                                  title="Edit"
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setShowCategoryModal(true);
                                  }}
                                >
                                  <AiOutlineEdit />
                                </a>
                                <a
                                  className="me-2 p-2"
                                  title="Delete"
                                  onClick={() => {
                                    if (!category.categoryId) {
                                      console.error(
                                        "Category ID is undefined:",
                                        category
                                      );
                                      return;
                                    }
                                    setCategoryToDelete(category);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <FcFullTrash />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedCategories.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No categories found.
                          </td>
                        </tr>
                      )}
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
          </Tab>

          <Tab eventKey="keywords" title="Keywords">
            <Keyword
              onClose={handleCloseKeywordModal}
              showModal={showKeywordModal}
            />
          </Tab>
        </Tabs>

        {showDeleteModal && (
          <DeleteModal
            isVisible={showDeleteModal}
            item={categoryToDelete}
            itemType="Category"
            onConfirm={() => handleDelete(categoryToDelete)}
            onCancel={() => {
              setShowDeleteModal(false);
              setCategoryToDelete(null);
            }}
          />
        )}

        {showCategoryModal && (
          <AddCategoryModal
            editMode={!!editingCategory}
            categoryData={editingCategory}
            onClose={handleCloseCategoryModal}
          />
        )}
      </div>
    </div>
  );
};

export default CategoriesList;
