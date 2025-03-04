import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetCustomersQuery } from "../../api/userApi";
import { useGetAllUsersQuery } from "../../api/userApi";

const UserList = () => {
  const { data, error, isLoading } = useGetAllUsersQuery();
  const users = data?.users || [];

  const [showModal, setShowModal] = useState(false);
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching users.</p>;
  if (users.length === 0) return <p>No users available.</p>;
  const handleExport = (type) => {
    console.log(`Exporting as ${type}`);
  };
  return (
    <div class="page-wrapper">
      <div class="content">
        <div class="page-header">
          <div class="add-item d-flex">
            <div class="page-title">
              <h4 class="fw-bold">Customers</h4>
              <h6>Manage your users</h6>
            </div>
          </div>
          <ul class="table-top-head">
            <li>
              <a data-bs-toggle="tooltip" data-bs-placement="top" title="Pdf">
                <img src="assets/img/icons/pdf.svg" alt="img" />
              </a>
            </li>
            <li>
              <a data-bs-toggle="tooltip" data-bs-placement="top" title="Excel">
                <img src="assets/img/icons/excel.svg" alt="img" />
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Refresh"
              >
                <i class="ti ti-refresh"></i>
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Collapse"
                id="collapse-header"
              >
                <i class="ti ti-chevron-up"></i>
              </a>
            </li>
          </ul>
          <div class="page-btn">
            <a
              href="#"
              class="btn btn-primary text-white"
              data-bs-toggle="modal"
              data-bs-target="#add-user"
            >
              <i class="ti ti-circle-plus me-1"></i>Add Customer
            </a>
          </div>
        </div>

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

                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created At</th>

                    <th class="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <label class="checkboxs">
                          <input type="checkbox" />
                          <span class="checkmarks"></span>
                        </label>
                      </td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.mobileNumber}</td>
                      <td>{user.roles}</td>
                      <td>{user.status}</td>
                      <td>{user.createdAt}</td>
                      <td class="d-flex">
                        <div class="edit-delete-action d-flex align-items-center">
                          <a
                            class="me-2 p-2 d-flex align-items-center border rounded"
                            href="#"
                          >
                            <i data-feather="eye" class="feather-eye"></i>
                          </a>
                          <a
                            class="me-2 p-2 d-flex align-items-center border rounded"
                            href="#"
                            data-bs-toggle="modal"
                            data-bs-target="#edit-user"
                          >
                            <i data-feather="edit" class="feather-edit"></i>
                          </a>
                          <a
                            data-bs-toggle="modal"
                            data-bs-target="#delete-modal"
                            class="p-2 d-flex align-items-center border rounded"
                            href="javascript:void(0);"
                          >
                            <i
                              data-feather="trash-2"
                              class="feather-trash-2"
                            ></i>
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

export default UserList;
