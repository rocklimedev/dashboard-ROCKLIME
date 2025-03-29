import React from "react";
import PageHeader from "../Common/PageHeader";
import { useGetRecentRoleToGiveQuery } from "../../api/rolesApi";
const GivePermission = () => {
  const { data, error, isLoading } = useGetRecentRoleToGiveQuery();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching roles</p>;

  const roles = Array.isArray(data?.roles) ? data.roles : [];

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader title="Role Permissions" subtitle="Manage permissions" />

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="search-input position-relative">
              <input
                type="text"
                className="form-control"
                placeholder="Search role..."
              />
              <span className="position-absolute top-50 end-0 translate-middle-y pe-3">
                <i className="ti ti-search fs-14 feather-search"></i>
              </span>
            </div>

            <div className="dropdown">
              <button
                className="btn btn-white btn-md dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Status
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <button className="dropdown-item rounded-1">Active</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Inactive</button>
                </li>
              </ul>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>
                      <input className="form-check-input" type="checkbox" />
                    </th>
                    <th>Role</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <tr key={role.id}>
                        <td>
                          <input className="form-check-input" type="checkbox" />
                        </td>
                        <td>{role.name}</td>
                        <td>{role.createdDate}</td>
                        <td>
                          <span
                            className={`badge ${
                              role.status === "Active"
                                ? "badge-success"
                                : "badge-danger"
                            }`}
                          >
                            <i className="ti ti-point-filled me-1"></i>
                            {role.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <a
                              href={`/roles-permission/permissions/${role.id}`}
                              className="p-2 border rounded d-flex align-items-center"
                            >
                              <i className="ti ti-shield"></i>
                            </a>
                            <button
                              className="p-2 border rounded d-flex align-items-center"
                              data-bs-toggle="modal"
                              data-bs-target="#edit-role"
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button
                              className="p-2 border rounded d-flex align-items-center"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No roles available
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

export default GivePermission;
