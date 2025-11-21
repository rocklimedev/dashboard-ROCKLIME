import React, { useState, useMemo } from "react";
import { useGetRolesQuery, useDeleteRoleMutation } from "../../api/rolesApi";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { FaSearch, FaShieldAlt, FaTrash } from "react-icons/fa";
import Avatar from "react-avatar";
import { Link } from "react-router-dom";
import AddRoleModal from "./AddRoleModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { message } from "antd";
import PageHeader from "../Common/PageHeader";

const RolePermission = () => {
  /* ==================== QUERIES ==================== */
  const {
    data: roles,
    isLoading: isRolesLoading,
    isError: isRolesError,
  } = useGetRolesQuery();

  const {
    data: permissionsData,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useGetAllPermissionsQuery();

  const {
    data: users,
    isLoading: isUsersLoading,
    isError: isUsersError,
  } = useGetAllUsersQuery();

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

  // User count per role
  const roleUserCounts = useMemo(() => {
    const counts = {};
    rolesList.forEach((role) => {
      counts[role.roleId] = usersList.filter(
        (user) => user.roleId === role.roleId
      ).length;
    });
    return counts;
  }, [rolesList, usersList]);

  // Grouped roles
  const groupedRoles = useMemo(
    () => ({
      All: rolesList,
      Active: rolesList.filter(
        (role) => role.status?.toLowerCase() === "active"
      ),
      Inactive: rolesList.filter(
        (role) => role.status?.toLowerCase() === "inactive"
      ),
    }),
    [rolesList]
  );

  /* ==================== PERMISSIONS: GROUP BY MODULE + VALID API ONLY ==================== */
  const validModulePermissions = useMemo(() => {
    const grouped = {};

    permissions.forEach((perm) => {
      const module = perm.module || "Uncategorized";
      const hasApi =
        perm.api && typeof perm.api === "string" && perm.api.trim() !== "";

      // SKIP if no valid api
      if (!hasApi) return;

      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(perm);
    });

    // Remove modules with no valid permissions
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, perms]) => perms.length > 0)
    );
  }, [permissions]);

  const availableModules = Object.keys(validModulePermissions).sort();

  /* ==================== ROLES: FILTER & SORT ==================== */
  const filteredRoles = useMemo(() => {
    let result = groupedRoles[roleStatus] || [];

    if (searchTerm.trim()) {
      result = result.filter((role) =>
        role.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          a.roleName.localeCompare(b.roleName)
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          b.roleName.localeCompare(a.roleName)
        );
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
        `Failed to delete role: ${error.data?.message || "Unknown error"}`
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

  /* ==================== HELPER: Badge Color ==================== */
  const getApiBadgeColor = (api) => {
    const method = api?.toLowerCase();
    if (["get", "view"].includes(method)) return "info";
    if (["post", "write", "create"].includes(method)) return "success";
    if (["put", "patch", "edit", "update"].includes(method)) return "warning";
    if (["delete"].includes(method)) return "danger";
    return "secondary";
  };

  /* ==================== LOADING / ERROR ==================== */
  if (isRolesLoading || isPermissionsLoading || isUsersLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isRolesError || isPermissionsError || isUsersError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
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
            {/* ==================== TAB SWITCHER ==================== */}
            <div className="d-flex align-items-center mb-4">
              <ul
                className="nav nav-pills border d-inline-flex p-1 rounded bg-light"
                id="pills-tab"
                role="tablist"
              >
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link btn btn-sm py-3 d-flex align-items-center justify-content-center ${
                      activeTab === "roles" ? "active" : ""
                    }`}
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
              {/* ==================== ROLES TAB ==================== */}
              <div
                className={`tab-pane fade ${
                  activeTab === "roles" ? "show active" : ""
                }`}
                id="pills-roles"
                role="tabpanel"
              >
                <div className="row mb-3">
                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <div className="input-icon-start position-relative">
                        <span className="input-icon-addon">
                          <FaSearch />
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
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>

                {paginatedRoles.length === 0 ? (
                  <p className="text-muted text-center py-4">
                    No roles match the applied filters.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>Associated Users</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRoles.map((role) => {
                          const roleUsers = usersList.filter(
                            (u) => u.roleId === role.roleId
                          );
                          return (
                            <tr key={role.roleId}>
                              <td>{role.roleName || "N/A"}</td>
                              <td>
                                {roleUsers.length === 0 ? (
                                  <span className="text-muted">
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
                                          src={user.photo_thumbnail} // Use avatar URL or fallback
                                          size="30"
                                          round={true}
                                          className="me-1"
                                        />
                                        <span
                                          className="text-truncate"
                                          style={{ maxWidth: "100px" }}
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
                                    className="btn btn-icon btn-sm text-primary"
                                    aria-label={`View permissions for ${role.roleName}`}
                                  >
                                    <FaShieldAlt />
                                  </a>
                                  <button
                                    className="btn btn-icon btn-sm text-danger"
                                    onClick={() => handleOpenDeleteModal(role)}
                                    disabled={isDeleting}
                                    aria-label={`Delete ${role.roleName}`}
                                  >
                                    <FaTrash />
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

              {/* ==================== PERMISSIONS TAB ==================== */}
              <div
                className={`tab-pane fade ${
                  activeTab === "permissions" ? "show active" : ""
                }`}
                id="pills-permissions"
                role="tabpanel"
              >
                {/* Search Bar */}
                <div className="row mb-4">
                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <div
                        className="input-icon-start position-relative flex-fill"
                        style={{ maxWidth: "400px" }}
                      >
                        <span className="input-icon-addon">
                          <FaSearch />
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
                        onClick={clearFilters}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Render ONLY modules with valid API permissions */}
                {availableModules.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <p className="mb-0">
                      No API permissions found in any module.
                    </p>
                  </div>
                ) : (
                  availableModules.map((module) => {
                    const modulePermissions = validModulePermissions[module];

                    // Apply search filter
                    const filtered = modulePermissions.filter(
                      (p) =>
                        p.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        p.route
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    );

                    if (filtered.length === 0) return null;

                    // Apply sort
                    let sorted = [...filtered];
                    switch (sortBy) {
                      case "Ascending":
                        sorted.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                      case "Descending":
                        sorted.sort((a, b) => b.name.localeCompare(a.name));
                        break;
                      case "Recently Added":
                      default:
                        break;
                    }

                    return (
                      <div key={module} className="mb-5">
                        <h5 className="mb-3 text-primary text-capitalize fw-semibold">
                          {module.replace(/_/g, " ")} ({sorted.length})
                        </h5>
                        <div className="table-responsive">
                          <table className="table table-hover table-sm align-middle">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: "35%" }}>Permission</th>
                                <th style={{ width: "15%" }}>API</th>
                                <th style={{ width: "50%" }}>Route</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sorted.map((perm) => (
                                <tr key={perm.permissionId}>
                                  <td className="fw-medium">{perm.name}</td>
                                  <td>
                                    <span
                                      className={`badge bg-${getApiBadgeColor(
                                        perm.api
                                      )} text-white`}
                                    >
                                      {perm.api.toUpperCase()}
                                    </span>
                                  </td>
                                  <td>
                                    <code className="small text-muted">
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

        {/* ==================== MODALS ==================== */}
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
