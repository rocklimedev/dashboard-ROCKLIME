import React, { useState, useMemo } from "react";
import { useGetRolesQuery, useDeleteRoleMutation } from "../../api/rolesApi";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import {
  SearchOutlined,
  DeleteOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import Avatar from "react-avatar";
import { Link } from "react-router-dom";
import AddRoleModal from "../../components/RolesPermission/AddRoleModal";
import DeleteModal from "../../components/Common/DeleteModal";
import DataTablePagination from "../../components/Common/DataTablePagination";
import { message } from "antd";
import PageHeader from "../../components/Common/PageHeader";

const RolePermission = () => {
  /* ==================== QUERIES ==================== */
  const { data: roles, isError: isRolesError } = useGetRolesQuery();
  const { data: permissionsData } = useGetAllPermissionsQuery();
  const { data: users } = useGetAllUsersQuery();

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  /* ==================== STATE ==================== */
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [roleStatus, setRoleStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ==================== DATA PREP ==================== */
  const rolesList = Array.isArray(roles) ? roles : [];
  const usersList = Array.isArray(users?.users) ? users?.users : [];

  const roleUserCounts = useMemo(() => {
    const counts = {};
    rolesList.forEach((role) => {
      counts[role.roleId] = usersList.filter(
        (user) => user.roleId === role.roleId,
      ).length;
    });
    return counts;
  }, [rolesList, usersList]);

  const groupedRoles = useMemo(
    () => ({
      All: rolesList,
      Active: rolesList.filter(
        (role) => role.status?.toLowerCase() === "active",
      ),
      Inactive: rolesList.filter(
        (role) => role.status?.toLowerCase() === "inactive",
      ),
    }),
    [rolesList],
  );

  const filteredRoles = useMemo(() => {
    let result = groupedRoles[roleStatus] || [];

    if (searchTerm.trim()) {
      result = result.filter((role) =>
        role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          a.roleName.localeCompare(b.roleName),
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          b.roleName.localeCompare(a.roleName),
        );
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        break;
      default:
        break;
    }
    return result;
  }, [groupedRoles, roleStatus, searchTerm, sortBy]);

  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(start, start + itemsPerPage);
  }, [filteredRoles, currentPage]);

  /* ==================== HANDLERS ==================== */
  const handleOpenRoleModal = () => setShowModal(true);
  const handleCloseRoleModal = () => setShowModal(false);

  const handleOpenDeleteModal = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setSelectedRole(null);
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRole) {
      message.error("No role selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteRole(selectedRole.roleId).unwrap();
      if (paginatedRoles.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (error) {
      message.error(
        `Failed to delete role: ${error.data?.message || "Unknown error"}`,
      );
    } finally {
      setShowDeleteModal(false);
      setSelectedRole(null);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setRoleStatus("All");
    setCurrentPage(1);
  };

  /* ==================== ERROR STATE ==================== */
  if (isRolesError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div style={{ color: "#e31e24", fontWeight: 500 }}>
              Error loading roles! Please try again later.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==================== RENDER ==================== */
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Roles"
            subtitle="Manage user roles and permissions"
            onAdd={handleOpenRoleModal}
            tableData={paginatedRoles}
            exportOptions={{ pdf: false, excel: false }}
          />

          <div className="card-body">
            {/* Filters */}
            <div className="row mb-3">
              <div className="col-lg-12">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="input-icon-start position-relative">
                    <span className="input-icon-addon">
                      <SearchOutlined style={{ color: "#595959" }} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Roles"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-outline-secondary"
                    style={{ color: "#595959", borderColor: "#595959" }}
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {paginatedRoles.length === 0 ? (
              <p style={{ color: "#595959" }} className="text-center py-4">
                No roles match the applied filters.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{ color: "#595959" }}>Role</th>
                      <th style={{ color: "#595959" }}>Associated Users</th>
                      <th style={{ color: "#595959" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRoles.map((role) => {
                      const roleUsers = usersList.filter(
                        (u) => u.roleId === role.roleId,
                      );
                      return (
                        <tr key={role.roleId}>
                          <td style={{ color: "#595959" }}>
                            {role.roleName || "N/A"}
                          </td>
                          <td>
                            {roleUsers.length === 0 ? (
                              <span style={{ color: "#595959" }}>
                                No users assigned
                              </span>
                            ) : (
                              <div className="d-flex flex-wrap gap-2">
                                {roleUsers.map((user) => (
                                  <Link
                                    key={user.userId}
                                    to={`/user/${user.userId}`}
                                    className="d-flex align-items-center text-decoration-none"
                                    title={
                                      user.name ||
                                      user.username ||
                                      user.email ||
                                      "Unknown"
                                    }
                                  >
                                    <Avatar
                                      name={
                                        user.name ||
                                        user.username ||
                                        user.email ||
                                        "U"
                                      }
                                      src={user.photo_thumbnail}
                                      size="30"
                                      round={true}
                                      className="me-1"
                                    />
                                    <span
                                      style={{
                                        color: "#595959",
                                        maxWidth: "100px",
                                      }}
                                      className="text-truncate"
                                    >
                                      {user.name ||
                                        user.username ||
                                        user.email ||
                                        "Unknown"}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="action-column">
                            <div className="action-buttons d-flex gap-2">
                              <a
                                href={`/roles-permission/permissions/${role.roleId}`}
                                className="btn btn-icon btn-sm"
                                style={{ color: "#e31e24" }}
                                aria-label={`View permissions for ${role.roleName}`}
                              >
                                <SafetyOutlined />
                              </a>
                              <button
                                className="btn btn-icon btn-sm"
                                style={{ color: "#e31e24" }}
                                onClick={() => handleOpenDeleteModal(role)}
                                disabled={isDeleting}
                                aria-label={`Delete ${role.roleName}`}
                              >
                                <DeleteOutlined />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredRoles.length > itemsPerPage && (
                  <div className="pagination-section mt-4">
                    <DataTablePagination
                      totalItems={filteredRoles.length}
                      itemNo={itemsPerPage}
                      onPageChange={handlePageChange}
                      currentPage={currentPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MODALS */}
        <AddRoleModal show={showModal} onClose={handleCloseRoleModal} />

        {showDeleteModal && (
          <DeleteModal
            item={selectedRole}
            itemType="Role"
            isVisible={showDeleteModal}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            isLoading={isDeleting}
          />
        )}
      </div>
    </div>
  );
};

export default RolePermission;
