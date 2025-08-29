import React, { useState, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import { Modal, Table } from "react-bootstrap";
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
import { useGetAllProductCodesQuery } from "../../api/productApi";
import { Link } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import AddCategoryModal from "./AddCategoryModal";
import AddParentCategoryModal from "./AddParentCategoryModal";
import AddKeywordModal from "./AddKeywordModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { AiOutlineEdit } from "react-icons/ai";
import { BiTrash } from "react-icons/bi";
import { toast } from "sonner";
import "../Product/checkproductcodestatus.css";

const styles = {
  searchCard: {
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    padding: "20px",
    marginBottom: "20px",
  },
  searchInputWrapper: {
    position: "relative",
    maxWidth: "400px",
    margin: "0 auto 15px",
  },
  searchInput: {
    borderRadius: "20px",
    paddingLeft: "40px",
    height: "40px",
    fontSize: "14px",
    border: "1px solid #ddd",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
  },
  resultSection: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #eee",
  },
  resultTitle: {
    fontSize: "18px",
    fontWeight: "500",
    marginBottom: "10px",
    color: "#333",
  },
  resultText: {
    fontSize: "14px",
    color: "#444",
    lineHeight: "1.6",
  },
  categoryCard: {
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    padding: "20px",
    marginBottom: "20px",
  },
  categoryTitle: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#333",
    margin: "0",
  },
  categoryBadge: {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "12px",
    backgroundColor: "#333",
    color: "#fff",
  },
  categoryParent: {
    fontSize: "12px",
    color: "#777",
    marginTop: "5px",
  },
  modalHeader: {
    backgroundColor: "#e31e24",
    color: "#fff",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "500",
    color: "#fff",
  },
  table: {
    fontSize: "14px",
    borderRadius: "8px",
    overflow: "hidden",
  },
  pagination: {
    marginTop: "20px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#666",
  },
};

