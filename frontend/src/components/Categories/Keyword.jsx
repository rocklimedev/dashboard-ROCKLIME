import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import DataTablePagination from "../Common/DataTablePagination";
import { useGetAllKeywordsQuery } from "../../api/keywordApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
import { toast } from "react-toastify";
import AddKeywordModal from "./AddKeywordModal";

const Keyword = () => {
  const [keywordPage, setKeywordPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const itemsPerPage = 20;

  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [keywordToEdit, setKeywordToEdit] = useState(null); // ✅ Edit state

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

  const paginated = filteredKeywords.slice(
    (keywordPage - 1) * itemsPerPage,
    keywordPage * itemsPerPage
  );

  const handleAddKeyword = () => {
    setKeywordToEdit(null); // Clear edit
    setShowKeywordModal(true);
  };

  const handleCloseKeywordModal = () => {
    setShowKeywordModal(false);
    setKeywordToEdit(null); // Reset after closing
  };

  const handleEdit = (keyword) => {
    setKeywordToEdit(keyword);
    setShowKeywordModal(true);
  };

  return (
    <>
      <PageHeader
        title="Keywords"
        subtitle="Manage your keywords by category"
        onAdd={handleAddKeyword}
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
                          <a className="p-2" href="#">
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

      {showKeywordModal && (
        <AddKeywordModal
          onClose={handleCloseKeywordModal}
          editData={keywordToEdit} // ✅ Passing edit info
        />
      )}
    </>
  );
};

export default Keyword;
