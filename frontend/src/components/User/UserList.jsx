import React, { useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import {
  useGetAllUsersQuery,
  useReportUserMutation,
  useInactiveUserMutation,
  useDeleteUserMutation,
} from "../../api/userApi";
import {
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Dropdown, Menu, Button, Pagination } from "antd";
import AddUser from "./AddUser";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Common/PageHeader";

const UserList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const itemsPerPage = 20;

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch users with pagination
  const { data, error, isLoading, isFetching, refetch } = useGetAllUsersQuery({
    page: currentPage,
    limit: itemsPerPage,
  });

  const users = data?.users || [];
  console.log(users);
  const totalUsers = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const navigate = useNavigate();
  const [reportUser, { isLoading: isReporting }] = useReportUserMutation();
  const [inactiveUser, { isLoading: isInactivating }] =
    useInactiveUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

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
      totalEmployees: totalUsers,
      active: users.filter((user) => user.status === "active").length,
      inactive: users.filter((user) => user.status !== "active").length,
      newJoiners: users.filter(
        (user) => new Date(user.createdAt) >= thirtyDaysAgo
      ).length,
    };
  }, [users, totalUsers]);

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

  const handleAddUser = () => {
    navigate("/user/add");
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

      if (filteredUsers.length === 1 && currentPage > 1) {
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
    } catch (error) {
      toast.error(
        `Failed to report user: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  const handleInactiveUser = async (userId) => {
    try {
      await inactiveUser(userId).unwrap();
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
            tableData={filteredUsers}
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
                  {filteredUsers.length === 0 ? (
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
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
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
                                <Dropdown
                                  overlay={
                                    <Menu>
                                      <Menu.Item
                                        key="view"
                                        onClick={() => handleViewUser(user)}
                                        title={`View ${user.name || "user"}`}
                                      >
                                        <EyeOutlined
                                          style={{ marginRight: 8 }}
                                        />
                                        View User
                                      </Menu.Item>
                                      <Menu.Item
                                        key="edit"
                                        onClick={() => handleEditUser(user)}
                                        title={`Edit ${user.name || "user"}`}
                                      >
                                        <EditOutlined
                                          style={{ marginRight: 8 }}
                                        />
                                        Edit User
                                      </Menu.Item>
                                      <Menu.Item
                                        key="inactive"
                                        onClick={() =>
                                          handleInactiveUser(user.userId)
                                        }
                                        disabled={isInactivating}
                                        title={`Mark ${
                                          user.name || "user"
                                        } as inactive`}
                                      >
                                        <StopOutlined
                                          style={{ marginRight: 8 }}
                                        />
                                        Inactive User
                                      </Menu.Item>
                                      <Menu.Item
                                        key="report"
                                        onClick={() =>
                                          handleReportUser(user.userId)
                                        }
                                        disabled={isReporting}
                                        title={`Report ${user.name || "user"}`}
                                      >
                                        <ExclamationCircleOutlined
                                          style={{ marginRight: 8 }}
                                        />
                                        Report User
                                      </Menu.Item>
                                      <Menu.Item
                                        key="delete"
                                        onClick={() =>
                                          handleDeleteUser(user.userId)
                                        }
                                        disabled={isDeleting}
                                        style={{ color: "#ff4d4f" }}
                                        title={`Delete ${user.name || "user"}`}
                                      >
                                        <DeleteOutlined
                                          style={{ marginRight: 8 }}
                                        />
                                        Delete User
                                      </Menu.Item>
                                    </Menu>
                                  }
                                  trigger={["click"]}
                                  placement="bottomRight"
                                >
                                  <Button
                                    type="text"
                                    icon={<MoreOutlined />}
                                    aria-label={`More actions for ${
                                      user.name || "user"
                                    }`}
                                  />
                                </Dropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {totalUsers > itemsPerPage && (
                        <div className="pagination-section mt-4 d-flex justify-content-end">
                          <Pagination
                            current={currentPage}
                            pageSize={itemsPerPage}
                            total={totalUsers}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                            showQuickJumper
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
