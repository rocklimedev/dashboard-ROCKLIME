import React, { useMemo } from "react";
import { FaShieldAlt, FaTrash } from "react-icons/fa";
import DataTablePagination from "../Common/DataTablePagination";

const PermissionsTable = ({
  permissions,
  searchTerm,
  sortBy,
  currentPage,
  itemsPerPage,
  onPageChange,
}) => {
  // Group permissions by status
  const groupedPermissions = useMemo(() => {
    return {
      All: permissions,
      Active: permissions.filter(
        (perm) => perm.status?.toLowerCase() === "active"
      ),
      Inactive: permissions.filter(
        (perm) => perm.status?.toLowerCase() === "inactive"
      ),
    };
  }, [permissions]);

  // Group permissions by module within each status
  const moduleGroupedPermissions = useMemo(() => {
    const result = {};
    Object.keys(groupedPermissions).forEach((status) => {
      result[status] = groupedPermissions[status].reduce((acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      }, {});
    });
    return result;
  }, [groupedPermissions]);

  // Filtered permissions based on search and sort
  const filteredPermissions = useMemo(() => {
    const status = "All"; // Use 'All' since parent RolePermission handles status filtering
    const modules = moduleGroupedPermissions[status];
    let filtered = {};

    Object.keys(modules).forEach((module) => {
      const filteredPerms = modules[module].filter(
        (perm) =>
          perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredPerms.length) {
        filtered[module] = filteredPerms;
      }
    });

    // Apply sorting
    Object.keys(filtered).forEach((module) => {
      switch (sortBy) {
        case "Ascending":
          filtered[module].sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "Descending":
          filtered[module].sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "Recently Added":
          filtered[module].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        default:
          break;
      }
    });

    return filtered;
  }, [searchTerm, sortBy, moduleGroupedPermissions]);

  // Paginated permissions
  const paginatedPermissions = useMemo(() => {
    const allPermissions = Object.values(filteredPermissions)
      .flat()
      .sort((a, b) => {
        // Sort by module first, then apply existing sort within module
        const moduleCompare = a.module.localeCompare(b.module);
        if (moduleCompare !== 0) return moduleCompare;
        switch (sortBy) {
          case "Ascending":
            return a.name.localeCompare(b.name);
          case "Descending":
            return b.name.localeCompare(a.name);
          case "Recently Added":
            return new Date(b.createdAt) - new Date(a.createdAt);
          default:
            return 0;
        }
      });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return allPermissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPermissions, currentPage, itemsPerPage, sortBy]);

  // Calculate total permissions for pagination
  const totalPermissions = useMemo(() => {
    return Object.values(filteredPermissions).flat().length;
  }, [filteredPermissions]);

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Module</th>
              <th>Route</th>
              <th>Name</th>
              <th>API</th>
              <th>Created Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {totalPermissions > 0 ? (
              Object.entries(filteredPermissions).map(([module, perms]) => (
                <React.Fragment key={module}>
                  <tr className="table-active">
                    <td colSpan="6">
                      <strong>{module}</strong>
                    </td>
                  </tr>
                  {perms.map((permission) => (
                    <tr key={permission.permissionId}>
                      <td>{permission.module}</td>
                      <td>{permission.route}</td>
                      <td>{permission.name}</td>
                      <td>{permission.api}</td>
                      <td>
                        {permission.createdAt
                          ? new Date(permission.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            permission.status?.toLowerCase() === "active"
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {permission.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No permissions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPermissions > itemsPerPage && (
        <div className="pagination-section mt-4">
          <DataTablePagination
            totalItems={totalPermissions}
            itemNo={itemsPerPage}
            onPageChange={onPageChange}
            currentPage={currentPage}
          />
        </div>
      )}
    </div>
  );
};

export default PermissionsTable;
