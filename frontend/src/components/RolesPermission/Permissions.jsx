import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Form, Spinner, Alert } from "react-bootstrap";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import { MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button } from "antd";
import { toast } from "sonner";
import PageHeader from "../Common/PageHeader";
import DataTablePagination from "../Common/DataTablePagination";
import { rolePermissionsApi as api } from "../../api/rolePermissionApi";
import "./permission.css";
import { useGetRoleQuery } from "../../api/rolesApi";
import { useGetAllRolePermissionsByRoleIdQuery } from "../../api/rolePermissionApi";
import { useAssignPermissionToRoleMutation } from "../../api/rolePermissionApi";
import { useRemovePermissionFromRoleMutation } from "../../api/permissionApi";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
const Permissions = () => {
  const { id: roleId } = useParams();
  const dispatch = useDispatch();

  // Queries
  const {
    data: roleData,
    isLoading: isRoleLoading,
    error: roleError,
  } = useGetRoleQuery(roleId);
  const {
    data: rolePermissionsData,
    isLoading: isRolePermissionsLoading,
    error: rolePermissionsError,
  } = useGetAllRolePermissionsByRoleIdQuery(roleId, {
    skip: !roleId,
    refetchOnMountOrArgChange: false,
  });
  const {
    data: permissionsData,
    isLoading: isPermissionsLoading,
    error: permissionsError,
  } = useGetAllPermissionsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  // Mutations
  const [assignPermission, { isLoading: isAssigning }] =
    useAssignPermissionToRoleMutation();
  const [removePermission, { isLoading: isRemoving }] =
    useRemovePermissionFromRoleMutation();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [isUpdating, setIsUpdating] = useState(false);

  // Data assignments
  const permissions = Array.isArray(permissionsData?.permissions)
    ? permissionsData.permissions
    : [];
  const roleName = roleData?.roleName || "Unknown Role";
  const assignedPermissions = rolePermissionsData?.rolePermissions || [];

  // Memoized data
  const permissionTypes = useMemo(() => {
    return [...new Set(permissions.map((p) => p.api))];
  }, [permissions]);

  const modules = useMemo(() => {
    return [...new Set(permissions.map((p) => p.module))];
  }, [permissions]);

  const routeLookup = useMemo(() => {
    const lookup = {};
    permissions.forEach((perm) => {
      if (!lookup[perm.module]) {
        lookup[perm.module] = {};
      }
      lookup[perm.module][perm.api] = {
        route: perm.route || "No route",
        permissionId: perm.permissionId,
      };
    });
    return lookup;
  }, [permissions]);

  // Memoized grouped permissions for tabs
  const groupedPermissions = useMemo(() => {
    const groups = { All: modules };
    groups["Assigned"] = modules.filter((module) =>
      permissionTypes.some((type) =>
        assignedPermissions.some(
          (rp) => rp.permissionId === routeLookup[module]?.[type]?.permissionId
        )
      )
    );
    groups["Unassigned"] = modules.filter((module) =>
      permissionTypes.every(
        (type) =>
          !assignedPermissions.some(
            (rp) =>
              rp.permissionId === routeLookup[module]?.[type]?.permissionId
          )
      )
    );
    return groups;
  }, [modules, permissionTypes, assignedPermissions, routeLookup]);

  // Filtered modules
  const filteredModules = useMemo(() => {
    let result = groupedPermissions[activeTab] || [];
    if (searchTerm.trim()) {
      result = result.filter((module) =>
        module.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [groupedPermissions, activeTab, searchTerm]);

  // Paginated modules
  const paginatedModules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredModules.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredModules, currentPage]);

  // Handle permission change
  const handlePermissionChange = async (module, type, isChecked) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const permissionId = routeLookup[module]?.[type]?.permissionId;
      if (!permissionId) {
        throw new Error(`Permission ID not found for ${module} - ${type}`);
      }

      if (isChecked) {
        await assignPermission({
          roleId,
          permissionId,
          isGranted: true,
        }).unwrap();
        toast.success(
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } permission assigned successfully.`
        );
      } else {
        await removePermission({
          roleId,
          permissionId,
        }).unwrap();
        toast.success(
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } permission removed successfully.`
        );
      }

      dispatch(
        api.util.invalidateTags([{ type: "RolePermissions", id: roleId }])
      );
    } catch (error) {
      toast.error(`Failed to update ${type} permission for ${module}.`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handlers
  const clearFilters = () => {
    setSearchTerm("");
    setActiveTab("All");
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getCheckboxClass = (isGranted) => {
    return isGranted ? "badge bg-success" : "badge bg-warning";
  };

  // Loading and error states
  const isLoading =
    isRoleLoading || isRolePermissionsLoading || isPermissionsLoading;
  const hasError = roleError || rolePermissionsError || permissionsError;

  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <Spinner
              animation="border"
              variant="primary"
              role="status"
              aria-label="Loading data"
            />
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !roleId) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert variant="danger" role="alert">
              Error loading data:{" "}
              {JSON.stringify(hasError) || "Invalid role ID"}. Please try again.
            </Alert>
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
            title="Permissions"
            subtitle={`Manage permissions for the ${roleName} role.`}
            tableData={paginatedModules}
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
                    {Object.keys(groupedPermissions).map((status) => (
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
                          {status} ({groupedPermissions[status].length})
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
                      placeholder="Search Modules"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search modules"
                    />
                  </div>
                  <button
                    className="btn btn-outline-secondary ms-2"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                  <Link
                    to="/roles-permission/list"
                    className="btn btn-secondary ms-2"
                  >
                    <FaArrowLeft className="me-2" /> Back to Roles & Permissions
                  </Link>
                </div>
              </div>
            </div>
            <div className="tab-content" id="pills-tabContent">
              {Object.entries(groupedPermissions).map(([status, list]) => (
                <div
                  className={`tab-pane fade ${
                    activeTab === status ? "show active" : ""
                  }`}
                  id={`pills-${status}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${status}`}
                  key={status}
                >
                  {filteredModules.length === 0 ? (
                    <p className="text-muted">
                      No {status.toLowerCase()} modules match the applied
                      filters
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Module</th>
                            {permissionTypes.map((type) => (
                              <th key={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </th>
                            ))}
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedModules.map((module) => (
                            <tr key={module}>
                              <td>{module}</td>
                              {permissionTypes.map((type) => {
                                const isGranted = assignedPermissions.some(
                                  (rp) =>
                                    rp.permissionId ===
                                    routeLookup[module]?.[type]?.permissionId
                                );
                                return (
                                  <td key={type}>
                                    <span
                                      className={getCheckboxClass(isGranted)}
                                      onClick={() =>
                                        handlePermissionChange(
                                          module,
                                          type,
                                          !isGranted
                                        )
                                      }
                                      style={{
                                        cursor: isUpdating
                                          ? "not-allowed"
                                          : "pointer",
                                      }}
                                      aria-label={`${
                                        isGranted ? "Remove" : "Assign"
                                      } ${type} permission for ${module}`}
                                    >
                                      {isGranted ? "Assigned" : "Unassigned"}
                                    </span>
                                  </td>
                                );
                              })}
                              <td>
                                <Dropdown
                                  overlay={
                                    <Menu>
                                      {permissionTypes.map((type) => {
                                        const isGranted =
                                          assignedPermissions.some(
                                            (rp) =>
                                              rp.permissionId ===
                                              routeLookup[module]?.[type]
                                                ?.permissionId
                                          );
                                        return (
                                          <Menu.Item
                                            key={type}
                                            onClick={() =>
                                              handlePermissionChange(
                                                module,
                                                type,
                                                !isGranted
                                              )
                                            }
                                            disabled={isUpdating}
                                          >
                                            {isGranted ? "Remove" : "Assign"}{" "}
                                            {type.charAt(0).toUpperCase() +
                                              type.slice(1)}
                                          </Menu.Item>
                                        );
                                      })}
                                    </Menu>
                                  }
                                  trigger={["click"]}
                                  placement="bottomRight"
                                >
                                  <Button
                                    type="text"
                                    icon={<MoreOutlined />}
                                    aria-label={`More actions for module ${module}`}
                                  />
                                </Dropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="pagination-section mt-4">
                        <DataTablePagination
                          totalItems={filteredModules.length}
                          itemNo={itemsPerPage}
                          onPageChange={handlePageChange}
                          currentPage={currentPage}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Permissions);
