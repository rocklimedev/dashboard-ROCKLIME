import React, { useState, useMemo } from "react";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import { FaSearch, FaShieldAlt, FaTrash } from "react-icons/fa";
import AddRoleModal from "./AddRoleModal";
import DeleteModal from "../Common/DeleteModal";
import PermissionsTable from "./PermissionsTable";
import DataTablePagination from "../Common/DataTablePagination";
import { toast } from "sonner";
import { useDeleteRoleMutation } from "../../api/rolesApi";
import PageHeader from "../Common/PageHeader";
// Placeholder for delete mutation (replace with actual import)

const RolePermission = () => {
  const { data: roles, isLoading, isError } = useGetRolesQuery();
  const {
    data: permissionsData,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useGetAllPermissionsQuery();
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

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((role) =>
        role.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
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

  // Paginated roles
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoles, currentPage]);

  // Filtered and sorted permissions
  const filteredPermissions = useMemo(() => {
    let result = permissions;

    // Apply search filter
    if (searchTerm.trim() && activeTab === "permissions") {
      result = result.filter((perm) =>
        perm.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        // Assume permissions have no createdAt; default to no sorting
        break;
      default:
        break;
    }

    return result;
  }, [permissions, searchTerm, sortBy, activeTab]);

  // Paginated permissions
  const paginatedPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPermissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPermissions, currentPage]);

  // Calculate stats for roles
  const roleStats = useMemo(
    () => ({
      totalRoles: rolesList.length,
      active: groupedRoles.Active.length,
      inactive: groupedRoles.Inactive.length,
    }),
    [rolesList, groupedRoles]
  );

  // Calculate stats for permissions
  const permissionStats = useMemo(
    () => ({
      totalPermissions: permissions.length,
    }),
    [permissions]
  );

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
      toast.success("Role deleted successfully!");
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
    toast.info("Filters cleared!");
  };

  if (isLoading || isPermissionsLoading) {
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

  if (isError || isPermissionsError) {
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
            subtitle="Manage your brands"
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRoles.map((role) => (
                          <tr key={role.roleId}>
                            <td>{role.roleName || "N/A"}</td>
                            <td className="action-column">
                              <div className="action-buttons d-flex gap-2">
                                <a
                                  href={`/roles-permission/permissions/${role.roleId}`}
                                  className="btn btn-icon btn-sm btn-outline-primary"
                                  aria-label={`View permissions for ${role.roleName}`}
                                >
                                  <FaShieldAlt />
                                </a>
                                <FaTrash
                                  className="btn btn-icon btn-sm btn-outline-warning"
                                  onClick={() => handleOpenDeleteModal(role)}
                                  disabled={isDeleting}
                                  aria-label={`Delete ${role.roleName}`}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
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
              {/* Permissions Tab */}
              <div
                className={`tab-pane fade ${
                  activeTab === "permissions" ? "show active" : ""
                }`}
                id="pills-permissions"
                role="tabpanel"
                aria-labelledby="tab-permissions"
              >
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
                  <button
                    className="btn btn-outline-secondary ms-2"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>

                {paginatedPermissions.length === 0 ? (
                  <p className="text-muted">
                    No permissions match the applied filters
                  </p>
                ) : (
                  <PermissionsTable
                    permissions={paginatedPermissions}
                    searchTerm={searchTerm}
                    sortBy={sortBy}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                )}
                {filteredPermissions.length > itemsPerPage && (
                  <div className="pagination-section mt-4">
                    <DataTablePagination
                      totalItems={filteredPermissions.length}
                      itemNo={itemsPerPage}
                      onPageChange={handlePageChange}
                      currentPage={currentPage}
                    />
                  </div>
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
