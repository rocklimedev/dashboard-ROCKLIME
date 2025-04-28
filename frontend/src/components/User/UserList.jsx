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
import DeleteModal from "../Common/DeleteModal"; // Import DeleteModal
import { ToastContainer, toast } from "react-toastify"; // Import react-toastify
import "react-toastify/dist/ReactToastify.css"; // Import toastify CSS

const UserList = () => {
  const { data, error, isLoading } = useGetAllUsersQuery();
  const users = data?.users || [];

  const [reportUser] = useReportUserMutation();
  const [inactiveUser] = useInactiveUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for DeleteModal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null); // Track user to delete

  // Handle add user
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Handle view user
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!userToDelete) {
      toast.error("No user selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteUser(userToDelete).unwrap();
      toast.success("User deleted successfully!");
      // Reset to previous page if current page becomes empty
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

  // Handle report user
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

  // Handle inactive user
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

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setShowViewModal(false);
    setSelectedUser(null);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Paginated users
  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching users: {JSON.stringify(error)}</p>;
  if (users.length === 0) return <p>No users available.</p>;

  return (
    <div className="page-wrapper">
      <ToastContainer /> {/* Required for toasts */}
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
                            >
                              <FaBan className="me-2" /> Inactive User
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleReportUser(user.userId)}
                            >
                              <FaExclamationTriangle className="me-2 text-warning" />{" "}
                              Report User
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleDeleteUser(user.userId)}
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
          </div>
          <div className="card-footer">
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
      {showDeleteModal && (
        <DeleteModal
          item={userToDelete}
          itemType="User"
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            console.log("Canceling delete modal");
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
