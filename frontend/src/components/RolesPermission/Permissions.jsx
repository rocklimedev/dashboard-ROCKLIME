import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import { useGetRoleQuery } from "../../api/rolesApi";
import {
  useAssignPermissionToRoleMutation,
  useRemovePermissionFromRoleMutation,
} from "../../api/rolePermissionApi";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify"; // Import toast from react-toastify
import "./permission.css";
import { useGetAllRolePermissionsByRoleIdQuery } from "../../api/rolePermissionApi";

// Add this import for ToastContainer
import { ToastContainer } from "react-toastify";

const Permissions = () => {
  const { id: roleId } = useParams();

  const {
    data: roleData,
    isLoading: isRoleLoading,
    isError: isRoleError,
  } = useGetRoleQuery(roleId);

  const { data: rolePermissionsData, isLoading: isRolePermissionsLoading } =
    useGetAllRolePermissionsByRoleIdQuery(roleId, { skip: !roleId });

  const { data, isLoading, isError } = useGetAllPermissionsQuery();

  const [assignPermission] = useAssignPermissionToRoleMutation();
  const [removePermission] = useRemovePermissionFromRoleMutation();

  const permissionTypes = ["view", "delete", "write", "edit", "export"];
  const permissions = Array.isArray(data?.permissions) ? data.permissions : [];
  const roleName = roleData?.roleName || "Unknown Role";

  const modules = useMemo(() => {
    return [...new Set(permissions.map((p) => p.module))];
  }, [permissions]);

  const assignedPermissions = rolePermissionsData?.rolePermissions || [];

  const [permissionsByModule, setPermissionsByModule] = useState({});

  const routeLookup = useMemo(() => {
    const lookup = {};
    permissions.forEach((perm) => {
      if (!lookup[perm.module]) {
        lookup[perm.module] = {};
      }
      lookup[perm.module][perm.name] = {
        route: perm.route || "No route",
        permissionId: perm.permissionId,
      };
    });
    return lookup;
  }, [permissions]);

  useEffect(() => {
    if (rolePermissionsData) {
      const permissionsMap = modules.reduce((acc, module) => {
        acc[module] = permissionTypes.reduce((perms, type) => {
          const permission = permissions.find(
            (p) => p.module === module && p.name === type
          );
          const isGranted = permission
            ? assignedPermissions.some(
                (p) => p.permissionId === permission.permissionId
              )
            : false;
          perms[type] = isGranted;
          return perms;
        }, {});
        return acc;
      }, {});
      setPermissionsByModule((prev) =>
        JSON.stringify(prev) === JSON.stringify(permissionsMap)
          ? prev
          : permissionsMap
      );
    }
  }, [rolePermissionsData, modules, assignedPermissions, permissions]);

  const handlePermissionChange = async (module, type, isChecked) => {
    try {
      const permissionId = routeLookup[module]?.[type]?.permissionId;
      if (!permissionId) throw new Error("Permission ID not found.");

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
        await removePermission({ roleId, permissionId }).unwrap();
        toast.success(
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } permission removed successfully.`
        );
      }

      setPermissionsByModule((prev) => ({
        ...prev,
        [module]: { ...prev[module], [type]: isChecked },
      }));
    } catch (error) {
      console.error("Error toggling permission:", error);
      toast.error("Failed to update permission.");
    }
  };

  const getCheckboxClass = (isGranted) => {
    return isGranted ? "checkbox-green" : "checkbox-yellow";
  };

  if (isLoading || isRoleLoading || isRolePermissionsLoading) {
    return <p>Loading...</p>;
  }

  if (isError || isRoleError || !roleId) {
    return <p>Error loading data or invalid role.</p>;
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Permissions"
          subtitle={`Manage permissions for the ${roleName} role.`}
        />
        <a href="/roles-permission/list" className="btn btn-secondary">
          <FaArrowLeft className="me-2" /> Back to Roles & Permissions
        </a>
        <div className="card mt-4">
          <div className="card-header">
            <div className="table-top mb-0 d-flex justify-content-between">
              <div className="search-set">
                <div className="search-input">
                  <span className="btn-searchset">
                    <i className="ti ti-search fs-14 feather-search"></i>
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <p className="mb-0 fw-medium text-gray-9 me-1">Role:</p>
                <p>{roleName}</p>
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
                        <td>{module}</td>
                        {permissionTypes.map((type) => (
                          <td key={type}>
                            <input
                              type="checkbox"
                              checked={perms[type]}
                              onChange={(e) =>
                                handlePermissionChange(
                                  module,
                                  type,
                                  e.target.checked
                                )
                              }
                              className={getCheckboxClass(perms[type])}
                            />
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
