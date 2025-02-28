import React from "react";
import PageHeader from "../Common/PageHeader";

const Permissions = () => {
  return (
    <div class="page-wrapper">
      <div class="content">
        <PageHeader />
        <div class="card">
          <div class="card-header">
            <div class="table-top mb-0">
              <div class="search-set">
                <div class="search-input">
                  <span class="btn-searchset">
                    <i class="ti ti-search fs-14 feather-search"></i>
                  </span>
                </div>
              </div>
              <div class="d-flex align-items-center">
                <p class="mb-0 fw-medium text-gray-9 me-1">Role:</p>
                <p>Admin</p>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table datatable">
                <thead class="thead-light">
                  <tr>
                    <th class="no-sort">Modules</th>
                    <th>Allow All</th>
                    <th>Read</th>
                    <th>Write</th>
                    <th>Create</th>
                    <th>Delete</th>
                    <th>Import</th>
                    <th>Export</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-gray-9">Employee</td>
                    <td class="py-3">
                      <div class="form-check form-check-md">
                        <input class="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td class="py-3">
                      <div class="form-check form-check-md">
                        <input class="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td class="py-3">
                      <div class="form-check form-check-md">
                        <input class="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td class="py-3">
                      <div class="form-check form-check-md">
                        <input class="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td class="py-3">
                      <div class="form-check form-check-md">
                        <input class="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td class="py-3">
                      <div class="form-check form-check-md">
                        <input class="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td class="py-3">
                      <div class="form-check form-check-md">
                        <input class="form-check-input" type="checkbox" />
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

export default Permissions;
