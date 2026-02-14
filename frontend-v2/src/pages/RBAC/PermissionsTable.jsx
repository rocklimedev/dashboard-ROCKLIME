import React, { useMemo, useState } from "react";

const PermissionsTable = ({ permissions, searchTerm, sortBy }) => {
  // State to track the selected module filter
  const [selectedModule, setSelectedModule] = useState("All");

  // Group permissions by status (optional, as status is not present in provided data)
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

  // Get unique module names for filter buttons
  const moduleNames = useMemo(() => {
    const modules = [...new Set(permissions.map((perm) => perm.module))];
    return ["All", ...modules.sort()];
  }, [permissions]);

  // Filtered and sorted permissions
  const filteredPermissions = useMemo(() => {
    let allPermissions = groupedPermissions["All"];

    // Apply module filter
    if (selectedModule !== "All") {
      allPermissions = allPermissions.filter(
        (perm) => perm.module === selectedModule
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      allPermissions = allPermissions.filter(
        (perm) =>
          perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply global sorting
    switch (sortBy) {
      case "Ascending":
        allPermissions = [...allPermissions].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;
      case "Descending":
        allPermissions = [...allPermissions].sort((a, b) =>
          b.name.localeCompare(b.name)
        );
        break;
      case "Recently Added":
        allPermissions = [...allPermissions].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        break;
    }

    // Group by module for display
    return allPermissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
  }, [groupedPermissions, searchTerm, sortBy, selectedModule]);

  // Get all module keys for rendering (no pagination)
  const moduleKeys = useMemo(() => {
    return Object.keys(filteredPermissions).sort();
  }, [filteredPermissions]);

  return (
    <div className="permissions-table-container">
      {/* Module Filter Buttons */}
      <div className="module-filter mb-4">
        {moduleNames.map((module) => (
          <button
            key={module}
            className={`btn btn-sm ${
              selectedModule === module ? "btn-primary" : "btn-outline-primary"
            } me-2 mb-2 rounded-3`}
            onClick={() => setSelectedModule(module)}
            aria-pressed={selectedModule === module}
            aria-label={`Filter by ${module} module`}
          >
            {module}
          </button>
        ))}
      </div>

      {/* Permissions Table */}
      <div className="card border-0 rounded-3 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th scope="col" className="ps-4">
                    Module
                  </th>
                  <th scope="col">Route</th>
                  <th scope="col">Name</th>
                  <th scope="col">API</th>
                </tr>
              </thead>
              <tbody>
                {moduleKeys.length > 0 ? (
                  moduleKeys.map((module) => (
                    <React.Fragment key={module}>
                      <tr className="table-active bg-primary bg-opacity-10">
                        <td colSpan="4" className="ps-4">
                          <strong>{module}</strong>
                        </td>
                      </tr>
                      {filteredPermissions[module].map((permission) => (
                        <tr key={permission.permissionId}>
                          <td className="ps-4">{permission.module}</td>
                          <td>{permission.route}</td>
                          <td>{permission.name}</td>
                          <td>{permission.api}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      No permissions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsTable;
