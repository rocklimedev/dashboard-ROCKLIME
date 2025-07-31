import React, { useState, useMemo } from "react";
import {
  FaEye,
  FaPen,
  FaTrash,
  FaExclamationTriangle,
  FaBan,
  FaSearch,
} from "react-icons/fa";
import {
  useGetAllUsersQuery,
  useReportUserMutation,
  useInactiveUserMutation,
  useDeleteUserMutation,
} from "../../api/userApi";
import AddUser from "./AddUser";
import DataTablePagination from "../Common/DataTablePagination";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
const UserList = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetAllUsersQuery();
  const users = data?.users || [];
  const navigate = useNavigate();
  const [reportUser, { isLoading: isReporting }] = useReportUserMutation();
  const [inactiveUser, { isLoading: isInactivating }] =
    useInactiveUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const itemsPerPage = 20;

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Calculate stats using useMemo
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

  // Memoized grouped users for tab-based filtering
  const groupedUsers = useMemo(
    () => ({
      All: users,
      Active: users.filter((user) => user.status === "active"),
      Inactive: users.filter((user) => user.status !== "active"),
    }),
    [users]
  );

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = groupedUsers[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((user) =>
        [user.name, user.email, user.username, user.mobileNumber]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Descending":
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        break;
    }

    return result;
  }, [groupedUsers, activeTab, searchTerm, sortBy]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const handleAddUser = () => {
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    navigate(`/user/${user.userId}/edit`);
  };

  const handleViewUser = (user) => {
    navigate(`/user/${user.userId}`);
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
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
    toast.info("Filters cleared!");
  };

  if (isLoading || isFetching) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error fetching users:{" "}
              {error.data?.message || error.message || "Unknown error"}
              <button className="btn btn-link ms-2" onClick={refetch}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Users"
            subtitle="Manage your Users"
            onAdd={handleAddUser}
          />
          <div className="card-body">
            <div className="row">
              <div className="col-lg-4">
                <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                  <h6 className="me-2">Status</h6>
                  <ul
                    className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                    id="pills-tab"
                    role="tablist"
                  >
                    {Object.keys(groupedUsers).map((status) => (
                      <li className="nav-item" role="presentation" key={status}>
                        <button
                          className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                            activeTab === status ? "active" : ""
                          }`}
                          id={`tab-${status}`}
                          data-bs-toggle="pill"
                          data-bs-target={`#pills-${status}`}
                          type="button"
                          role="tab"
                          aria-selected={activeTab === status}
                          onClick={() => setActiveTab(status)}
                        >
                          {status} ({groupedUsers[status].length})
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <div className="d-flex align-items-center border p-2 rounded">
                    <span className="d-inline-flex me-2">Sort By: </span>
                    <div className="dropdown">
                      <a
                        href="#"
                        className="dropdown-toggle btn btn-white d-inline-flex align-items-center border-0 bg-transparent p-0 text-dark"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        {sortBy}
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        {["Recently Added", "Ascending", "Descending"].map(
                          (option) => (
                            <li key={option}>
                              <a
                                href="#"
                                className="dropdown-item rounded-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSortBy(option);
                                }}
                              >
                                {option}
                              </a>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="input-icon-start position-relative">
                    <span className="input-icon-addon">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Users"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search users"
                    />
                  </div>
                  <button
                    className="btn btn-outline-secondary ms-2"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            <div className="tab-content" id="pills-tabContent">
              {Object.entries(groupedUsers).map(([status, list]) => (
                <div
                  className={`tab-pane fade ${
                    activeTab === status ? "show active" : ""
                  }`}
                  id={`pills-${status}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${status}`}
                  key={status}
                >
                  {paginatedUsers.length === 0 ? (
                    <p className="text-muted">
                      No {status.toLowerCase()} users match the applied filters
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Username</th>
                            <th>Mobile Number</th>
                            <th>Roles</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedUsers.map((user) => (
                            <tr key={user.userId}>
                              <td>{user.name || "N/A"}</td>
                              <td>{user.email || "N/A"}</td>
                              <td>{user.username || "N/A"}</td>
                              <td>{user.mobileNumber || "N/A"}</td>
                              <td>{user.roles?.join(", ") || "N/A"}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    user.status === "active"
                                      ? "badge-success"
                                      : "badge-danger"
                                  }`}
                                >
                                  {user.status === "active"
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </td>
                              <td>
                                {user.createdAt
                                  ? new Date(
                                      user.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td>
                                <div className="actions d-flex gap-2">
                                  <FaEye
                                    className="action-icon"
                                    onClick={() => handleViewUser(user)}
                                    aria-label={`View ${user.name}`}
                                  />
                                  <FaPen
                                    className="action-icon"
                                    onClick={() => handleEditUser(user)}
                                    aria-label={`Edit ${user.name}`}
                                  />
                                  <FaBan
                                    className="action-icon"
                                    onClick={() =>
                                      handleInactiveUser(user.userId)
                                    }
                                    disabled={isInactivating}
                                    aria-label={`Inactive ${user.name}`}
                                  />
                                  <FaExclamationTriangle
                                    className="action-icon text-warning"
                                    onClick={() =>
                                      handleReportUser(user.userId)
                                    }
                                    disabled={isReporting}
                                    aria-label={`Report ${user.name}`}
                                  />
                                  <FaTrash
                                    className="action-icon text-danger"
                                    onClick={() =>
                                      handleDeleteUser(user.userId)
                                    }
                                    disabled={isDeleting}
                                    aria-label={`Delete ${user.name}`}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredUsers.length > itemsPerPage && (
                        <div className="pagination-section mt-4">
                          <DataTablePagination
                            totalItems={filteredUsers.length}
                            itemNo={itemsPerPage}
                            onPageChange={handlePageChange}
                            currentPage={currentPage}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {showModal && <AddUser onClose={handleCloseModal} userToEdit={null} />}
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
    </div>
  );
};

export default UserList;
