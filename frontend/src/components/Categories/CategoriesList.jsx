import React, { useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllKeywordsQuery } from "../../api/keywordApi";
import {
  useGetAllParentCategoriesQuery,
  useDeleteParentCategoryMutation,
} from "../../api/parentCategoryApi";
import { useDeleteCategoryMutation } from "../../api/categoryApi";
import PageHeader from "../Common/PageHeader";
import AddCategoryModal from "./AddCategoryModal";
import AddParentCategoryModal from "./AddParentCategoryModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import Keyword from "./Keyword";
import { AiOutlineEdit } from "react-icons/ai";
import { BiTrash } from "react-icons/bi";
import { toast } from "sonner";

const CategoriesList = () => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showParentCategoryModal, setShowParentCategoryModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [parentCategoryPage, setParentCategoryPage] = useState(1);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [parentCategorySearchTerm, setParentCategorySearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingParentCategory, setEditingParentCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");

  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteParentCategory] = useDeleteParentCategoryMutation();

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

  const filteredParentCategories = parentCategories.filter((pc) =>
    pc.name.toLowerCase().includes(parentCategorySearchTerm.toLowerCase())
  );

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

  const paginatedParentCategories = filteredParentCategories.slice(
    (parentCategoryPage - 1) * itemsPerPage,
    parentCategoryPage * itemsPerPage
  );

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleAddParentCategory = () => {
    setEditingParentCategory(null);
    setShowParentCategoryModal(true);
  };

  const handleDelete = async (item, itemType) => {
    if (!item || !item.id) {
      toast.error(`Invalid ${itemType.toLowerCase()} or ID`);
      return;
    }

    try {
      if (itemType === "Category") {
        await deleteCategory(item.categoryId).unwrap();
        if (paginatedCategories.length === 1 && categoryPage > 1) {
          setCategoryPage(categoryPage - 1);
        }
      } else if (itemType === "ParentCategory") {
        await deleteParentCategory(item.id).unwrap();
        if (paginatedParentCategories.length === 1 && parentCategoryPage > 1) {
          setParentCategoryPage(parentCategoryPage - 1);
        }
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteItemType(null);
      toast.success(`${itemType} deleted successfully!`);
    } catch (err) {
      toast.error(
        err?.data?.message || `Delete ${itemType.toLowerCase()} failed`
      );
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleCloseParentCategoryModal = () => {
    setShowParentCategoryModal(false);
    setEditingParentCategory(null);
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
          <Tab eventKey="parentCategories" title="Parent Categories">
            <PageHeader
              title="Parent Categories"
              subtitle="Manage your parent categories"
              onAdd={handleAddParentCategory}
              tableData={filteredParentCategories.map((pc) => ({
                id: pc.id,
                name: pc.name,
                createdAt: new Date(pc.createdAt).toLocaleDateString(),
              }))}
            />

            <div className="row mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Parent Category..."
                  value={parentCategorySearchTerm}
                  onChange={(e) => setParentCategorySearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="row g-3">
              {/* Add Parent Category Card */}
              <div className="col-md-4 col-lg-3">
                <div
                  className="card h-100 add-card"
                  style={{ cursor: "pointer" }}
                  onClick={handleAddParentCategory}
                >
                  <div className="card-body text-center d-flex flex-column justify-content-center">
                    <h5 className="card-title">Add New Parent Category</h5>
                    <p className="card-text">
                      Click here to create a new parent category
                    </p>
                    <button className="btn btn-primary mt-2">
                      Add Parent Category
                    </button>
                  </div>
                </div>
              </div>

              {/* Parent Category Cards */}
              {paginatedParentCategories.map((parentCategory) => (
                <div key={parentCategory.id} className="col-md-4 col-lg-3">
                  <div className="card h-100">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-truncate">
                        {parentCategory.name}
                      </h5>
                      <p className="card-text">
                        Created:{" "}
                        {new Date(
                          parentCategory.createdAt
                        ).toLocaleDateString()}
                      </p>
                      <div className=" d-flex justify-content-end">
                        <a
                          className="me-2"
                          title="Edit"
                          onClick={() => {
                            setEditingParentCategory(parentCategory);
                            setShowParentCategoryModal(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <AiOutlineEdit size={20} />
                        </a>
                        <a
                          title="Delete"
                          onClick={() => {
                            setItemToDelete(parentCategory);
                            setDeleteItemType("ParentCategory");
                            setShowDeleteModal(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <BiTrash size={20} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {paginatedParentCategories.length === 0 && (
                <div className="col-12">
                  <p className="text-center">No parent categories found.</p>
                </div>
              )}
            </div>

            <DataTablePagination
              totalItems={filteredParentCategories.length}
              itemNo={itemsPerPage}
              onPageChange={setParentCategoryPage}
            />
          </Tab>

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

            <div className="row g-3">
              {/* Add Category Card */}
              <div className="col-md-4 col-lg-3">
                <div
                  className="card h-100 add-card"
                  style={{ cursor: "pointer" }}
                  onClick={handleAddCategory}
                >
                  <div className="card-body text-center d-flex flex-column justify-content-center">
                    <h5 className="card-title">Add New Category</h5>
                    <p className="card-text">
                      Click here to create a new category
                    </p>
                    <button className="btn btn-primary mt-2">
                      Add Category
                    </button>
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
                  <div key={category.categoryId} className="col-md-4 col-lg-3">
                    <div className="card h-100">
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title text-truncate">
                          {category.name}
                        </h5>
                        <p className="card-text">
                          <strong style={{ color: "#25D366" }}>
                            {parentName}
                          </strong>
                        </p>
                        <div className=" d-flex justify-content-end">
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
                              setItemToDelete(category);
                              setDeleteItemType("Category");
                              setShowDeleteModal(true);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <BiTrash size={20} />
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
            item={itemToDelete}
            itemType={deleteItemType}
            onConfirm={() => handleDelete(itemToDelete, deleteItemType)}
            onCancel={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
              setDeleteItemType(null);
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

        {showParentCategoryModal && (
          <AddParentCategoryModal
            editMode={!!editingParentCategory}
            parentCategoryData={editingParentCategory}
            onClose={handleCloseParentCategoryModal}
          />
        )}
      </div>
    </div>
  );
};

export default CategoriesList;
