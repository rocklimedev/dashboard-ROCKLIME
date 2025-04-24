import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetRolesQuery } from "../../api/rolesApi"; // Removed useCreateRoleMutation
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import PermissionsTable from "./PermissionsTable";
import AddRoleModal from "./AddRoleModal";

const RolePermission = () => {
  const { data: roles, isLoading, isError } = useGetRolesQuery();
  const {
    data: permissionsData,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useGetAllPermissionsQuery();
  const [showModal, setShowModal] = useState(false);

  const handleOpenRoleModal = () => {
    setShowModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowModal(false);
  };

  const permissions = Array.isArray(permissionsData?.permissions)
    ? permissionsData.permissions
    : [];

  if (isLoading || isPermissionsLoading) return <div>Loading...</div>;
  if (isError || isPermissionsError) return <div>Error loading data!</div>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Roles & Permissions"
          subtitle="Manage your Roles & Permissions"
          onAdd={handleOpenRoleModal}
        />

        <div className="card">
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
        <PermissionsTable permissions={permissions} />

        <AddRoleModal show={showModal} onClose={handleCloseRoleModal} />
      </div>
    </div>
  );
};

export default RolePermission;
