import React from "react";
import CategoriesItem from "./CategoriesItem";
import PageHeader from "../Common/PageHeader";

const CategoriesList = () => {
  const handleAddCategory = () => alert("Open Add Category Modal");
  const handlePdfDownload = () => alert("Downloading PDF...");
  const handleExcelDownload = () => alert("Downloading Excel...");
  const handleRefresh = () => alert("Refreshing...");
  const handleCollapse = () => alert("Collapsing...");

  return (
    <div class="page-wrapper">
      <div class="content">
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

        <div class="card">
          <div class="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div class="search-set">
              <div class="search-input">
                <span class="btn-searchset">
                  <i class="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
            <div class="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div class="dropdown">
                <a
                  href="javascript:void(0);"
                  class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status
                </a>
                <ul class="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Active
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Inactive
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table datatable">
                <thead class="thead-light">
                  <tr>
                    <th class="no-sort">
                      <label class="checkboxs">
                        <input type="checkbox" id="select-all" />
                        <span class="checkmarks"></span>
                      </label>
                    </th>
                    <th>Category</th>
                    <th>Category slug</th>
                    <th>Created On</th>
                    <th>Status</th>
                    <th class="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <label class="checkboxs">
                        <input type="checkbox" />
                        <span class="checkmarks"></span>
                      </label>
                    </td>
                    <td>
                      <span class="text-gray-9">Computers</span>
                    </td>
                    <td>computers</td>
                    <td>24 Dec 2024</td>
                    <td>
                      <span class="badge bg-success fw-medium fs-10">
                        Active
                      </span>
                    </td>
                    <td class="action-table-data">
                      <div class="edit-delete-action">
                        <a
                          class="me-2 p-2"
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#edit-category"
                        >
                          <i data-feather="edit" class="feather-edit"></i>
                        </a>
                        <a
                          data-bs-toggle="modal"
                          data-bs-target="#delete-modal"
                          class="p-2"
                          href="javascript:void(0);"
                        >
                          <i data-feather="trash-2" class="feather-trash-2"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
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
