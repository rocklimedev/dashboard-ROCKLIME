import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import {
  useGetRoleQuery,
  useGetRolePermissionsQuery,
} from "../../api/rolesApi";
import { FaArrowLeft } from "react-icons/fa";
import { useGetProfileQuery } from "../../api/userApi";
import { useAssignPermissionsToRoleMutation } from "../../api/rolesApi";
import { useUpdateRolePermissionsMutation } from "../../api/rolesApi";
import { useMemo } from "react";
const Permissions = () => {
  const { data: profileData, isLoading: isProfileLoading } =
    useGetProfileQuery();
  const roleId = profileData?.user?.roleId || null;

  const { data, isLoading, isError } = useGetAllPermissionsQuery();
  const {
    data: roleData,
    isLoading: isRoleLoading,
    isError: isRoleError,
  } = useGetRoleQuery(roleId, { skip: !roleId });
  const { data: rolePermissionsData, isLoading: isRolePermissionsLoading } =
    useGetRolePermissionsQuery(roleId, { skip: !roleId });

  const [assignPermission] = useAssignPermissionsToRoleMutation();
  const [updateRolePermissions] = useUpdateRolePermissionsMutation();

  const permissionTypes = ["view", "delete", "write", "edit", "export"];
  const permissions = Array.isArray(data?.permissions) ? data.permissions : [];
  const roleName = roleData?.role?.name || "Unknown Role";
  console.log(roleName);
  // Extract unique module names

  const modules = useMemo(() => {
    return [...new Set(permissions.map((p) => p.module))];
  }, [permissions]);

  // Get assigned permissions
  const assignedPermissions = rolePermissionsData?.permissions || [];

  // Create state for permissions
  const [permissionsByModule, setPermissionsByModule] = useState({});

  useEffect(() => {
    if (rolePermissionsData) {
      const permissionsMap = modules.reduce((acc, module) => {
        acc[module] = permissionTypes.reduce((perms, type) => {
          const isGranted = assignedPermissions.some(
            (p) => p.module === module && p.name === type && p.isGranted
          );
          perms[type] = isGranted;
          return perms;
        }, {});
        return acc;
      }, {});

      // Check before updating state to prevent unnecessary renders
      setPermissionsByModule((prev) =>
        JSON.stringify(prev) === JSON.stringify(permissionsMap)
          ? prev
          : permissionsMap
      );
    }
  }, [rolePermissionsData, modules, assignedPermissions]);

  const handlePermissionChange = async (module, type, isChecked) => {
    try {
      await assignPermission({
        roleId,
        permission: { module, name: type, isGranted: isChecked },
      });
      setPermissionsByModule((prev) => ({
        ...prev,
        [module]: { ...prev[module], [type]: isChecked },
      }));
    } catch (error) {
      console.error("Failed to assign permission:", error);
    }
  };

  const handleSavePermissions = async () => {
    try {
      const updatedPermissions = Object.entries(permissionsByModule).flatMap(
        ([module, perms]) =>
          Object.entries(perms).map(([name, isGranted]) => ({
            module,
            name,
            isGranted,
          }))
      );

      await updateRolePermissions({ roleId, permissions: updatedPermissions });
      alert("Permissions updated successfully!");
    } catch (error) {
      console.error("Error updating permissions:", error);
    }
  };

  if (isLoading || isRoleLoading || isRolePermissionsLoading)
    return <p>Loading...</p>;
  if (isError || isRoleError) return <p>Error loading data</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Permissions"
          subtitle="Manage your Permissions for this role."
        />
        <a href="/roles-permission/list" className="btn btn-secondary">
          <FaArrowLeft className="me-2" /> Back to Roles & Permissions
        </a>
        <div className="page-btn">
          <button
            className="btn btn-primary mt-3"
            onClick={handleSavePermissions}
          >
            Save Permissions
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="table-top mb-0">
              <div className="search-set">
                <div className="search-input">
                  <span className="btn-searchset">
                    <i className="ti ti-search fs-14 feather-search"></i>
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <p className="mb-0 fw-medium text-gray-9 me-1">Role:</p>
                <p>{roleData?.role?.roleName}</p>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">Modules</th>
                    {permissionTypes.map((type) => (
                      <th key={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissionsByModule).map(
                    ([module, perms]) => (
                      <tr key={module}>
                        <td className="text-gray-9">{module}</td>
                        {permissionTypes.map((type) => (
                          <td className="py-3" key={type}>
                            <div className="form-check form-check-md">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={perms[type] || false}
                                onChange={(e) =>
                                  handlePermissionChange(
                                    module,
                                    type,
                                    e.target.checked
                                  )
                                }
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Permissions;
