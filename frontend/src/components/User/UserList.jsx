import React, { useState, useMemo, useEffect } from "react";
import { FaSearch, FaPen } from "react-icons/fa"; // <-- add FaPen
import {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useReportUserMutation,
  useDeleteUserMutation,
  useUpdateStatusMutation, // <-- NEW
} from "../../api/userApi";
import {
  EyeOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Dropdown, Menu, Button, Pagination, Popover } from "antd";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import { useResendVerificationEmailMutation } from "../../api/authApi";

const UserList = () => {
  /* ----------------------- STATE ----------------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const itemsPerPage = 20;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [resendUserId, setResendUserId] = useState(null);

  /* ----------------------- QUERIES / MUTATIONS ----------------------- */
  const { data, error, isLoading, isFetching, refetch } = useGetAllUsersQuery({
    page: currentPage,
    limit: itemsPerPage,
  });

  const users = data?.users || [];
  const totalUsers = data?.total || 0;
  console.log(users);
  const navigate = useNavigate();

  const [reportUser, { isLoading: isReporting }] = useReportUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [resendVerificationEmail, { isLoading: isResending }] =
    useResendVerificationEmailMutation();

  // NEW mutation
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateStatusMutation();

  const {
    data: selectedUserData,
    isLoading: isUserLoading,
    error: userError,
  } = useGetUserByIdQuery(resendUserId, { skip: !resendUserId });

  const selectedUser =
    selectedUserData?.data?.user || selectedUserData?.user || selectedUserData;

  /* ----------------------- MEMOIZED VALUES ----------------------- */

  const groupedUsers = useMemo(
    () => ({
      All: users,
      Active: users.filter((u) => u.status === "active"),
      Inactive: users.filter((u) => u.status !== "active"),
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    let result = groupedUsers[activeTab] || [];

    if (searchTerm.trim()) {
      result = result.filter((user) =>
        [user.name, user.email, user.username, user.mobileNumber]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Descending":
        result = [...result].sort((a, b) => b.name.localeCompare(b.name));
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

  /* ----------------------- HANDLERS ----------------------- */
  const handleAddUser = () => navigate("/user/add");
  const handleEditUser = (user) => navigate(`/user/${user.userId}/edit`);
  const handleViewUser = (user) => navigate(`/user/${user.userId}`);

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleResendVerification = (userId) => setResendUserId(userId);

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete).unwrap();
      if (filteredUsers.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (err) {
      toast.error(
        `Failed to delete user: ${err.data?.message || "Unknown error"}`
      );
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleReportUser = async (userId) => {
    try {
      await reportUser(userId).unwrap();
    } catch (err) {
      toast.error(
        `Failed to report user: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  // NEW: change status via PATCH
  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateStatus({ userId, status: newStatus }).unwrap();
      toast.success(`User is now ${newStatus}`);
    } catch (err) {
      toast.error(
        `Failed to update status: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
  };

  /* ----------------------- RESEND VERIFICATION EFFECT ----------------------- */
  useEffect(() => {
    if (resendUserId && !isUserLoading) {
      if (userError) {
        toast.error(
          `Failed to fetch user: ${
            userError.data?.message || userError.message || "Unknown error"
          }`
        );
        setResendUserId(null);
        return;
      }

      if (!selectedUser?.email) {
        toast.error("Invalid or missing user email");
        setResendUserId(null);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(selectedUser.email)) {
        toast.error("Invalid email format");
        setResendUserId(null);
        return;
      }

      resendVerificationEmail({ email: selectedUser.email })
        .unwrap()
        .then(() => toast.success("Verification link sent successfully"))
        .catch((err) =>
          toast.error(
            `Failed to resend: ${err.data?.message || "Unknown error"}`
          )
        )
        .finally(() => setResendUserId(null));
    }
  }, [
    resendUserId,
    selectedUser,
    isUserLoading,
    userError,
    resendVerificationEmail,
  ]);

  /* ----------------------- RENDER ----------------------- */
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
            {/* ---------- FILTERS / TABS ---------- */}
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

            {/* ---------- TABLE ---------- */}
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
                  {filteredUsers.map((user) => {
                    const isActive = user.status === "active";

                    return (
                      <tr key={user.userId}>
                        <td>
                          <a onClick={() => handleViewUser(user)}>
                            {user.name || "N/A"}
                          </a>
                        </td>
                        <td>{user.email || "N/A"}</td>
                        <td>
                          <a onClick={() => handleViewUser(user)}>
                            {user.username || "N/A"}
                          </a>
                        </td>
                        <td>{user.mobileNumber || "N/A"}</td>
                        <td>{user.roles?.join(", ") || "N/A"}</td>

                        {/* ---- STATUS BADGE + PEN ---- */}
                        <td>
                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  key="active"
                                  disabled={isActive || isUpdatingStatus}
                                  onClick={() =>
                                    handleStatusChange(user.userId, "active")
                                  }
                                >
                                  Active
                                </Menu.Item>
                                <Menu.Item
                                  key="inactive"
                                  disabled={!isActive || isUpdatingStatus}
                                  onClick={() =>
                                    handleStatusChange(user.userId, "inactive")
                                  }
                                >
                                  Inactive
                                </Menu.Item>
                              </Menu>
                            }
                            trigger={["click"]}
                            placement="bottomLeft"
                          >
                            <span
                              className={`badge d-inline-flex align-items-center gap-1 cursor-pointer ${
                                isActive ? "badge-success" : "badge-danger"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                              <FaPen
                                className="ms-1"
                                style={{ fontSize: "0.85rem" }}
                              />
                            </span>
                          </Dropdown>
                        </td>

                        {/* ---- ACTIONS ---- */}
                        <td>
                          <EditOutlined
                            style={{ marginRight: 8, cursor: "pointer" }}
                            onClick={() => handleEditUser(user)}
                            title={`Edit ${user.name || "user"}`}
                          />

                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  key="view"
                                  onClick={() => handleViewUser(user)}
                                >
                                  <EyeOutlined style={{ marginRight: 8 }} />
                                  View User
                                </Menu.Item>

                                <Menu.Item
                                  key="report"
                                  onClick={() => handleReportUser(user.userId)}
                                  disabled={isReporting}
                                >
                                  <ExclamationCircleOutlined
                                    style={{ marginRight: 8 }}
                                  />
                                  Report User
                                </Menu.Item>

                                {!user.isEmailVerified && (
                                  <Menu.Item
                                    key="resend-verification"
                                    onClick={() =>
                                      handleResendVerification(user.userId)
                                    }
                                    disabled={
                                      isResending ||
                                      (resendUserId === user.userId &&
                                        isUserLoading)
                                    }
                                  >
                                    <MailOutlined style={{ marginRight: 8 }} />
                                    Resend Verification
                                  </Menu.Item>
                                )}

                                <Menu.Item
                                  key="delete"
                                  onClick={() => handleDeleteUser(user.userId)}
                                  disabled={isDeleting}
                                  style={{ color: "#ff4d4f" }}
                                >
                                  <DeleteOutlined style={{ marginRight: 8 }} />
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
                    );
                  })}
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
          </div>
        </div>

        {/* ----- DELETE MODAL ----- */}
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