const CategoryManagement = () => {
  // State
  const [showParentCategoryModal, setShowParentCategoryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
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
  const [productPage, setProductPage] = useState(1);
  const [parentCategorySearchTerm, setParentCategorySearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [keywordSearchTerm, setKeywordSearchTerm] = useState("");
  const [productSearchCode, setProductSearchCode] = useState("");
  const [filteredProduct, setFilteredProduct] = useState(null);
  const [productNotFound, setProductNotFound] = useState(false);
  const [modalProductSearch, setModalProductSearch] = useState("");

  const itemsPerPage = 20;
  const productPageSize = 25;

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
  const {
    data: productData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetAllProductCodesQuery();
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
  const products = Array.isArray(productData?.data) ? productData.data : [];

  // Category ID to name mapping
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.categoryId] = cat.name;
    });
    return map;
  }, [categories]);

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

  // Filter products in modal
  const filteredModalProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    let result = products.filter((p) => p.categoryId === selectedCategoryId);
    if (modalProductSearch) {
      result = result.filter((p) =>
        p.product_code?.toLowerCase().includes(modalProductSearch.toLowerCase())
      );
    }
    return result;
  }, [products, selectedCategoryId, modalProductSearch]);

  // Pagination
  const paginatedParentCategories = useMemo(
    () =>
      filteredParentCategories.slice(
        (parentCategoryPage - 1) * itemsPerPage,
        parentCategoryPage * itemsPerPage
      ),
    [filteredParentCategories, parentCategoryPage]
  );
  const paginatedCategories = useMemo(
    () =>
      filteredCategories.slice(
        (categoryPage - 1) * itemsPerPage,
        categoryPage * itemsPerPage
      ),
    [filteredCategories, categoryPage]
  );
  const paginatedKeywords = useMemo(
    () =>
      filteredKeywords.slice(
        (keywordPage - 1) * itemsPerPage,
        keywordPage * itemsPerPage
      ),
    [filteredKeywords, keywordPage]
  );
  const paginatedProducts = useMemo(
    () =>
      filteredModalProducts.slice(
        (productPage - 1) * productPageSize,
        productPage * productPageSize
      ),
    [filteredModalProducts, productPage]
  );

  // Debounced search handlers
  const debouncedSetParentCategorySearch = useCallback(
    debounce((value) => {
      setParentCategorySearchTerm(value);
      setParentCategoryPage(1); // Reset page when searching
    }, 300),
    []
  );
  const debouncedSetCategorySearch = useCallback(
    debounce((value) => {
      setCategorySearchTerm(value);
      setCategoryPage(1); // Reset page when searching
    }, 300),
    []
  );
  const debouncedSetKeywordSearch = useCallback(
    debounce((value) => {
      setKeywordSearchTerm(value);
      setKeywordPage(1); // Reset page when searching
    }, 300),
    []
  );
  const debouncedSetModalProductSearch = useCallback(
    debounce((value) => {
      setModalProductSearch(value);
      setProductPage(1); // Reset page when searching
    }, 300),
    []
  );

  // Handlers
  const handleAddParentCategory = useCallback(() => {
    setEditingParentCategory(null);
    setShowParentCategoryModal(true);
  }, []);

  const handleAddCategory = useCallback(() => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  }, []);

  const handleAddKeyword = useCallback(() => {
    setEditingKeyword(null);
    setShowKeywordModal(true);
  }, []);

  const handleCategoryClick = useCallback((categoryId) => {
    setSelectedCategoryId(categoryId);
    setShowProductModal(true);
    setProductPage(1);
    setModalProductSearch("");
  }, []);

  const handleDelete = useCallback(
    async (item, itemType) => {
      if (!item || !item.id) {
        toast.error(`Invalid ${itemType.toLowerCase()} or ID`);
        return;
      }

      try {
        if (itemType === "ParentCategory") {
          await deleteParentCategory(item.id).unwrap();
          if (
            paginatedParentCategories.length === 1 &&
            parentCategoryPage > 1
          ) {
            setParentCategoryPage((prev) => Math.max(1, prev - 1));
          }
          if (selectedParentId === item.id) {
            setSelectedParentId(null);
            setSelectedCategoryId(null);
            setShowProductModal(false);
          }
        } else if (itemType === "Category") {
          await deleteCategory(item.categoryId).unwrap();
          if (paginatedCategories.length === 1 && categoryPage > 1) {
            setCategoryPage((prev) => Math.max(1, prev - 1));
          }
          if (selectedCategoryId === item.categoryId) {
            setSelectedCategoryId(null);
            setShowProductModal(false);
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
    },
    [
      paginatedParentCategories,
      parentCategoryPage,
      selectedParentId,
      selectedCategoryId,
      paginatedCategories,
      categoryPage,
      paginatedKeywords,
      keywordPage,
      deleteParentCategory,
      deleteCategory,
      deleteKeyword,
    ]
  );

  const handleBack = useCallback(() => {
    if (selectedCategoryId) {
      setSelectedCategoryId(null);
      setKeywordPage(1);
      setKeywordSearchTerm("");
      setShowProductModal(false);
    } else if (selectedParentId) {
      setSelectedParentId(null);
      setCategoryPage(1);
      setCategorySearchTerm("");
    }
  }, [selectedCategoryId, selectedParentId]);

  const handleCloseParentCategoryModal = useCallback(() => {
    setShowParentCategoryModal(false);
    setEditingParentCategory(null);
  }, []);

  const handleCloseCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  }, []);

  const handleCloseKeywordModal = useCallback(() => {
    setShowKeywordModal(false);
    setEditingKeyword(null);
  }, []);

  const handleProductSearch = useCallback(() => {
    let result = products;
    if (productSearchCode) {
      result = result.filter((p) =>
        p.product_code
          ?.toLowerCase()
          .includes(productSearchCode.trim().toLowerCase())
      );
    }
    setFilteredProduct(result.length > 0 ? result[0] : null);
    setProductNotFound(result.length === 0);
  }, [products, productSearchCode]);

  // Loading and error states
  if (
    parentCategoryLoading ||
    categoryLoading ||
    keywordLoading ||
    productsLoading
  )
    return <p>Loading data...</p>;
  if (parentCategoryError || categoryError || keywordError || productsError)
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
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setShowProductModal(false);
                    }}
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

        {/* Product Code Search */}
        <div className="card" style={styles.searchCard}>
          <div className="card-body p-4">
            <div
              style={{
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  ...styles.searchInputWrapper,
                  flex: "1 1 300px",
                  maxWidth: "400px",
                }}
              >
                <span style={styles.searchIcon}>
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Product Code"
                  value={productSearchCode}
                  onChange={(e) => setProductSearchCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
                  style={styles.searchInput}
                  aria-label="Search product code"
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleProductSearch}
                style={{ height: "40px", borderRadius: "20px" }}
              >
                Search
              </button>
            </div>

            {/* Result display */}
            {filteredProduct && (
              <div style={styles.resultSection}>
                <h5 style={styles.resultTitle}>
                  <i className="ti ti-check me-2 text-success"></i>Product Found
                </h5>
                <p style={styles.resultText}>
                  <strong>Name:</strong> {filteredProduct.name}
                  <br />
                  <strong>Product Code:</strong> {filteredProduct.product_code}
                  <br />
                  <strong>Category:</strong>{" "}
                  {categoryMap[filteredProduct.categoryId] || "Unknown"}
                </p>
                <Link
                  to={`/product/${filteredProduct.productId}/edit`}
                  className="btn btn-sm btn-outline-primary mt-2"
                >
                  Edit Product
                </Link>
              </div>
            )}

            {!filteredProduct && productSearchCode && productNotFound && (
              <div style={styles.resultSection}>
                <h5 style={styles.resultTitle}>
                  <i className="ti ti-x me-2 text-danger"></i>No Product Found
                </h5>
                <p className="text-success" style={styles.resultText}>
                  <i className="ti ti-check me-2"></i>Product Code is available
                  to use.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Parent Categories View */}
        {!selectedParentId && (
          <>
            <PageHeader
              title="Parent Categories"
              subtitle="Manage your parent categories and check product availability"
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
              currentPage={parentCategoryPage}
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
                    onClick={() => handleCategoryClick(category.categoryId)}
                  >
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title text-truncate">
                          {category.name}
                        </h5>
                        <span style={styles.categoryBadge}>
                          {
                            products.filter(
                              (p) => p.categoryId === category.categoryId
                            ).length
                          }
                        </span>
                      </div>
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
              currentPage={categoryPage}
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
              currentPage={keywordPage}
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

        {/* Product Modal */}
        {showProductModal && (
          <Modal
            show={showProductModal}
            onHide={() => {
              setShowProductModal(false);
              setModalProductSearch("");
              setProductPage(1);
            }}
            size="lg"
          >
            <Modal.Header style={styles.modalHeader}>
              <Modal.Title style={styles.modalTitle}>
                Products in{" "}
                {categoryMap[selectedCategoryId] || "Selected Category"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={styles.searchInputWrapper}>
                <span style={styles.searchIcon}>
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Products in Category..."
                  value={modalProductSearch}
                  onChange={(e) =>
                    debouncedSetModalProductSearch(e.target.value)
                  }
                  style={styles.searchInput}
                  aria-label="Search products in category"
                />
              </div>
              {paginatedProducts.length > 0 ? (
                <>
                  <Table striped bordered hover style={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Product Code</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product, idx) => (
                        <tr key={product.productId}>
                          <td>
                            {(productPage - 1) * productPageSize + idx + 1}
                          </td>
                          <td>{product.name}</td>
                          <td>{product.product_code}</td>
                          <td>
                            <Link
                              to={`/product/${product.productId}/edit`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <DataTablePagination
                    totalItems={filteredModalProducts.length}
                    itemNo={productPageSize}
                    onPageChange={setProductPage}
                    currentPage={productPage}
                  />
                </>
              ) : (
                <p className="text-center">
                  No products found for this category.
                </p>
              )}
            </Modal.Body>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
