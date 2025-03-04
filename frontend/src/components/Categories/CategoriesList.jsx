import React from "react";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllKeywordsQuery } from "../../api/keywordApi";
import PageHeader from "../Common/PageHeader";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";

const CategoriesList = () => {
  const {
    data: categoryData,
    error: categoryError,
    isLoading: categoryLoading,
  } = useGetAllCategoriesQuery();
  const {
    data: keywordData,
    error: keywordError,
    isLoading: keywordLoading,
  } = useGetAllKeywordsQuery();

  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];
  const keywords = Array.isArray(keywordData?.keywords)
    ? keywordData.keywords
    : [];

  const handleAddCategory = () => alert("Open Add Category Modal");
  const handleAddKeyword = () => alert("Open Add Keyword Modal");
  const handlePdfDownload = () => alert("Downloading PDF...");
  const handleExcelDownload = () => alert("Downloading Excel...");
  const handleRefresh = () => alert("Refreshing...");
  const handleCollapse = () => alert("Collapsing...");

  if (categoryLoading || keywordLoading) return <p>Loading data...</p>;
  if (categoryError) return <p>Error fetching categories.</p>;
  if (keywordError) return <p>Error fetching keywords.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Categories Section */}
        <PageHeader
          title="Categories"
          subtitle="Manage your categories"
          onAdd={handleAddCategory}
          actions={{
            pdf: handlePdfDownload,
            excel: handleExcelDownload,
            refresh: handleRefresh,
            collapse: handleCollapse,
          }}
        />

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Category</th>
                    <th>Category Slug</th>
                    <th>Parent Category</th>
                    <th>Created On</th>
                    <th>Total Products</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td>{category.name}</td>
                      <td>{category.slug}</td>
                      <td>{category.parentCategory || "N/A"}</td>
                      <td>
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td>{category.total_products}</td>
                      <td className="action-table-data">
                        <div className="edit-delete-action">
                          <a className="me-2 p-2" href="#">
                            <AiOutlineEdit />
                          </a>
                          <a className="p-2" href="#">
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

        {/* Keywords Section */}
        <PageHeader
          title="Keywords"
          subtitle="Manage your keywords"
          onAdd={handleAddKeyword}
          actions={{
            pdf: handlePdfDownload,
            excel: handleExcelDownload,
            refresh: handleRefresh,
            collapse: handleCollapse,
          }}
        />

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Keyword</th>
                    <th>Type</th>
                    <th>Created On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((keyword) => (
                    <tr key={keyword.id}>
                      <td>{keyword.keyword}</td>
                      <td>{keyword.type}</td>
                      <td>
                        {new Date(keyword.createdAt).toLocaleDateString()}
                      </td>
                      <td className="action-table-data">
                        <div className="edit-delete-action">
                          <a className="me-2 p-2" href="#">
                            <AiOutlineEdit />
                          </a>
                          <a className="p-2" href="#">
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
    </div>
  );
};

export default CategoriesList;
