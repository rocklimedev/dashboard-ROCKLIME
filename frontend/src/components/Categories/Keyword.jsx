import React, { useState } from "react";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import {
  useGetAllKeywordsQuery,
  useDeleteKeywordMutation,
} from "../../api/keywordApi";
import PageHeader from "../Common/PageHeader";
import AddKeywordModal from "./AddKeywordModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
import { toast } from "sonner";

const Keyword = ({ onClose, showModal }) => {
  const [keywordPage, setKeywordPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [keywordToEdit, setKeywordToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keywordToDelete, setKeywordToDelete] = useState(null);
  const itemsPerPage = 20;

  const {
    data: keywordData,
    isLoading: keywordLoading,
    error: keywordError,
  } = useGetAllKeywordsQuery();
  const {
    data: categoryData,
    isLoading: categoryLoading,
    error: categoryError,
  } = useGetAllCategoriesQuery();
  const [deleteKeyword] = useDeleteKeywordMutation();

  if (keywordLoading || categoryLoading) return <p>Loading...</p>;
  if (keywordError || categoryError) {
    toast.error("Error fetching keywords or categories.");
    return <p>Error loading data.</p>;
  }

  const keywords = Array.isArray(keywordData?.keywords)
    ? keywordData.keywords
    : [];
  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];

  const categoryMap = categories.reduce((acc, category) => {
    acc[category.categoryId] = category.name;
    return acc;
  }, {});

  const filteredKeywords =
    selectedCategoryId === "all"
      ? keywords
      : keywords.filter((k) => k.categoryId === selectedCategoryId);

  const formattedKeywords = filteredKeywords.map((keyword) => ({
    id: keyword.id,
    keyword: keyword.keyword,
    category: categoryMap[keyword.categoryId] || "Uncategorized",
    createdAt: new Date(keyword.createdAt).toLocaleDateString(),
  }));

  const paginated = filteredKeywords.slice(
    (keywordPage - 1) * itemsPerPage,
    keywordPage * itemsPerPage
  );

  const handleAddKeyword = () => {
    setKeywordToEdit(null);
    setShowKeywordModal(true);
  };

  const handleEdit = (keyword) => {
    setKeywordToEdit(keyword);
    setShowKeywordModal(true);
  };

  const handleDelete = async (keyword) => {
    if (!keyword || !keyword.id) {
      toast.error("Invalid keyword or keyword ID.");
      return;
    }

    try {
      await deleteKeyword(keyword.id).unwrap();
      toast.success("Keyword deleted successfully!");
      setShowDeleteModal(false);
      setKeywordToDelete(null);
      if (paginated.length === 1 && keywordPage > 1) {
        setKeywordPage(keywordPage - 1);
      }
    } catch (err) {
      toast.error(
        `Failed to delete keyword: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const setShowKeywordModal = (value) => {
    if (!value) onClose();
    setShowModal(value);
  };

  const setShowModal = (value) => {
    // This simulates the external showModal state update
    // In practice, this would be handled by the parent component
    if (typeof showModal === "function") showModal(value);
  };

  return (
    <>
      <PageHeader
        title="Keywords"
        subtitle="Manage your keywords by category"
        onAdd={handleAddKeyword}
        tableData={formattedKeywords}
      />

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Keywords</h5>
          <select
            className="form-select w-auto"
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setKeywordPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="card-body">
          <div className="row">
            {/* Add Keyword Card */}
            <div className="col-md-4 col-lg-3 mb-3">
              <div
                className="card h-100 d-flex align-items-center justify-content-center"
                style={{ cursor: "pointer" }}
                onClick={handleAddKeyword}
              >
                <div className="card-body text-center">
                  <h5 className="card-title">Add New Keyword</h5>
                  <p className="card-text">
                    Click here to create a new keyword
                  </p>
                  <button className="btn btn-primary">Add Keyword</button>
                </div>
              </div>
            </div>

            {/* Keyword Cards */}
            {paginated.map((keyword) => (
              <div key={keyword.id} className="col-md-4 col-lg-3 mb-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{keyword.keyword}</h5>
                    <p className="card-text">
                      <strong style={{ color: "#25D366" }}>
                        {categoryMap[keyword.categoryId] || "Uncategorized"}
                      </strong>
                    </p>
                    <div className="d-flex justify-content-end">
                      <a
                        className="me-2"
                        title="Edit"
                        onClick={() => handleEdit(keyword)}
                        style={{ cursor: "pointer" }}
                      >
                        <AiOutlineEdit size={20} />
                      </a>
                      <a
                        title="Delete"
                        onClick={() => {
                          setKeywordToDelete(keyword);
                          setShowDeleteModal(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <FcEmptyTrash size={20} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {paginated.length === 0 && (
              <div className="col-12">
                <p className="text-center">
                  No keywords found for selected category.
                </p>
              </div>
            )}
          </div>

          <DataTablePagination
            totalItems={filteredKeywords.length}
            itemNo={itemsPerPage}
            onPageChange={setKeywordPage}
          />
        </div>
      </div>

      {showModal && (
        <AddKeywordModal
          onClose={() => setShowKeywordModal(false)}
          editData={keywordToEdit}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isVisible={showDeleteModal}
          item={keywordToDelete}
          itemType="Keyword"
          onConfirm={() => handleDelete(keywordToDelete)}
          onCancel={() => {
            setShowDeleteModal(false);
            setKeywordToDelete(null);
          }}
        />
      )}
    </>
  );
};

export default Keyword;
