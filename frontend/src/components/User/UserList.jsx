import React, { useState, useMemo, useEffect } from "react";
import {
  SearchOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";
import Avatar from "react-avatar";
import {
  useGetAllUsersQuery,
  useReportUserMutation,
  useDeleteUserMutation,
  useUpdateStatusMutation,
  useGetUserByIdQuery,
} from "../../api/userApi";
import {
  EyeOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Dropdown, Menu, Button, Pagination, Tooltip } from "antd";
import DeleteModal from "../Common/DeleteModal";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import { useResendVerificationEmailMutation } from "../../api/authApi";

const UserList = () => {
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const itemsPerPage = 20;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [resendUserId, setResendUserId] = useState(null);

  // === Queries & Mutations ===
  const { data, refetch } = useGetAllUsersQuery({
    page: currentPage,
    limit: itemsPerPage,
  });

  const users = data?.users || [];
  const totalUsers = data?.total || 0;
  const navigate = useNavigate();

  const [reportUser] = useReportUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [updateStatus] = useUpdateStatusMutation();
  const [resendVerificationEmail] = useResendVerificationEmailMutation();

  const { data: selectedUserData } = useGetUserByIdQuery(resendUserId, {
    skip: !resendUserId,
  });

  const selectedUser =
    selectedUserData?.data?.user || selectedUserData?.user || selectedUserData;

  // === Helpers ===
  const safeRoles = (roles) => (Array.isArray(roles) ? roles.join(", ") : "—");

  const isUserActive = (status) =>
    status === "active" || status === 1 || status === "1" || status === true;

  // === Grouping & Filtering ===
  const groupedUsers = useMemo(
    () => ({
      All: users,
      Active: users.filter((u) => isUserActive(u.status)),
      Inactive: users.filter((u) => !isUserActive(u.status)),
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    let result = groupedUsers[activeTab] || [];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((user) =>
        [user.name, user.email, user.username, user.mobileNumber]
          .filter(Boolean)
          .some((field) => field?.toString().toLowerCase().includes(term))
      );
    }

    return result;
  }, [groupedUsers, activeTab, searchTerm]);

  // === Handlers ===
  const handleViewUser = (user) => navigate(`/user/${user.userId}`);
  const handleEditUser = (user) => navigate(`/user/${user.userId}/edit`);

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateStatus({ userId, status: newStatus }).unwrap();
      message.success("Status updated");
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(userToDelete).unwrap();
      message.success("User deleted");

      // Auto-fix pagination if last item on page was deleted
      if (filteredUsers.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch {
      message.error("Failed to delete user");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Resend verification email
  useEffect(() => {
    if (resendUserId && selectedUser?.email) {
      resendVerificationEmail({ email: selectedUser.email })
        .unwrap()
        .then(() => message.success("Verification email sent"))
        .catch(() => message.error("Failed to send email"))
        .finally(() => setResendUserId(null));
    }
  }, [resendUserId, selectedUser, resendVerificationEmail]);

  // === Render (No loading/error states — handled globally) ===
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Users"
            subtitle="Manage your users"
            onAdd={() => navigate("/user/add")}
          />

          <div className="card-body">
            {/* Filters & Controls */}
            <div className="row mb-4 align-items-center">
              <div className="col-lg-6">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <h6 className="mb-0">Status:</h6>
                  <div className="btn-group">
                    {Object.keys(groupedUsers).map((tab) => (
                      <button
                        key={tab}
                        className={`btn btn-sm ${
                          activeTab === tab
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab} ({groupedUsers[tab].length})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-6 text-lg-end">
                <div className="d-flex justify-content-end gap-2 flex-wrap">
                  <div className="input-group" style={{ maxWidth: "280px" }}>
                    <span className="input-group-text">
                      <SearchOutlined />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="btn-group">
                    <button
                      className={`btn ${
                        viewMode === "list"
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setViewMode("list")}
                      title="List View"
                    >
                      <UnorderedListOutlined />
                    </button>
                    <button
                      className={`btn ${
                        viewMode === "card"
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setViewMode("card")}
                      title="Card View"
                    >
                      <OrderedListOutlined />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD VIEW */}
            {viewMode === "card" && (
              <div className="row g-4">
                {filteredUsers.map((user) => {
                  const active = isUserActive(user.status);
                  return (
                    <div
                      key={user.userId}
                      className="col-md-6 col-lg-4 col-xl-3"
                    >
                      <div className="card h-100 shadow-sm border-0">
                        <div className="card-body text-center p-4">
                          <Avatar
                            src={user.photo_thumbnail}
                            name={user.name || user.username}
                            round
                            size="80"
                            className="mb-3"
                          />
                          <h6 className="mb-1">{user.name || "No Name"}</h6>
                          <p className="text-muted small">@{user.username}</p>

                          <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                            <span className="badge bg-light text-dark">
                              {safeRoles(user.roles)}
                            </span>
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item
                                    disabled={active}
                                    onClick={() =>
                                      handleStatusChange(user.userId, "active")
                                    }
                                  >
                                    Active
                                  </Menu.Item>
                                  <Menu.Item
                                    disabled={!active}
                                    onClick={() =>
                                      handleStatusChange(
                                        user.userId,
                                        "inactive"
                                      )
                                    }
                                  >
                                    Inactive
                                  </Menu.Item>
                                </Menu>
                              }
                              trigger={["click"]}
                            >
                              <span
                                className={`badge ${
                                  active ? "bg-success" : "bg-danger"
                                } text-white cursor-pointer`}
                              >
                                {active ? "Active" : "Inactive"}{" "}
                                <EditOutlined size={10} />
                              </span>
                            </Dropdown>
                          </div>

                          <div className="d-flex justify-content-center gap-2">
                            <Tooltip title="Edit">
                              <Button
                                size="small"
                                onClick={() => handleEditUser(user)}
                              >
                                <EditOutlined />
                              </Button>
                            </Tooltip>
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item
                                    onClick={() => handleViewUser(user)}
                                  >
                                    <EyeOutlined /> View
                                  </Menu.Item>

                                  <Menu.Item
                                    onClick={() =>
                                      reportUser(user.userId)
                                        .unwrap()
                                        .then(() => message.success("Reported"))
                                    }
                                  >
                                    <ExclamationCircleOutlined /> Report
                                  </Menu.Item>
                                  {!user.isEmailVerified && (
                                    <Menu.Item
                                      onClick={() =>
                                        setResendUserId(user.userId)
                                      }
                                    >
                                      <MailOutlined /> Resend Email
                                    </Menu.Item>
                                  )}
                                  <Menu.Item
                                    danger
                                    onClick={() =>
                                      handleDeleteUser(user.userId)
                                    }
                                  >
                                    <DeleteOutlined /> Delete
                                  </Menu.Item>
                                </Menu>
                              }
                              trigger={["click"]}
                            >
                              <Button size="small">
                                <MoreOutlined />
                              </Button>
                            </Dropdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Avatar</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Username</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const active = isUserActive(user.status);
                      return (
                        <tr key={user.userId}>
                          <td>
                            <Avatar
                              src={user.photo_thumbnail}
                              name={user.name || user.username}
                              size="40"
                              round
                            />
                          </td>
                          <td>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleViewUser(user);
                              }}
                              className="text-primary fw-medium"
                            >
                              {user.name || "—"}
                            </a>
                          </td>
                          <td>{user.email || "—"}</td>
                          <td>{user.username || "—"}</td>
                          <td>{user.mobileNumber || "—"}</td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {safeRoles(user.roles)}
                            </span>
                          </td>
                          <td>
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item
                                    disabled={active}
                                    onClick={() =>
                                      handleStatusChange(user.userId, "active")
                                    }
                                  >
                                    Active
                                  </Menu.Item>
                                  <Menu.Item
                                    disabled={!active}
                                    onClick={() =>
                                      handleStatusChange(
                                        user.userId,
                                        "inactive"
                                      )
                                    }
                                  >
                                    Inactive
                                  </Menu.Item>
                                </Menu>
                              }
                              trigger={["click"]}
                            >
                              <span
                                className={`badge ${
                                  active ? "bg-success" : "bg-danger"
                                } text-white cursor-pointer`}
                              >
                                {active ? "Active" : "Inactive"}{" "}
                                <EditOutlined size={10} />
                              </span>
                            </Dropdown>
                          </td>
                          <td>
                            <EditOutlined
                              className="me-3 text-primary"
                              style={{ cursor: "pointer", fontSize: 16 }}
                              onClick={() => handleEditUser(user)}
                            />
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item
                                    onClick={() => handleViewUser(user)}
                                  >
                                    <EyeOutlined /> View
                                  </Menu.Item>
                                  <Menu.Item
                                    onClick={() => reportUser(user.userId)}
                                  >
                                    <ExclamationCircleOutlined /> Report
                                  </Menu.Item>
                                  {!user.isEmailVerified && (
                                    <Menu.Item
                                      onClick={() =>
                                        setResendUserId(user.userId)
                                      }
                                    >
                                      <MailOutlined /> Resend
                                    </Menu.Item>
                                  )}
                                  <Menu.Item
                                    danger
                                    onClick={() =>
                                      handleDeleteUser(user.userId)
                                    }
                                  >
                                    <DeleteOutlined /> Delete
                                  </Menu.Item>
                                </Menu>
                              }
                              trigger={["click"]}
                            >
                              <Button
                                type="text"
                                icon={<MoreOutlined style={{ fontSize: 18 }} />}
                              />
                            </Dropdown>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalUsers > itemsPerPage && (
              <div className="d-flex justify-content-end mt-4">
                <Pagination
                  current={currentPage}
                  pageSize={itemsPerPage}
                  total={totalUsers}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Delete Modal */}
        <DeleteModal
          isVisible={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          itemType="User"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default UserList;
