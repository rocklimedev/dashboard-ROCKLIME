import React from "react";
import PageHeader from "../Common/PageHeader";

const GivePermission = () => {
  return (
    <div class="page-wrapper">
      <div class="content">
        <PageHeader />

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
                      <div class="form-check form-check-md">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          id="select-all"
                        />
                      </div>
                    </th>
                    <th>Role</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="form-check form-check-md">
                        <input class="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>Admin</td>
                    <td>12 Sep 2024 </td>
                    <td>
                      <span class="badge badge-success d-inline-flex align-items-center badge-xs">
                        <i class="ti ti-point-filled me-1"></i>Active
                      </span>
                    </td>
                    <td>
                      <div class="action-icon d-inline-flex">
                        <a
                          href="/roles-permission/permissions/:id"
                          class="me-2 d-flex align-items-center p-2 border rounded"
                        >
                          <i class="ti ti-shield"></i>
                        </a>
                        <a
                          href="#"
                          class="me-2 d-flex align-items-center p-2 border rounded"
                          data-bs-toggle="modal"
                          data-bs-target="#edit-role"
                        >
                          <i class="ti ti-edit"></i>
                        </a>
                        <a
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                          class=" d-flex align-items-center p-2 border rounded"
                        >
                          <i class="ti ti-trash"></i>
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

export default GivePermission;
