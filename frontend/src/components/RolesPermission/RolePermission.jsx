import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useGetAllPermissionsQuery } from "../../api/permissionApi";
import PermissionsTable from "./PermissionsTable";
import AddRoleModal from "./AddRoleModal";
import DeleteModal from "../Common/DeleteModal";
import { Tabs, Tab } from "react-bootstrap";

const RolePermission = () => {
  const { data: roles, isLoading, isError } = useGetRolesQuery();
  const {
    data: permissionsData,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useGetAllPermissionsQuery();

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("roles");

  // ✅ Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const handleOpenRoleModal = () => {
    setShowModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowModal(false);
  };

  // ✅ Delete modal handlers
  const handleOpenDeleteModal = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setSelectedRole(null);
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = (role) => {
    // TODO: Replace with your delete mutation logic (e.g. useDeleteRoleMutation)
    console.log("Deleting role:", role);
    setShowDeleteModal(false);
  };

  const permissions = Array.isArray(permissionsData?.permissions)
    ? permissionsData.permissions
    : [];

  if (isLoading || isPermissionsLoading) return <div>Loading...</div>;
  if (isError || isPermissionsError) return <div>Error loading data!</div>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          id="categories-keywords-tabs"
          className="mb-3"
        >
          <Tab eventKey="roles" title="Roles">
            <PageHeader
              title="Roles & Permissions"
              subtitle="Manage your Roles & Permissions"
              onAdd={handleOpenRoleModal}
            />

            <div className="cm-table-wrapper">
              <table className="cm-table">
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
                            onClick={(e) => {
                              e.preventDefault();
                              handleOpenDeleteModal(role);
                            }}
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
          </Tab>

          <Tab eventKey="permissions" title="Permissions">
            <PageHeader
              title="Permissions"
              subtitle="Manage your Permissions"
            />
            <PermissionsTable permissions={permissions} />
          </Tab>
        </Tabs>

        {/* ✅ Modals */}
        <AddRoleModal show={showModal} onClose={handleCloseRoleModal} />
        <DeleteModal
          item={selectedRole}
          itemType="Role"
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
};

export default RolePermission;
