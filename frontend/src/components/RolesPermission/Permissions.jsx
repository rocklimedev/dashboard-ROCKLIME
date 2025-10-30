import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Spinner, Alert } from "react-bootstrap";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import { MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button } from "antd";
import { toast } from "sonner";
import PageHeader from "../Common/PageHeader";
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

  // Filtered modules based on search
  const filteredModules = useMemo(() => {
    if (!searchTerm.trim()) return modules;
    return modules.filter((module) =>
      module.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [modules, searchTerm]);

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
      } else {
        await removePermission({
          roleId,
          permissionId,
        }).unwrap();
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

  const getBadgeClass = (isGranted) => {
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
            <Spinner animation="border" variant="primary" />
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
            <Alert variant="danger">
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
            tableData={filteredModules}
            exportOptions={{ pdf: false, excel: false }}
          />
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-lg-6">
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
              </div>
              <div className="col-lg-6 text-lg-end">
                <Link to="/roles-permission/list" className="btn btn-secondary">
                  <FaArrowLeft className="me-2" /> Back to Roles & Permissions
                </Link>
              </div>
            </div>

            {filteredModules.length === 0 ? (
              <p className="text-muted">
                {searchTerm
                  ? "No modules match your search."
                  : "No modules available."}
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
                    {filteredModules.map((module) => (
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
                                className={getBadgeClass(isGranted)}
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
                                  const isGranted = assignedPermissions.some(
                                    (rp) =>
                                      rp.permissionId ===
                                      routeLookup[module]?.[type]?.permissionId
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Permissions);
