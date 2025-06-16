import React, { useState, useMemo } from "react";

const PermissionsTable = ({ permissions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("All"); // Track selected module

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  // Get unique modules for tags
  const modules = useMemo(() => {
    return ["All", ...Object.keys(groupedPermissions).sort()];
  }, [groupedPermissions]);

  // Filtered Permissions based on selected module and search input
  const filteredPermissions = useMemo(() => {
    let filtered = {};

    // If "All" is selected, include all modules; otherwise, include only the selected module
    const modulesToFilter =
      selectedModule === "All"
        ? Object.keys(groupedPermissions)
        : [selectedModule];

    modulesToFilter.forEach((module) => {
      if (groupedPermissions[module]) {
        const filteredPerms = groupedPermissions[module].filter(
          (perm) =>
            perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perm.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perm.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredPerms.length) {
          filtered[module] = filteredPerms;
        }
      }
    });

    return filtered;
  }, [searchTerm, selectedModule, groupedPermissions]);

  // Handle module tag click
  const handleModuleClick = (module) => {
    setSelectedModule(module);
  };

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
        {/* Search Input */}
        <div className="search-set">
          <div className="search-input">
            <input
              type="text"
              className="form-control"
              placeholder="Search by module, route, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="btn-searchset">
              <i className="ti ti-search fs-14 feather-search"></i>
            </span>
          </div>
        </div>
      </div>

      {/* Module Tags */}
      <div className="module-tags d-flex flex-wrap gap-2 p-3">
        {modules.map((module) => (
          <span
            key={module}
            className={`badge module-tag ${
              selectedModule === module ? "badge-primary" : "badge-secondary"
            }`}
            onClick={() => handleModuleClick(module)}
            style={{ cursor: "pointer" }}
          >
            {module}
          </span>
        ))}
      </div>

      <div className="cm-table-wrapper">
        <table className="cm-table">
          <thead>
            <tr>
              <th className="no-sort">
                <div className="form-check form-check-md">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="select-all"
                  />
                </div>
              </th>
              <th>Route</th>
              <th>Name</th>
              <th>API</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(filteredPermissions).length ? (
              Object.entries(filteredPermissions).map(([module, perms]) => (
                <React.Fragment key={module}>
                  {/* Module Header */}
                  <tr className="table-active">
                    <td colSpan="5">
                      <strong>{module}</strong>
                    </td>
                  </tr>
                  {/* Module Permissions */}
                  {perms.map((permission) => (
                    <tr key={permission.permissionId}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>{permission.route}</td>
                      <td>{permission.name}</td>
                      <td>{permission.api}</td>
                      <td>
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionsTable;
