import ListToolbar from '../../components/Common/ListToolbar';
import ListPagination from '../../components/Common/ListPagination';
import './UserList.styles.css';
import React, { useState, useMemo, useEffect } from 'react';
import { UnorderedListOutlined } from '@ant-design/icons';
import Avatar from 'react-avatar';
import {
  useGetAllUsersQuery,
  useReportUserMutation,
  useDeleteUserMutation,
  useUpdateStatusMutation,
  useGetUserByIdQuery,
} from '../../api/userApi';
import {
  EyeOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu, Button, Tooltip } from 'antd';
import DeleteModal from '../../components/Common/DeleteModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/Common/PageHeader';
import { useResendVerificationEmailMutation } from '../../api/authApi';

const UserList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const itemsPerPage = 20;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [resendUserId, setResendUserId] = useState(null);

  // === Queries & Mutations ===
  const { data, refetch } = useGetAllUsersQuery({
    page: currentPage,
    limit: itemsPerPage,
  });

  const users = data?.users || [];
  const totalUsers = data?.total || 0;
  const navigate = useNavigate();

  const [reportUser] = useReportUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [updateStatus] = useUpdateStatusMutation();
  const [resendVerificationEmail] = useResendVerificationEmailMutation();

  const { data: selectedUserData } = useGetUserByIdQuery(resendUserId, {
    skip: !resendUserId,
  });

  const selectedUser = selectedUserData?.data?.user || selectedUserData?.user || selectedUserData;

  // === Helpers ===
  const safeRoles = (roles) => (Array.isArray(roles) ? roles.join(', ') : '—');

  const isUserActive = (status) =>
    status === 'active' || status === 1 || status === '1' || status === true;

  // === Grouping & Filtering ===
  const groupedUsers = useMemo(
    () => ({
      All: users,
      Active: users.filter((u) => isUserActive(u.status)),
      Inactive: users.filter((u) => !isUserActive(u.status)),
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    let result = groupedUsers[activeTab] || [];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((user) =>
        [user.name, user.email, user.username, user.mobileNumber]
          .filter(Boolean)
          .some((field) => field?.toString().toLowerCase().includes(term)),
      );
    }

    return result;
  }, [groupedUsers, activeTab, searchTerm]);

  // === Handlers ===
  const handleViewUser = (user) => navigate(`/user/${user.userId}`);
  const handleEditUser = (user) => navigate(`/user/${user.userId}/edit`);

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateStatus({ userId, status: newStatus }).unwrap();
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(userToDelete).unwrap();
      toast.success('User deleted');

      if (filteredUsers.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Resend verification email
  useEffect(() => {
    if (resendUserId && selectedUser?.email) {
      resendVerificationEmail({ email: selectedUser.email })
        .unwrap()
        .then(() => toast.success('Verification email sent'))
        .catch(() => toast.error('Failed to send email'))
        .finally(() => setResendUserId(null));
    }
  }, [resendUserId, selectedUser, resendVerificationEmail]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Users"
          subtitle="Manage your users"
          onAdd={() => navigate('/user/add')}
        />

        <div className="card-body">
          {/* Filters & Controls */}
          <ListToolbar
            onClear={() => {
              setSearchTerm('');
              setActiveTab('All');
              setCurrentPage(1);
            }}
            exportTitle={'Users'}
            exportData={filteredUsers.map((u) => ({
              Name: u.name,
              Email: u.email,
              Username: u.username,
              Phone: u.mobileNumber,
              Roles: safeRoles(u.roles),
              Status: u.status,
            }))}
            search={{
              type: 'text',
              placeholder: 'Search users...',
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
            }}
            filters={[
              {
                key: 'status',
                type: 'custom',
                content: (
                  <div className="btn-group">
                    {Object.keys(groupedUsers).map((tab) => (
                      <button
                        key={tab}
                        className={`btn btn-sm ${
                          activeTab === tab ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab} ({groupedUsers[tab].length})
                      </button>
                    ))}
                  </div>
                ),
              },
            ]}
          />

          {/* LIST VIEW (Only View Now) */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const active = isUserActive(user.status);
                  return (
                    <tr key={user.userId}>
                      <td>
                        <Avatar
                          src={user.photo_thumbnail}
                          name={user.name || user.username}
                          size="40"
                          round
                        />
                      </td>
                      <td>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleViewUser(user);
                          }}
                          className="text-primary fw-medium"
                        >
                          {user.name || '—'}
                        </a>
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>{user.username || '—'}</td>
                      <td>
                        <span className="badge bg-light text-dark">{safeRoles(user.roles)}</span>
                      </td>
                      <td>
                        <Dropdown
                          overlay={
                            <Menu>
                              <Menu.Item
                                disabled={active}
                                onClick={() => handleStatusChange(user.userId, 'active')}
                              >
                                Active
                              </Menu.Item>
                              <Menu.Item
                                disabled={!active}
                                onClick={() => handleStatusChange(user.userId, 'inactive')}
                              >
                                Inactive
                              </Menu.Item>
                            </Menu>
                          }
                          trigger={['click']}
                        >
                          <span
                            className={`badge ${
                              active ? 'bg-success' : 'bg-danger'
                            } text-white cursor-pointer`}
                          >
                            {active ? 'Active' : 'Inactive'} <EditOutlined size={10} />
                          </span>
                        </Dropdown>
                      </td>
                      <td>
                        <Tooltip title="Edit">
                          <EditOutlined
                            className="me-3 text-primary fv2-userlist-4c5e59716b"

                            onClick={() => handleEditUser(user)}
                          />
                        </Tooltip>

                        <Dropdown
                          overlay={
                            <Menu>
                              <Menu.Item onClick={() => handleViewUser(user)}>
                                <EyeOutlined /> View
                              </Menu.Item>
                              <Menu.Item
                                onClick={() =>
                                  reportUser(user.userId)
                                    .unwrap()
                                    .then(() => toast.success('Reported'))
                                }
                              >
                                <ExclamationCircleOutlined /> Report
                              </Menu.Item>
                              {!user.isEmailVerified && (
                                <Menu.Item onClick={() => setResendUserId(user.userId)}>
                                  <MailOutlined /> Resend Email
                                </Menu.Item>
                              )}
                              <Menu.Item danger onClick={() => handleDeleteUser(user.userId)}>
                                <DeleteOutlined /> Delete
                              </Menu.Item>
                            </Menu>
                          }
                          trigger={['click']}
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined className="fv2-userlist-0fa68bfb43" />}
                          />
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalUsers > 0 && (
            <ListPagination
              itemLabel="users"
              current={currentPage}
              pageSize={itemsPerPage}
              total={totalUsers}
              onChange={setCurrentPage}
              showSizeChanger={false}
            />
          )}
        </div>

        {/* Delete Modal */}
        <DeleteModal
          isVisible={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          itemType="User"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default UserList;
