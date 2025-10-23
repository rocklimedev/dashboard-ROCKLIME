import React, { useState, useMemo } from "react";
import { useGetRolesQuery, useDeleteRoleMutation } from "../../api/rolesApi";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { FaSearch, FaShieldAlt, FaTrash } from "react-icons/fa";
import Avatar from "react-avatar";
import { Link } from "react-router-dom";
import AddRoleModal from "./AddRoleModal";
import DeleteModal from "../Common/DeleteModal";
import PermissionsTable from "./PermissionsTable";
import DataTablePagination from "../Common/DataTablePagination";
import { toast } from "sonner";
import PageHeader from "../Common/PageHeader";

const RolePermission = () => {
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

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [roleStatus, setRoleStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const rolesList = Array.isArray(roles) ? roles : [];
  const permissions = Array.isArray(permissionsData?.permissions)
    ? permissionsData.permissions
    : [];
  const usersList = Array.isArray(users?.users) ? users?.users : [];

  // Memoized user count per role
  const roleUserCounts = useMemo(() => {
    const counts = {};
    rolesList.forEach((role) => {
      counts[role.roleId] = usersList.filter(
        (user) => user.roleId === role.roleId
      ).length;
    });
    return counts;
  }, [rolesList, usersList]);

  // Memoized grouped roles for tab-based filtering
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

  // Filtered and sorted roles
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
          b.roleName.localeCompare(b.roleName)
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

  // Paginated roles
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoles, currentPage]);

  // Filtered and sorted permissions
  const filteredPermissions = useMemo(() => {
    let result = permissions;

    if (searchTerm.trim() && activeTab === "permissions") {
      result = result.filter((perm) =>
        perm.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        break;
      default:
        break;
    }

    return result;
  }, [permissions, searchTerm, sortBy, activeTab]);

  const handleOpenRoleModal = () => {
    setShowModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowModal(false);
  };

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
      toast.error("No role selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteRole(selectedRole.roleId).unwrap();
      if (paginatedRoles.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast.error(
        `Failed to delete role: ${error.data?.message || "Unknown error"}`
      );
    } finally {
      setShowDeleteModal(false);
      setSelectedRole(null);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setRoleStatus("All");
    setCurrentPage(1);
  };

  if (isRolesLoading || isPermissionsLoading || isUsersLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading data...</p>
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
              Error loading data!
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
            title={
              activeTab === "roles" ? "Roles & Permissions" : "Permissions"
            }
            subtitle="Manage your roles"
            onAdd={handleOpenRoleModal}
            tableData={paginatedRoles}
          />

          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <ul
                className="nav nav-pills border d-inline-flex p-1 rounded bg-light"
                id="pills-tab"
                role="tablist"
              >
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                      activeTab === "roles" ? "active" : ""
                    }`}
                    id="tab-roles"
                    data-bs-toggle="pill"
                    data-bs-target="#pills-roles"
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "roles"}
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
                    className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                      activeTab === "permissions" ? "active" : ""
                    }`}
                    id="tab-permissions"
                    data-bs-toggle="pill"
                    data-bs-target="#pills-permissions"
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "permissions"}
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
              {/* Roles Tab */}
              <div
                className={`tab-pane fade ${
                  activeTab === "roles" ? "show active" : ""
                }`}
                id="pills-roles"
                role="tabpanel"
                aria-labelledby="tab-roles"
              >
                <div className="row">
                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                      <div className="input-icon-start position-relative">
                        <span className="input-icon-addon">
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`Search ${
                            activeTab === "roles" ? "Roles" : "Permissions"
                          }`}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          aria-label={`Search ${
                            activeTab === "roles" ? "roles" : "permissions"
                          }`}
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
                {paginatedRoles.length === 0 ? (
                  <p className="text-muted">
                    No {roleStatus.toLowerCase()} roles match the applied
                    filters
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
                            (user) => user.roleId === role.roleId
                          );
                          return (
                            <tr key={role.roleId}>
                              <td>{role.roleName || "N/A"}</td>
                              <td>
                                {roleUsers.length === 0 ? (
                                  <span>No users assigned</span>
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
                                          "Unknown User"
                                        }
                                      >
                                        <Avatar
                                          name={
                                            user.name ||
                                            user.username ||
                                            user.email ||
                                            "Unknown"
                                          }
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
                                            "Unknown User"}
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
                                    aria-label={`View permissions for ${role.roleName}`}
                                  >
                                    <FaShieldAlt />
                                  </a>
                                  <FaTrash
                                    className="btn btn-icon btn-sm"
                                    onClick={() => handleOpenDeleteModal(role)}
                                    disabled={isDeleting}
                                    aria-label={`Delete ${role.roleName}`}
                                  />
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

              {/* Permissions Tab */}
              <div
                className={`tab-pane fade ${
                  activeTab === "permissions" ? "show active" : ""
                }`}
                id="pills-permissions"
                role="tabpanel"
                aria-labelledby="tab-permissions"
              >
                {filteredPermissions.length === 0 ? (
                  <p className="text-muted">
                    No permissions match the applied filters
                  </p>
                ) : (
                  <PermissionsTable
                    permissions={filteredPermissions}
                    searchTerm={searchTerm}
                    sortBy={sortBy}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

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
