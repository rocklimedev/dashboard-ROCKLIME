import React, { useState, useEffect } from "react";
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useGetTeamMembersQuery,
  useGetTeamByIdQuery,
} from "../../api/teamApi";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "../../api/userApi";
import { Modal, Form, Input, Select, Button, List, message } from "antd";

const { Option } = Select;

const AddNewTeam = ({ onClose, onTeamAdded, team, visible }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

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
        teamName: teamData.team.teamName || team.teamName || "",
        adminId: teamData.team.adminId || team.adminId || "",
      });

      const currentMembers =
        teamMembersData?.members?.map((m) => ({
          userId: m.userId,
          userName: m.userName,
          roleId: m.roleId,
          roleName: m.roleName || "No Role",
        })) ||
        team.teammembers?.map((m) => ({
          userId: m.userId,
          userName: m.userName,
          roleId: m.roleId,
          roleName: m.roleName || "No Role",
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
      message.warning("User is already in the team");
      return;
    }

    setMembers((prev) => [
      ...prev,
      {
        userId: selectedUserId,
        userName: userDetails.user.username || userDetails.user.name,
        roleId: userDetails.user.roleId,
        roleName: userDetails.user.roles?.[0] || "No Role",
      },
    ]);
    setSelectedUserId("");
  };

  const removeMember = (userId) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleSubmit = async (values) => {
    if (!members.length && !team) {
      message.error("At least one team member is required");
      return;
    }

    const adminUser = users.find((u) => u.userId === values.adminId);
    if (!adminUser) {
      message.error("Selected admin not found");
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
        message.success("Team updated successfully");
      } else {
        const result = await createTeam(payload).unwrap();
        teamId = result.teamId || result.id;
        message.success("Team created successfully");
      }

      form.resetFields();
      setMembers([]);
      onTeamAdded?.(teamId);
      onClose();
    } catch (err) {
      message.error(err?.data?.message || "Failed to save team");
    }
  };

  // === Render (No loading states — handled globally) ===
  return (
    <Modal
      title={team ? "Edit Team" : "Add New Team"}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      className="add-team-modal"
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Team Name"
          name="teamName"
          rules={[{ required: true, message: "Team name is required" }]}
        >
          <Input placeholder="Enter team name" />
        </Form.Item>

        <Form.Item
          label="Team Admin"
          name="adminId"
          rules={[{ required: true, message: "Please select a team admin" }]}
        >
          <Select
            placeholder="Select admin"
            showSearch
            optionFilterProp="children"
          >
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
              style={{ flex: 1 }}
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
            <Button
              type="primary"
              onClick={addMember}
              disabled={!selectedUserId}
            >
              Add
            </Button>
          </div>
        </Form.Item>

        {/* Members List */}
        <List
          bordered
          dataSource={members}
          locale={{ emptyText: "No members added yet" }}
          renderItem={(member) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  danger
                  onClick={() => removeMember(member.userId)}
                >
                  Remove
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={member.userName}
                description={member.roleName}
              />
            </List.Item>
          )}
          style={{ marginBottom: 16, maxHeight: 300, overflowY: "auto" }}
        />

        <Form.Item className="mb-0">
          <div className="d-flex justify-content-end gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creating || updating}
            >
              {team
                ? updating
                  ? "Updating..."
                  : "Update Team"
                : creating
                ? "Creating..."
                : "Create Team"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddNewTeam;
