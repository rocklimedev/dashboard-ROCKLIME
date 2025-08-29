import React, { useMemo, useState } from "react";
import DataTablePagination from "../Common/DataTablePagination";

const PermissionsTable = ({
  permissions,
  searchTerm,
  sortBy,
  currentPage,
  itemsPerPage,
  onPageChange,
}) => {
  // State to track the selected module filter
  const [selectedModule, setSelectedModule] = useState("All");

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

  // Get unique module names for filter buttons
  const moduleNames = useMemo(() => {
    const modules = Object.keys(moduleGroupedPermissions["All"]);
    return ["All", ...modules.sort()];
  }, [moduleGroupedPermissions]);

  // Filtered and sorted permissions
  const filteredPermissions = useMemo(() => {
    const status = "All"; // Use 'All' since parent RolePermission handles status filtering
    let allPermissions = groupedPermissions[status];

    // Apply module filter
    if (selectedModule !== "All") {
      allPermissions = allPermissions.filter(
        (perm) => perm.module === selectedModule
      );
    }

    // Apply search filter
    allPermissions = allPermissions.filter(
      (perm) =>
        perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply global sorting
    switch (sortBy) {
      case "Ascending":
        allPermissions.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Descending":
        allPermissions.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "Recently Added":
        allPermissions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        break;
    }

    // Group by module for display
    const grouped = allPermissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});

    return grouped;
  }, [searchTerm, sortBy, groupedPermissions, selectedModule]);

  // Paginated permissions
  const paginatedPermissions = useMemo(() => {
    const allPermissions = Object.values(filteredPermissions).flat();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allPermissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPermissions, currentPage, itemsPerPage]);

  // Calculate total permissions for pagination
  const totalPermissions = useMemo(() => {
    return Object.values(filteredPermissions).flat().length;
  }, [filteredPermissions]);

  // Group paginated permissions by module for display
  const paginatedGroupedPermissions = useMemo(() => {
    return paginatedPermissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
  }, [paginatedPermissions]);

  return (
    <div>
      {/* Module Filter Buttons */}
      <div className="module-filter mb-3">
        {moduleNames.map((module) => (
          <button
            key={module}
            className={`btn btn-sm ${
              selectedModule === module ? "btn-primary" : "btn-outline-primary"
            } me-2 mb-2`}
            onClick={() => {
              setSelectedModule(module);
              onPageChange(1); // Reset to first page when changing module
            }}
          >
            {module}
          </button>
        ))}
      </div>

      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Module</th>
              <th>Route</th>
              <th>Name</th>
              <th>API</th>
            </tr>
          </thead>
          <tbody>
            {totalPermissions > 0 ? (
              Object.entries(paginatedGroupedPermissions).map(
                ([module, perms]) => (
                  <React.Fragment key={module}>
                    <tr className="table-active">
                      <td colSpan="4">
                        <strong>{module}</strong>
                      </td>
                    </tr>
                    {perms.map((permission) => (
                      <tr key={permission.permissionId}>
                        <td>{permission.module}</td>
                        <td>{permission.route}</td>
                        <td>{permission.name}</td>
                        <td>{permission.api}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              )
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
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
