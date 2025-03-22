import React from "react";
import PageHeader from "../Common/PageHeader";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
const RolePermission = () => {
  const { data: roles, isLoading, isError } = useGetRolesQuery();
  const {
    data: permissionsData,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useGetAllPermissionsQuery();

  const permissions = Array.isArray(permissionsData?.permissions)
    ? permissionsData.permissions
    : [];

  console.log(permissions);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading roles!</div>;
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Roles & Permissions"
          subtitle="Manage your Roles & Permissions"
        />

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown">
                <a
                  href="javascript:void(0);"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Active
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Inactive
                    </a>
                  </li>
                </ul>
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
                    <th>Role</th>
                    <th>Created Date</th>

                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles?.map((role) => (
                    <tr key={role.roleId}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>{role.roleName}</td>
                      <td>{new Date(role.createdAt).toLocaleDateString()}</td>

                      <td>
                        <div className="action-icon d-inline-flex">
                          <a
                            href={`/roles-permission/permissions/${role.roleId}`}
                            className="me-2 d-flex align-items-center p-2 border rounded"
                          >
                            <i className="ti ti-shield"></i>
                          </a>

                          <a
                            href="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                            className="d-flex align-items-center p-2 border rounded"
                          >
                            <i className="ti ti-trash"></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <PageHeader title="Permissions" subtitle="Manage your Permissions" />

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown">
                <a
                  href="javascript:void(0);"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Active
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Inactive
                    </a>
                  </li>
                </ul>
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
                    <th>Module</th>
                    <th>Route</th>
                    <th>Name</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions?.map((permission) => (
                    <tr key={permission.permissionId}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>{permission.module}</td>
                      <td>{permission.route}</td>
                      <td>{permission.name}</td>
                      <td>
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermission;
