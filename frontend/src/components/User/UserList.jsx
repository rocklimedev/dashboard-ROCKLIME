import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { FaEye, FaPen, FaTrash } from "react-icons/fa";
import PageHeader from "../Common/PageHeader";
import { useGetAllUsersQuery } from "../../api/userApi";
import AddUser from "./AddUser";
import DataTablePagination from "../Common/DataTablePagination";

const UserList = () => {
  const { data, error, isLoading } = useGetAllUsersQuery();
  const users = data?.users || [];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching users.</p>;
  if (users.length === 0) return <p>No users available.</p>;

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDeleteUser = (userId) => {
    alert(`Delete functionality for user ID: ${userId} is pending`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowViewModal(false);
    setSelectedUser(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Users"
          subtitle="Manage your users"
          onAdd={handleAddUser}
        />

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.username}</td>
                      <td>{user.mobileNumber}</td>
                      <td>{user.roles}</td>
                      <td>{user.status ? "Active" : "Inactive"}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="light" className="btn-sm">
                            ⋮
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleViewUser(user)}>
                              <FaEye className="me-2" /> View
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleEditUser(user)}>
                              <FaPen className="me-2" /> Edit
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-danger"
                            >
                              <FaTrash className="me-2" /> Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DataTablePagination
              totalItems={users.length}
              itemNo={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
      {showModal && (
        <AddUser onClose={handleCloseModal} userToEdit={selectedUser} />
      )}
      {showViewModal && (
        <AddUser
          onClose={handleCloseModal}
          userToEdit={selectedUser}
          isViewMode={true}
        />
      )}
    </div>
  );
};

export default UserList;
