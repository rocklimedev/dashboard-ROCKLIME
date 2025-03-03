import React from "react";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import PageHeader from "../Common/PageHeader";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
const CategoriesList = () => {
  const { data, error, isLoading } = useGetAllCategoriesQuery();
  const categories = Array.isArray(data?.categories) ? data.categories : [];

  const handleAddCategory = () => alert("Open Add Category Modal");
  const handlePdfDownload = () => alert("Downloading PDF...");
  const handleExcelDownload = () => alert("Downloading Excel...");
  const handleRefresh = () => alert("Refreshing...");
  const handleCollapse = () => alert("Collapsing...");

  if (isLoading) return <p>Loading categories...</p>;
  if (error) return <p>Error fetching categories.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
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
                  {categories?.map((category) => (
                    <tr key={category._id}>
                      <td>{category.name}</td>
                      <td>{category.slug}</td>
                      <td>{category.parentCategory}</td>
                      <td>
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td>{category.total_products}</td>
                      <td class="action-table-data">
                        <div class="edit-delete-action">
                          <a
                            class="me-2 p-2"
                            href="#"
                            data-bs-toggle="modal"
                            data-bs-target="#edit-brand"
                          >
                            <AiOutlineEdit />
                          </a>
                          <a
                            data-bs-toggle="modal"
                            data-bs-target="#delete-modal"
                            class="p-2"
                            href="javascript:void(0);"
                          >
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
