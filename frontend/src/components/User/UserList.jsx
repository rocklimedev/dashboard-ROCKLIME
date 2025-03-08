import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetCustomersQuery } from "../../api/userApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import Actions from "../Common/Actions";
import AddUser from "./AddUser";

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
  const handleDelete = () => alert("To be done!");
  const handleAddUser = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  return (
    <div class="page-wrapper">
      <div class="content">
        <PageHeader
          title="Users"
          subtitle="Manage your users"
          onAdd={handleAddUser}
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

                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
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
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.mobileNumber}</td>
                      <td>{user.roles}</td>
                      <td>{user.status}</td>
                      <td>{user.createdAt}</td>
                      <td class="d-flex">
                        <Actions
                          id={user.id}
                          name={user.name}
                          viewUrl={`/users/${user.id}`}
                          editUrl={`/users/edit/${user.id}`}
                          onDelete={() => handleDelete(user.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showModal ? <AddUser onClose={handleCloseModal} /> : null}
    </div>
  );
};

export default UserList;
