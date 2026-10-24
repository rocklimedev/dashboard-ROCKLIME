import ModalShell from '../Common/ModalShell';
import './AddNewTeam.styles.css';
import React, { useState, useEffect } from 'react';
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useGetTeamMembersQuery,
  useGetTeamByIdQuery,
} from '../../api/teamApi';
import { useGetAllUsersQuery, useGetUserByIdQuery } from '../../api/userApi';
import { Form, Input, Select, Button, List } from 'antd';
import { toast } from 'sonner';

const { Option } = Select;

const AddNewTeam = ({ onClose, onTeamAdded, team, visible }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  // === Data ===
  const { data: usersData } = useGetAllUsersQuery();
  const users = Array.isArray(usersData?.users) ? usersData.users : [];

  const { data: userDetails } = useGetUserByIdQuery(selectedUserId, {
    skip: !selectedUserId,
  });

  const { data: teamData } = useGetTeamByIdQuery(team?.id, { skip: !team?.id });
  const { data: teamMembersData } = useGetTeamMembersQuery(team?.id, {
    skip: !team?.id,
  });

  const [createTeam, { isLoading: creating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: updating }] = useUpdateTeamMutation();

  // === Initialize form on edit ===
  useEffect(() => {
    if (team && teamData?.team) {
      form.setFieldsValue({
        teamName: teamData.team.teamName || team.teamName || '',
        adminId: teamData.team.adminId || team.adminId || '',
      });

      const currentMembers =
        teamMembersData?.members?.map((m) => ({
          userId: m.userId,
          userName: m.userName,
          roleId: m.roleId,
          roleName: m.roleName || 'No Role',
        })) ||
        team.teammembers?.map((m) => ({
          userId: m.userId,
          userName: m.userName,
          roleId: m.roleId,
          roleName: m.roleName || 'No Role',
        })) ||
        [];

      setMembers(currentMembers);
    } else {
      form.resetFields();
      setMembers([]);
    }
  }, [team, teamData, teamMembersData, form]);

  // === Handlers ===
  const addMember = () => {
    if (!userDetails?.user) return;

    const alreadyAdded = members.some((m) => m.userId === selectedUserId);
    if (alreadyAdded) {
      toast.warning('User is already in the team');
      return;
    }

    setMembers((prev) => [
      ...prev,
      {
        userId: selectedUserId,
        userName: userDetails.user.username || userDetails.user.name,
        roleId: userDetails.user.roleId,
        roleName: userDetails.user.roles?.[0] || 'No Role',
      },
    ]);
    setSelectedUserId('');
  };

  const removeMember = (userId) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleSubmit = async (values) => {
    if (!members.length && !team) {
      toast.error('At least one team member is required');
      return;
    }

    const adminUser = users.find((u) => u.userId === values.adminId);
    if (!adminUser) {
      toast.error('Selected admin not found');
      return;
    }

    const payload = {
      teamName: values.teamName.trim(),
      adminId: values.adminId,
      adminName: adminUser.name || adminUser.username,
      members,
    };

    try {
      let teamId;
      if (team) {
        await updateTeam({ teamId: team.id, ...payload }).unwrap();
        teamId = team.id;
        toast.success('Team updated successfully');
      } else {
        const result = await createTeam(payload).unwrap();
        teamId = result.teamId || result.id;
        toast.success('Team created successfully');
      }

      form.resetFields();
      setMembers([]);
      onTeamAdded?.(teamId);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save team');
    }
  };

  // === Render (No loading states — handled globally) ===
  return (
    <ModalShell
      title={team ? 'Edit Team' : 'Add New Team'}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={
        <>
          {team
            ? updating
              ? 'Updating...'
              : 'Update Team'
            : creating
              ? 'Creating...'
              : 'Create Team'}
        </>
      }
      onCancelButton={onClose}
      confirmLoading={creating || updating}
      centered
      width={600}
      className="add-team-modal"
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Team Name"
          name="teamName"
          rules={[{ required: true, message: 'Team name is required' }]}
        >
          <Input placeholder="Enter team name" />
        </Form.Item>

        <Form.Item
          label="Team Admin"
          name="adminId"
          rules={[{ required: true, message: 'Please select a team admin' }]}
        >
          <Select placeholder="Select admin" showSearch optionFilterProp="children">
            {users.map((user) => (
              <Option key={user.userId} value={user.userId}>
                {user.name} ({user.username})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Add Team Members">
          <div className="d-flex gap-2">
            <Select
              className="fv2-addnewteam-eb43a47b92"

              value={selectedUserId}
              onChange={setSelectedUserId}
              placeholder="Search and select member"
              showSearch
              optionFilterProp="children"
            >
              {users
                .filter((u) => !members.some((m) => m.userId === u.userId))
                .map((user) => (
                  <Option key={user.userId} value={user.userId}>
                    {user.name} ({user.username})
                  </Option>
                ))}
            </Select>
            <Button type="primary" onClick={addMember} disabled={!selectedUserId}>
              Add
            </Button>
          </div>
        </Form.Item>

        {/* Members List */}
        <List
          className="fv2-addnewteam-1a398c2ae4"
          bordered
          dataSource={members}
          locale={{ emptyText: 'No members added yet' }}
          renderItem={(member) => (
            <List.Item
              actions={[
                <Button type="link" danger onClick={() => removeMember(member.userId)}>
                  Remove
                </Button>,
              ]}
            >
              <List.Item.Meta title={member.userName} description={member.roleName} />
            </List.Item>
          )}
        />
      </Form>
    </ModalShell>
  );
};

export default AddNewTeam;
