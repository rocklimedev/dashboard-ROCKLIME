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
import AddRoleModal from "./AddRoleModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { message } from "antd";
import PageHeader from "../Common/PageHeader";

const RolePermission = () => {
  /* ==================== QUERIES ==================== */
  const { data: roles, isError: isRolesError } = useGetRolesQuery();
  const { data: permissionsData, isError: isPermissionsError } =
    useGetAllPermissionsQuery();
  const { data: users, isError: isUsersError } = useGetAllUsersQuery();

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  /* ==================== STATE ==================== */
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [roleStatus, setRoleStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ==================== DATA PREP ==================== */
  const rolesList = Array.isArray(roles) ? roles : [];
  const permissions = Array.isArray(permissionsData?.permissions)
    ? permissionsData.permissions
    : [];
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

  const validModulePermissions = useMemo(() => {
    const grouped = {};
    permissions.forEach((perm) => {
      const module = perm.module || "Uncategorized";
      const hasApi =
        perm.api && typeof perm.api === "string" && perm.api.trim() !== "";
      if (!hasApi) return;
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(perm);
    });
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, perms]) => perms.length > 0),
    );
  }, [permissions]);

  const availableModules = Object.keys(validModulePermissions).sort();

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
  if (isRolesError || isPermissionsError || isUsersError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div style={{ color: "#e31e24", fontWeight: 500 }}>
              Error loading data! Please try again later.
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
            title={
              activeTab === "roles" ? "Roles & Permissions" : "Permissions"
            }
            subtitle="Manage your roles and permissions"
            onAdd={handleOpenRoleModal}
            tableData={paginatedRoles}
            exportOptions={{ pdf: false, excel: false }}
          />

          <div className="card-body">
            {/* TAB SWITCHER */}
            <div className="d-flex align-items-center mb-4">
              <ul
                className="nav nav-pills border d-inline-flex p-1 rounded"
                id="pills-tab"
                role="tablist"
              >
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link btn btn-sm py-3 d-flex align-items-center justify-content-center ${
                      activeTab === "roles" ? "active" : ""
                    }`}
                    style={{
                      color: activeTab === "roles" ? "#e31e24" : "#595959",
                      borderColor:
                        activeTab === "roles" ? "#e31e24" : "transparent",
                    }}
                    onClick={() => {
                      setActiveTab("roles");
                      setSearchTerm("");
                      setSortBy("Recently Added");
                      setCurrentPage(1);
                    }}
                  >
                    Roles
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link btn btn-sm py-3 d-flex align-items-center justify-content-center ${
                      activeTab === "permissions" ? "active" : ""
                    }`}
                    style={{
                      color:
                        activeTab === "permissions" ? "#e31e24" : "#595959",
                      borderColor:
                        activeTab === "permissions" ? "#e31e24" : "transparent",
                    }}
                    onClick={() => {
                      setActiveTab("permissions");
                      setSearchTerm("");
                      setSortBy("Ascending");
                      setCurrentPage(1);
                    }}
                  >
                    Permissions
                  </button>
                </li>
              </ul>
            </div>

            <div className="tab-content" id="pills-tabContent">
              {/* ROLES TAB */}
              <div
                className={`tab-pane fade ${activeTab === "roles" ? "show active" : ""}`}
                id="pills-roles"
                role="tabpanel"
              >
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

              {/* PERMISSIONS TAB */}
              <div
                className={`tab-pane fade ${activeTab === "permissions" ? "show active" : ""}`}
                id="pills-permissions"
                role="tabpanel"
              >
                <div className="row mb-4">
                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <div
                        className="input-icon-start position-relative flex-fill"
                        style={{ maxWidth: "400px" }}
                      >
                        <span className="input-icon-addon">
                          <SearchOutlined style={{ color: "#595959" }} />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search permissions by name or route..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <button
                        className="btn btn-outline-secondary"
                        style={{ color: "#595959", borderColor: "#595959" }}
                        onClick={clearFilters}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {availableModules.length === 0 ? (
                  <div
                    className="text-center py-5"
                    style={{ color: "#595959" }}
                  >
                    <p className="mb-0">
                      No API permissions found in any module.
                    </p>
                  </div>
                ) : (
                  availableModules.map((module) => {
                    const modulePermissions = validModulePermissions[module];
                    const filtered = modulePermissions.filter(
                      (p) =>
                        p.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        p.route
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    );

                    if (filtered.length === 0) return null;

                    let sorted = [...filtered];
                    switch (sortBy) {
                      case "Ascending":
                        sorted.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                      case "Descending":
                        sorted.sort((a, b) => b.name.localeCompare(a.name));
                        break;
                      default:
                        break;
                    }

                    return (
                      <div key={module} className="mb-5">
                        <h5
                          style={{ color: "#e31e24" }}
                          className="mb-3 fw-semibold text-capitalize"
                        >
                          {module.replace(/_/g, " ")} ({sorted.length})
                        </h5>
                        <div className="table-responsive">
                          <table className="table table-hover table-sm align-middle">
                            <thead>
                              <tr>
                                <th style={{ width: "35%", color: "#595959" }}>
                                  Permission
                                </th>
                                <th style={{ width: "15%", color: "#595959" }}>
                                  API
                                </th>
                                <th style={{ width: "50%", color: "#595959" }}>
                                  Route
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sorted.map((perm) => (
                                <tr key={perm.permissionId}>
                                  <td
                                    style={{ color: "#595959" }}
                                    className="fw-medium"
                                  >
                                    {perm.name}
                                  </td>
                                  <td>
                                    <span
                                      style={{
                                        backgroundColor: "#e31e24",
                                        color: "white",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.85rem",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {perm.api.toUpperCase()}
                                    </span>
                                  </td>
                                  <td>
                                    <code
                                      style={{ color: "#595959" }}
                                      className="small"
                                    >
                                      {perm.route}
                                    </code>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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
