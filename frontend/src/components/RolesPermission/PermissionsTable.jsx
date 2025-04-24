import React, { useState, useMemo } from "react";

const PermissionsTable = ({ permissions }) => {
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filtered Permissions based on search input
  const filteredPermissions = useMemo(() => {
    return Object.keys(groupedPermissions).reduce((acc, module) => {
      const filtered = groupedPermissions[module].filter(
        (perm) =>
          perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length) acc[module] = filtered;
      return acc;
    }, {});
  }, [searchTerm, groupedPermissions]);

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
        {/* Search Input */}
        <div className="search-set">
          <div className="search-input">
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="btn-searchset">
              <i className="ti ti-search fs-14 feather-search"></i>
            </span>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table datatable">
            <thead className="thead-light">
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
                            <input
                              className="form-check-input"
                              type="checkbox"
                            />
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
                  <td colSpan="4" className="text-center">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PermissionsTable;
