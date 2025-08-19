import React, { useState, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import {
  useGetAllCategoriesQuery,
  useDeleteCategoryMutation,
} from "../../api/categoryApi";
import {
  useGetAllKeywordsQuery,
  useDeleteKeywordMutation,
} from "../../api/keywordApi";
import {
  useGetAllParentCategoriesQuery,
  useDeleteParentCategoryMutation,
} from "../../api/parentCategoryApi";
import PageHeader from "../Common/PageHeader";
import AddCategoryModal from "./AddCategoryModal";
import AddParentCategoryModal from "./AddParentCategoryModal";
import AddKeywordModal from "./AddKeywordModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { AiOutlineEdit } from "react-icons/ai";
import { BiTrash } from "react-icons/bi";
import { toast } from "sonner";

const CategoryManagement = () => {
  // State
  const [showParentCategoryModal, setShowParentCategoryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingParentCategory, setEditingParentCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [parentCategoryPage, setParentCategoryPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [keywordPage, setKeywordPage] = useState(1);
  const [parentCategorySearchTerm, setParentCategorySearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [keywordSearchTerm, setKeywordSearchTerm] = useState("");

  const itemsPerPage = 20;

  // API hooks
  const {
    data: parentCategoryData,
    isLoading: parentCategoryLoading,
    error: parentCategoryError,
  } = useGetAllParentCategoriesQuery();
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
  const [deleteParentCategory] = useDeleteParentCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  // Data normalization
  const parentCategories = Array.isArray(parentCategoryData?.data)
    ? parentCategoryData.data
    : [];
  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];
  const keywords = Array.isArray(keywordData?.keywords)
    ? keywordData.keywords
    : [];

  // Memoized filtering
  const filteredParentCategories = useMemo(
    () =>
      parentCategories.filter((pc) =>
        pc.name.toLowerCase().includes(parentCategorySearchTerm.toLowerCase())
      ),
    [parentCategories, parentCategorySearchTerm]
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => {
        const categoryNameMatch = c.name
          .toLowerCase()
          .includes(categorySearchTerm.toLowerCase());
        const parentMatch = selectedParentId
          ? c.parentCategoryId === selectedParentId
          : true;
        return categoryNameMatch && parentMatch;
      }),
    [categories, categorySearchTerm, selectedParentId]
  );

  const filteredKeywords = useMemo(
    () =>
      keywords.filter((k) => {
        const keywordMatch = k.keyword
          .toLowerCase()
          .includes(keywordSearchTerm.toLowerCase());
        const categoryMatch = selectedCategoryId
          ? k.categoryId === selectedCategoryId
          : true;
        return keywordMatch && categoryMatch;
      }),
    [keywords, keywordSearchTerm, selectedCategoryId]
  );

  // Pagination
  const paginatedParentCategories = filteredParentCategories.slice(
    (parentCategoryPage - 1) * itemsPerPage,
    parentCategoryPage * itemsPerPage
  );
  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * itemsPerPage,
    categoryPage * itemsPerPage
  );
  const paginatedKeywords = filteredKeywords.slice(
    (keywordPage - 1) * itemsPerPage,
    keywordPage * itemsPerPage
  );

  // Debounced search handlers
  const debouncedSetParentCategorySearch = useCallback(
    debounce((value) => setParentCategorySearchTerm(value), 300),
    []
  );
  const debouncedSetCategorySearch = useCallback(
    debounce((value) => setCategorySearchTerm(value), 300),
    []
  );
  const debouncedSetKeywordSearch = useCallback(
    debounce((value) => setKeywordSearchTerm(value), 300),
    []
  );

  // Handlers
  const handleAddParentCategory = () => {
    setEditingParentCategory(null);
    setShowParentCategoryModal(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleAddKeyword = () => {
    setEditingKeyword(null);
    setShowKeywordModal(true);
  };

  const handleDelete = async (item, itemType) => {
    if (!item || !item.id) {
      toast.error(`Invalid ${itemType.toLowerCase()} or ID`);
      return;
    }

    try {
      if (itemType === "ParentCategory") {
        await deleteParentCategory(item.id).unwrap();
        if (paginatedParentCategories.length === 1 && parentCategoryPage > 1) {
          setParentCategoryPage((prev) => Math.max(1, prev - 1));
        }
        if (selectedParentId === item.id) {
          setSelectedParentId(null);
          setSelectedCategoryId(null);
        }
      } else if (itemType === "Category") {
        await deleteCategory(item.categoryId).unwrap();
        if (paginatedCategories.length === 1 && categoryPage > 1) {
          setCategoryPage((prev) => Math.max(1, prev - 1));
        }
        if (selectedCategoryId === item.categoryId) {
          setSelectedCategoryId(null);
        }
      } else if (itemType === "Keyword") {
        await deleteKeyword(item.id).unwrap();
        if (paginatedKeywords.length === 1 && keywordPage > 1) {
          setKeywordPage((prev) => Math.max(1, prev - 1));
        }
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteItemType(null);
    } catch (err) {
      toast.error(
        err?.data?.message || `Failed to delete ${itemType.toLowerCase()}`
      );
    }
  };

  const handleBack = () => {
    if (selectedCategoryId) {
      setSelectedCategoryId(null);
      setKeywordPage(1);
      setKeywordSearchTerm("");
    } else if (selectedParentId) {
      setSelectedParentId(null);
      setCategoryPage(1);
      setCategorySearchTerm("");
    }
  };

  const handleCloseParentCategoryModal = () => {
    setShowParentCategoryModal(false);
    setEditingParentCategory(null);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleCloseKeywordModal = () => {
    setShowKeywordModal(false);
    setEditingKeyword(null);
  };

  // Loading and error states
  if (parentCategoryLoading || categoryLoading || keywordLoading)
    return <p>Loading data...</p>;
  if (parentCategoryError || categoryError || keywordError)
    return <p>Error fetching data.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li
              className={`breadcrumb-item ${!selectedParentId ? "active" : ""}`}
              onClick={handleBack}
              style={{ cursor: selectedParentId ? "pointer" : "default" }}
            >
              Parent Categories /
            </li>
            {selectedParentId && (
              <>
                <li className="breadcrumb-item">
                  <span
                    onClick={() => setSelectedCategoryId(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {
                      parentCategories.find((pc) => pc.id === selectedParentId)
                        ?.name
                    }
                  </span>{" "}
                  /
                </li>
                {selectedCategoryId && (
                  <li className="breadcrumb-item active">
                    {
                      categories.find(
                        (c) => c.categoryId === selectedCategoryId
                      )?.name
                    }
                  </li>
                )}
              </>
            )}
          </ol>
        </nav>

        {/* Parent Categories View */}
        {!selectedParentId && (
          <>
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
                  onChange={(e) =>
                    debouncedSetParentCategorySearch(e.target.value)
                  }
                />
              </div>
            </div>
            <div className="row g-3">
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
              {paginatedParentCategories.map((parentCategory) => (
                <div key={parentCategory.id} className="col-md-4 col-lg-3">
                  <div
                    className="card h-100"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      console.log(
                        "Selecting parent category:",
                        parentCategory.id
                      );
                      setSelectedParentId(parentCategory.id);
                      setCategoryPage(1);
                      setCategorySearchTerm("");
                    }}
                  >
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
                      <div className="d-flex justify-content-end mt-auto">
                        <a
                          className="me-2"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingParentCategory(parentCategory);
                            setShowParentCategoryModal(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <AiOutlineEdit size={20} />
                        </a>
                        <a
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
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
          </>
        )}

        {/* Categories View */}
        {selectedParentId && !selectedCategoryId && (
          <>
            <PageHeader
              title="Categories"
              subtitle={`Manage categories under ${
                parentCategories.find((pc) => pc.id === selectedParentId)?.name
              }`}
              onAdd={handleAddCategory}
              tableData={filteredCategories.map((c) => ({
                categoryId: c.categoryId,
                name: c.name,
                createdAt: new Date(c.createdAt).toLocaleDateString(),
              }))}
            />
            <div className="row mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Category..."
                  onChange={(e) => debouncedSetCategorySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="row g-3">
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
              {paginatedCategories.map((category) => (
                <div key={category.categoryId} className="col-md-4 col-lg-3">
                  <div
                    className="card h-100"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      console.log("Selecting category:", category.categoryId);
                      setSelectedCategoryId(category.categoryId);
                      setKeywordPage(1);
                      setKeywordSearchTerm("");
                    }}
                  >
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-truncate">
                        {category.name}
                      </h5>
                      <p className="card-text">
                        Created:{" "}
                        {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                      <div className="d-flex justify-content-end mt-auto">
                        <a
                          className="me-2"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                            setShowCategoryModal(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <AiOutlineEdit size={20} />
                        </a>
                        <a
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
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
              ))}
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
          </>
        )}

        {/* Keywords View */}
        {selectedCategoryId && (
          <>
            <PageHeader
              title="Keywords"
              subtitle={`Manage keywords for ${
                categories.find((c) => c.categoryId === selectedCategoryId)
                  ?.name
              }`}
              onAdd={handleAddKeyword}
              tableData={filteredKeywords.map((k) => ({
                id: k.id,
                keyword: k.keyword,
                createdAt: new Date(k.createdAt).toLocaleDateString(),
              }))}
            />
            <div className="row mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Keyword..."
                  onChange={(e) => debouncedSetKeywordSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-4 col-lg-3">
                <div
                  className="card h-100 add-card"
                  style={{ cursor: "pointer" }}
                  onClick={handleAddKeyword}
                >
                  <div className="card-body text-center d-flex flex-column justify-content-center">
                    <h5 className="card-title">Add New Keyword</h5>
                    <p className="card-text">
                      Click here to create a new keyword
                    </p>
                    <button className="btn btn-primary mt-2">
                      Add Keyword
                    </button>
                  </div>
                </div>
              </div>
              {paginatedKeywords.map((keyword) => (
                <div key={keyword.id} className="col-md-4 col-lg-3">
                  <div className="card h-100">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-truncate">
                        {keyword.keyword}
                      </h5>
                      <p className="card-text">
                        Created:{" "}
                        {new Date(keyword.createdAt).toLocaleDateString()}
                      </p>
                      <div className="d-flex justify-content-end mt-auto">
                        <a
                          className="me-2"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingKeyword(keyword);
                            setShowKeywordModal(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <AiOutlineEdit size={20} />
                        </a>
                        <a
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(keyword);
                            setDeleteItemType("Keyword");
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
              {paginatedKeywords.length === 0 && (
                <div className="col-12">
                  <p className="text-center">No keywords found.</p>
                </div>
              )}
            </div>
            <DataTablePagination
              totalItems={filteredKeywords.length}
              itemNo={itemsPerPage}
              onPageChange={setKeywordPage}
            />
          </>
        )}

        {/* Modals */}
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

        {showParentCategoryModal && (
          <AddParentCategoryModal
            editMode={!!editingParentCategory}
            parentCategoryData={editingParentCategory}
            onClose={handleCloseParentCategoryModal}
          />
        )}

        {showCategoryModal && (
          <AddCategoryModal
            editMode={!!editingCategory}
            categoryData={editingCategory}
            onClose={handleCloseCategoryModal}
            selectedParentId={selectedParentId}
          />
        )}

        {showKeywordModal && (
          <AddKeywordModal
            onClose={handleCloseKeywordModal}
            editData={editingKeyword}
            selectedCategoryId={selectedCategoryId}
          />
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
