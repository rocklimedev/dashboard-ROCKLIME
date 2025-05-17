import React, { useState, useMemo } from "react";
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
import userimg from "../../assets/img/profiles/avatar-01.jpg";
import { useNavigate } from "react-router-dom";
const UserList = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetAllUsersQuery();
  const users = data?.users || [];
  const navigate = useNavigate();
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

  // Calculate stats using useMemo to avoid recalculating on every render
  const stats = useMemo(() => {
    if (!users.length) {
      return {
        totalEmployees: 0,
        active: 0,
        inactive: 0,
        newJoiners: 0,
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      totalEmployees: users.length,
      active: users.filter((user) => user.status === "active").length,
      inactive: users.filter((user) => user.status !== "active").length,
      newJoiners: users.filter(
        (user) => new Date(user.createdAt) >= thirtyDaysAgo
      ).length,
    };
  }, [users]);

  // Format users for tableData prop
  const formattedUsers = users.map((user) => ({
    userId: user.userId,
    name: user.name,
    email: user.email,
    username: user.username,
    mobileNumber: user.mobileNumber,
    roles: user.roles,
    status: user.status ? "Active" : "Inactive",
    createdAt: new Date(user.createdAt).toLocaleDateString(),
  }));

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
          tableData={formattedUsers}
        />
        <div className="row">
          <div className="col-xl-3 col-md-6">
            <div className="card bg-purple border-0">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 text-white">Total Employees</p>
                  <h4 className="text-white">{stats.totalEmployees}</h4>
                </div>
                <div>
                  <span className="avatar avatar-lg bg-purple-900">
                    <i className="ti ti-users-group"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-teal border-0">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 text-white">Active</p>
                  <h4 className="text-white">{stats.active}</h4>
                </div>
                <div>
                  <span className="avatar avatar-lg bg-teal-900">
                    <i className="ti ti-user-star"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-secondary border-0">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 text-white">Inactive</p>
                  <h4 className="text-white">{stats.inactive}</h4>
                </div>
                <div>
                  <span className="avatar avatar-lg bg-secondary-900">
                    <i className="ti ti-user-exclamation"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-info border-0">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 text-white">New Joiners</p>
                  <h4 className="text-white">{stats.newJoiners}</h4>
                </div>
                <div>
                  <span className="avatar avatar-lg bg-info-900">
                    <i className="ti ti-user-check"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body p-0">
            <div className="employee-grid-widget">
              <div className="row">
                {paginatedUsers.map((user) => (
                  <div
                    className="col-xxl-3 col-xl-4 col-lg-6 col-md-6"
                    key={user.userId}
                  >
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between mb-2">
                          <div>
                            <a
                              href={`/user/${user.userId}`}
                              className="avatar avatar-xl avatar-rounded border p-1 rounded-circle"
                            >
                              <img
                                src={userimg}
                                className="img-fluid h-auto w-auto"
                                alt="img"
                              />
                            </a>
                          </div>
                          <div className="dropdown">
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="light"
                                className="btn-sm"
                              >
                                ⋮
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  onClick={navigate(`/user/${user.userId}`)}
                                >
                                  <FaEye className="me-2" /> View
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => handleEditUser(user)}
                                >
                                  <FaPen className="me-2" /> Edit
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() =>
                                    handleInactiveUser(user.userId)
                                  }
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
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-primary mb-2">
                            {user.username} - {user.mobileNumber || "N/A"}
                          </p>
                        </div>
                        <div className="text-center mb-3">
                          <h6 className="mb-1">
                            <a href={`/user/${user.userId}`}>{user.name}</a>
                          </h6>
                          <span className="badge bg-secondary-transparent text-gray-9 fs-10 fw-medium">
                            {user.roles.join(", ") || "N/A"}
                          </span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between bg-light rounded p-3">
                          <div className="text-start">
                            <h6 className="mb-1">Joined</h6>
                            <p>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-start">
                            <h6 className="mb-1">Status</h6>
                            <p>
                              {user.status === "active" ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
