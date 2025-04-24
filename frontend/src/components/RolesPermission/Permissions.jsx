import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import PageHeader from "../Common/PageHeader";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import { useGetRoleQuery } from "../../api/rolesApi";
import {
  useAssignPermissionToRoleMutation,
  useRemovePermissionFromRoleMutation,
  useGetAllRolePermissionsByRoleIdQuery,
} from "../../api/rolePermissionApi";
import { rolePermissionsApi as api } from "../../api/rolePermissionApi";
import { FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./permission.css";

const Permissions = () => {
  const { id: roleId } = useParams();
  const dispatch = useDispatch();

  console.log("Role ID:", roleId);

  const {
    data: roleData,
    isLoading: isRoleLoading,
    isError: isRoleError,
  } = useGetRoleQuery(roleId);

  const { data: rolePermissionsData, isLoading: isRolePermissionsLoading } =
    useGetAllRolePermissionsByRoleIdQuery(roleId, {
      skip: !roleId,
      refetchOnMountOrArgChange: false,
    });

  const { data, isLoading, isError } = useGetAllPermissionsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  console.log("Role Permissions Data:", rolePermissionsData);

  const permissions = Array.isArray(data?.permissions) ? data.permissions : [];
  const roleName = roleData?.roleName || "Unknown Role";
  const assignedPermissions = rolePermissionsData?.rolePermissions || [];

  console.log(
    "Permissions IDs:",
    permissions.map((p) => p.permissionId)
  );
  console.log(
    "Role Permissions IDs:",
    assignedPermissions.map((p) => p.permissionId)
  );

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

  const [permissionsByModule, setPermissionsByModule] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isUpdating || !rolePermissionsData || permissions.length === 0) {
      console.warn("Skipping permissionsByModule update:", {
        isUpdating,
        rolePermissionsData,
        permissions,
      });
      return;
    }

    console.log("useEffect dependencies:", {
      rolePermissionsData,
      permissions,
      modules,
      assignedPermissions,
      isUpdating,
    });

    const permissionsMap = modules.reduce((acc, module) => {
      acc[module] = permissionTypes.reduce((perms, type) => {
        const permission = permissions.find(
          (p) => p.module === module && p.api === type
        );
        const isGranted = permission
          ? assignedPermissions.some(
              (rp) => rp.permissionId === permission.permissionId
            )
          : false;
        perms[type] = isGranted;
        return perms;
      }, {});
      return acc;
    }, {});

    setPermissionsByModule((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(permissionsMap)) {
        console.log("Updating permissionsByModule:", permissionsMap);
        return permissionsMap;
      }
      return prev;
    });
  }, [
    rolePermissionsData,
    permissions,
    modules,
    assignedPermissions,
    isUpdating,
  ]);

  const [assignPermission] = useAssignPermissionToRoleMutation();
  const [removePermission] = useRemovePermissionFromRoleMutation();

  const handlePermissionChange = async (module, type, isChecked) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const permissionId = routeLookup[module]?.[type]?.permissionId;
      if (!permissionId) {
        throw new Error(`Permission ID not found for ${module} - ${type}`);
      }

      setPermissionsByModule((prev) => ({
        ...prev,
        [module]: { ...prev[module], [type]: isChecked },
      }));

      if (isChecked) {
        const result = await assignPermission({
          roleId,
          permissionId,
          isGranted: true,
        }).unwrap();
        console.log("Assign Permission Result:", result);
        dispatch(
          api.util.invalidateTags([{ type: "RolePermissions", id: roleId }])
        );
        toast.success(
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } permission assigned successfully.`
        );
      } else {
        const result = await removePermission({
          roleId,
          permissionId,
        }).unwrap();
        console.log("Remove Permission Result:", result);
        dispatch(
          api.util.invalidateTags([{ type: "RolePermissions", id: roleId }])
        );
        toast.success(
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } permission removed successfully.`
        );
      }
    } catch (error) {
      console.error("Error toggling permission:", error);
      toast.error(`Failed to update ${type} permission for ${module}.`);
      setPermissionsByModule((prev) => ({
        ...prev,
        [module]: { ...prev[module], [type]: !isChecked },
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  const getCheckboxClass = (isGranted) => {
    console.log(
      `Checkbox for isGranted=${isGranted}:`,
      isGranted ? "checkbox-green" : "checkbox-yellow"
    );
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
      <ToastContainer />
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
                    <th>Modules</th>
                    {permissionTypes.map((type) => (
                      <th key={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.length > 0 ? (
                    Object.entries(permissionsByModule).map(
                      ([module, perms]) => (
                        <tr key={module}>
                          <td>{module}</td>
                          {permissionTypes.map((type) => (
                            <td key={type}>
                              <input
                                type="checkbox"
                                checked={perms[type] || false}
                                onChange={(e) =>
                                  handlePermissionChange(
                                    module,
                                    type,
                                    e.target.checked
                                  )
                                }
                                className={`permission-checkbox ${getCheckboxClass(
                                  perms[type]
                                )}`}
                              />
                            </td>
                          ))}
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td colSpan={permissionTypes.length + 1}>
                        No permissions available
                      </td>
                    </tr>
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

export default React.memo(Permissions);
