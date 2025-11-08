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

  // Data
  const permissions = Array.isArray(permissionsData?.permissions)
    ? permissionsData.permissions
    : [];
  const roleName = roleData?.roleName || "Unknown Role";
  const assignedPermissions = rolePermissionsData?.rolePermissions || [];

  /* ==================== VALID MODULES WITH API ONLY ==================== */
  const { validModules, permissionTypes, routeLookup } = useMemo(() => {
    const moduleMap = {};
    const types = new Set();
    const lookup = {};

    permissions.forEach((perm) => {
      const module = perm.module || "Uncategorized";
      const hasApi =
        perm.api && typeof perm.api === "string" && perm.api.trim() !== "";

      // SKIP if no valid api
      if (!hasApi) return;

      // Track module
      if (!moduleMap[module]) {
        moduleMap[module] = {};
      }
      moduleMap[module][perm.api] = true;

      // Track global types
      types.add(perm.api);

      // Build lookup
      if (!lookup[module]) {
        lookup[module] = {};
      }
      lookup[module][perm.api] = {
        permissionId: perm.permissionId,
        route: perm.route || "No route",
      };
    });

    // Only keep modules that have at least one valid permission
    const validModules = Object.keys(moduleMap);

    return {
      validModules,
      permissionTypes: Array.from(types),
      routeLookup: lookup,
    };
  }, [permissions]);

  /* ==================== FILTERED MODULES (SEARCH) ==================== */
  const filteredModules = useMemo(() => {
    if (!searchTerm.trim()) return validModules;
    return validModules.filter((module) =>
      module.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [validModules, searchTerm]);

  /* ==================== HANDLE PERMISSION CHANGE ==================== */
  const handlePermissionChange = async (module, type, isChecked) => {
    if (isUpdating || isAssigning || isRemoving) return;
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

  /* ==================== LOADING & ERROR STATES ==================== */
  const isLoading =
    isRoleLoading || isRolePermissionsLoading || isPermissionsLoading;
  const hasError = roleError || rolePermissionsError || permissionsError;

  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading permissions...</p>
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
              Error loading data. Please try again.
            </Alert>
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
            title="Permissions"
            subtitle={`Manage permissions for the ${roleName} role.`}
            tableData={filteredModules}
            exportOptions={{ pdf: false, excel: false }}
          />

          <div className="card-body">
            {/* Search & Back Button */}
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
                  <FaArrowLeft className="me-2" /> Back to Roles
                </Link>
              </div>
            </div>

            {/* No Modules Message */}
            {filteredModules.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">
                  {searchTerm
                    ? "No modules match your search."
                    : "No modules with API permissions available."}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "25%" }}>Module</th>
                      {permissionTypes.map((type) => (
                        <th key={type} className="text-center">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </th>
                      ))}
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModules.map((module) => (
                      <tr key={module}>
                        <td className="fw-medium text-capitalize">
                          {module.replace(/_/g, " ")}
                        </td>
                        {permissionTypes.map((type) => {
                          const isGranted = assignedPermissions.some(
                            (rp) =>
                              rp.permissionId ===
                              routeLookup[module]?.[type]?.permissionId
                          );
                          const isUpdatingThis =
                            isUpdating || isAssigning || isRemoving;

                          return (
                            <td key={type} className="text-center">
                              <span
                                className={`${getBadgeClass(
                                  isGranted
                                )} px-3 py-1 small`}
                                onClick={() =>
                                  !isUpdatingThis &&
                                  handlePermissionChange(
                                    module,
                                    type,
                                    !isGranted
                                  )
                                }
                                style={{
                                  cursor: isUpdatingThis
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: isUpdatingThis ? 0.7 : 1,
                                }}
                                aria-label={`${
                                  isGranted ? "Remove" : "Assign"
                                } ${type} permission`}
                              >
                                {isGranted ? "Assigned" : "Unassigned"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-center">
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
                                      disabled={
                                        isUpdating || isAssigning || isRemoving
                                      }
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
                              size="small"
                              icon={<MoreOutlined />}
                              disabled={isUpdating || isAssigning || isRemoving}
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
