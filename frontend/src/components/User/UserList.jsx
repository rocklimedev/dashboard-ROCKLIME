import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import {
  FaEye,
  FaPen,
  FaTrash,
  FaExclamationTriangle,
  FaBan,
} from "react-icons/fa";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllUsersQuery,
  useReportUserMutation,
  useInactiveUserMutation,
  useDeleteUserMutation,
} from "../../api/userApi";
import AddUser from "./AddUser";
import DataTablePagination from "../Common/DataTablePagination";
import DeleteModal from "../Common/DeleteModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserList = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetAllUsersQuery();
  console.log("useGetAllUsersQuery:", { data, error });
  const users = data?.users || [];

  const [reportUser, { isLoading: isReporting }] = useReportUserMutation();
  const [inactiveUser, { isLoading: isInactivating }] =
    useInactiveUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

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
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) {
      toast.error("No user selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteUser(userToDelete).unwrap();
      toast.success("User deleted successfully!");
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(
        `Failed to delete user: ${error.data?.message || "Unknown error"}`
      );
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleReportUser = async (userId) => {
    try {
      await reportUser(userId).unwrap();
      toast.success("User reported successfully!");
    } catch (error) {
      console.error("Error reporting user:", error);
      toast.error(
        `Failed to report user: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  const handleInactiveUser = async (userId) => {
    try {
      await inactiveUser(userId).unwrap();
      toast.success("User marked as inactive!");
    } catch (error) {
      console.error("Error marking user as inactive:", error);
      toast.error(
        `Failed to mark user as inactive: ${
          error.data?.message || "Unknown error"
        }`
      );
    }
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

  if (isLoading || isFetching) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Error fetching users:{" "}
        {error.data?.message || error.message || "Unknown error"}
        <button className="btn btn-link" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="alert alert-info">No users available.</div>;
  }

  return (
    <div className="page-wrapper">
      <ToastContainer />
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
                    <tr key={user.userId}>
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
                              onClick={() => handleInactiveUser(user.userId)}
                              disabled={isInactivating}
                            >
                              <FaBan className="me-2" /> Inactive User
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleReportUser(user.userId)}
                              disabled={isReporting}
                            >
                              <FaExclamationTriangle className="me-2 text-warning" />{" "}
                              Report User
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleDeleteUser(user.userId)}
                              className="text-danger"
                              disabled={isDeleting}
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
          </div>
          <div className="card-footer">
            <DataTablePagination
              totalItems={users.length}
              itemNo={itemsPerPage}
              onPageChange={handlePageChange}
              currentPage={currentPage}
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
      {showDeleteModal && (
        <DeleteModal
          item={userToDelete}
          itemType="User"
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default UserList;
