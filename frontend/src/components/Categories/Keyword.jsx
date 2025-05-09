import React, { useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import {
  useGetAllKeywordsQuery,
  useDeleteKeywordMutation,
} from "../../api/keywordApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import { useDeleteCategoryMutation } from "../../api/categoryApi";
import PageHeader from "../Common/PageHeader";
import AddCategoryModal from "./AddCategoryModal";
import AddKeywordModal from "./AddKeywordModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { AiOutlineEdit } from "react-icons/ai";
import { FcFullTrash, FcEmptyTrash } from "react-icons/fc";
import { toast } from "react-toastify";

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

  // Format keywords for tableData prop
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
        tableData={formattedKeywords} // Pass formatted keywords for Excel/PDF
      />

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Keywords Table</h5>
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

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table datatable">
              <thead className="thead-light">
                <tr>
                  <th>Keyword</th>
                  <th>Category</th>
                  <th>Created On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No keywords found for selected category.
                    </td>
                  </tr>
                ) : (
                  paginated.map((keyword) => (
                    <tr key={keyword.id}>
                      <td>{keyword.keyword}</td>
                      <td>
                        {categoryMap[keyword.categoryId] || "Uncategorized"}
                      </td>
                      <td>
                        {new Date(keyword.createdAt).toLocaleDateString()}
                      </td>
                      <td className="action-table-data">
                        <div className="edit-delete-action">
                          <a
                            className="me-2 p-2"
                            href="#"
                            onClick={() => handleEdit(keyword)}
                          >
                            <AiOutlineEdit />
                          </a>
                          <a
                            className="p-2"
                            href="#"
                            onClick={() => {
                              setKeywordToDelete(keyword);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FcEmptyTrash />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <DataTablePagination
              totalItems={filteredKeywords.length}
              itemNo={itemsPerPage}
              onPageChange={setKeywordPage}
            />
          </div>
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
