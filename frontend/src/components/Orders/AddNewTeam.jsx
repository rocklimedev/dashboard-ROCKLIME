import React, { useState, useEffect } from "react";
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useGetTeamMembersQuery,
  useGetTeamByIdQuery,
} from "../../api/teamApi";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "../../api/userApi";
import { Modal, Form, Input, Select, Button, List, message } from "antd";
import { toast } from "sonner";
import "./teamList.css";

const { Option } = Select;

const AddNewTeam = ({ onClose, onTeamAdded, team, visible }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch all users
  const { data: usersData } = useGetAllUsersQuery();
  const users = Array.isArray(usersData?.users) ? usersData.users : [];

  // Fetch user details for selected user
  const { data: userDetails } = useGetUserByIdQuery(selectedUserId, {
    skip: !selectedUserId,
  });

  // Fetch team details when editing
  const { data: teamData, isLoading: isTeamLoading } = useGetTeamByIdQuery(
    team?.id,
    { skip: !team?.id }
  );

  // Fetch team members when editing
  const { data: teamMembersData, isLoading: isMembersLoading } =
    useGetTeamMembersQuery(team?.id, { skip: !team?.id });

  const [createTeam, { isLoading: creating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: updating }] = useUpdateTeamMutation();

  // Initialize form with team data
  useEffect(() => {
    if (team && teamData?.team) {
      form.setFieldsValue({
        teamName: teamData.team.teamName || team.teamName || "",
        adminId: teamData.team.adminId || team.adminId || "",
      });
      setMembers(
        teamMembersData?.members?.map((member) => ({
          userId: member.userId,
          userName: member.userName,
          roleId: member.roleId,
          roleName: member.roleName || "No Role",
        })) ||
          team.teammembers?.map((member) => ({
            userId: member.userId,
            userName: member.userName,
            roleId: member.roleId,
            roleName: member.roleName || "No Role",
          })) ||
          []
      );
    } else {
      form.resetFields();
      setMembers([]);
    }
  }, [team, teamData, teamMembersData, form]);

  const handleSubmit = async (values) => {
    if (!members.length && !team) {
      message.error("At least one team member is required for a new team");
      return;
    }

    const adminUser = users.find((user) => user.userId === values.adminId);
    if (!adminUser) {
      message.error("Admin user not found");
      return;
    }

    const teamDataPayload = {
      teamName: values.teamName,
      adminId: values.adminId,
      adminName: adminUser?.name || "Unknown",
      members,
    };

    try {
      if (team) {
        await updateTeam({
          teamId: team.id,
          ...teamDataPayload,
        }).unwrap();
        toast.success("Team updated successfully");
      } else {
        await createTeam(teamDataPayload).unwrap();
        toast.success("Team created successfully");
      }
      form.resetFields();
      setMembers([]);
      onTeamAdded?.();
      onClose();
    } catch (err) {
      toast.error(
        `Error saving team: ${
          err.data?.message || err.status === 404
            ? "Team not found"
            : "Please try again"
        }`
      );
    }
  };

  const addMember = () => {
    if (userDetails?.user) {
      if (members.some((member) => member.userId === selectedUserId)) {
        message.warning("User is already a team member");
        return;
      }
      setMembers((prev) => [
        ...prev,
        {
          userId: selectedUserId,
          userName: userDetails.user.username,
          roleId: userDetails.user.roleId,
          roleName: userDetails.user.roles?.[0] || "No Role",
        },
      ]);
      setSelectedUserId("");
      message.success("Member added successfully");
    }
  };

  const removeMember = (id) => {
    setMembers(members.filter((member) => member.userId !== id));
    message.info("Member removed");
  };

  return (
    <Modal
      title={team ? "Edit Team" : "Add New Team"}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      className="add-team-modal"
    >
      {(isTeamLoading || isMembersLoading) && team ? (
        <p>Loading team data...</p>
      ) : (
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Team Name"
            name="teamName"
            rules={[{ required: true, message: "Team name is required" }]}
          >
            <Input placeholder="Enter team name" />
          </Form.Item>
          <Form.Item
            label="Admin"
            name="adminId"
            rules={[{ required: true, message: "Admin must be selected" }]}
          >
            <Select placeholder="Select Admin">
              {users.map((user) => (
                <Option key={user.userId} value={user.userId}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Team Members">
            <div style={{ display: "flex", gap: "8px" }}>
              <Select
                style={{ flex: 1 }}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Select Member"
              >
                <Option value="">Select Member</Option>
                {users.map((user) => (
                  <Option key={user.userId} value={user.userId}>
                    {user.name}
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
          <List
            dataSource={members}
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
                {member.userName} - {member.roleName}
              </List.Item>
            )}
            style={{ marginBottom: "16px" }}
          />
          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <Button onClick={onClose}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating || updating}
              >
                {team
                  ? updating
                    ? "Updating..."
                    : "Update"
                  : creating
                  ? "Creating..."
                  : "Create"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default AddNewTeam;
