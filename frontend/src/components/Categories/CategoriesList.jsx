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
import { toast } from "sonner";

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
      toast.error("Invalid category or category ID");
      return;
    }

    try {
      await deleteCategory(category.categoryId).unwrap();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      if (paginatedCategories.length === 1 && categoryPage > 1) {
        setCategoryPage(categoryPage - 1);
      }
      toast.success("Category deleted successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
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

            <div className="row">
              {/* Add Category Card */}
              <div className="col-md-4 col-lg-3 mb-3">
                <div
                  className="card h-100 d-flex align-items-center justify-content-center"
                  style={{ cursor: "pointer" }}
                  onClick={handleAddCategory}
                >
                  <div className="card-body text-center">
                    <h5 className="card-title">Add New Category</h5>
                    <p className="card-text">
                      Click here to create a new category
                    </p>
                    <button className="btn btn-primary">Add Category</button>
                  </div>
                </div>
              </div>

              {/* Category Cards */}
              {paginatedCategories.map((category) => {
                const parentName =
                  parentCategories.find(
                    (p) => p.id === category.parentCategoryId
                  )?.name || "N/A";

                return (
                  <div
                    key={category.categoryId}
                    className="col-md-4 col-lg-3 mb-3"
                  >
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">{category.name}</h5>
                        <p className="card-text">
                          <strong style={{ color: "#25D366" }}>
                            {parentName}
                          </strong>
                        </p>
                        <div className="d-flex justify-content-end">
                          <a
                            className="me-2"
                            title="Edit"
                            onClick={() => {
                              setEditingCategory(category);
                              setShowCategoryModal(true);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <AiOutlineEdit size={20} />
                          </a>
                          <a
                            title="Delete"
                            onClick={() => {
                              setCategoryToDelete(category);
                              setShowDeleteModal(true);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <FcFullTrash size={20} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {paginatedCategories.length === 0 && (
                <div className="col-12">
                  <p className="text-center">No categories found.</p>
                </div>
              )}
            </div>

            <DataTablePagination
              totalItems={filteredCategories.length}
              itemNo={itemsPerPage}
              onPageChange={setCategoryPage}
            />
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
