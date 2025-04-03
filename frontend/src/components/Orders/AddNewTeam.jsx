import React, { useState } from "react";
import { useCreateTeamMutation } from "../../api/teamApi";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "../../api/userApi";

const AddNewTeam = ({ onClose, onTeamAdded }) => {
  const [teamName, setTeamName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [members, setMembers] = useState([]);
  const [adminId, setAdminId] = useState("");
  const { data } = useGetAllUsersQuery();
  const users = data?.users || [];

  const { data: userDetails } = useGetUserByIdQuery(selectedUserId, {
    skip: !selectedUserId,
  });
  const [createTeam, { isLoading, error }] = useCreateTeamMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) {
      console.error("Team name is required");
      return;
    }

    if (!adminId) {
      console.error("Admin must be selected");
      return;
    }

    const adminUser = users.find((user) => user.userId === adminId);
    if (!adminUser) {
      console.error("Admin user not found");
      return;
    }

    try {
      const response = await createTeam({
        teamName,
        adminId,
        adminName: adminUser?.name || "Unknown",
        members,
      }).unwrap();

      console.log("Team created successfully:", response);
      setTeamName("");
      setMembers([]);
      setAdminId("");

      if (typeof onTeamAdded === "function") onTeamAdded();
      onClose();
    } catch (err) {
      console.error("Error creating team:", err);
    }
  };

  const addMember = () => {
    if (userDetails?.user) {
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
    }
  };

  const removeMember = (id) => {
    setMembers(members.filter((member) => member.userId !== id));
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5>Add New Team</h5>
            <button type="button" className="close" onClick={onClose}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Enter Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />

            <h6>Select Admin</h6>
            <select
              className="form-control mb-2"
              value={adminId}
              onChange={(e) => {
                console.log("Admin ID selected:", e.target.value); // Debugging
                setAdminId(e.target.value);
              }}
            >
              <option value="">Select Admin</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.name}
                </option>
              ))}
            </select>

            <h6>Team Members</h6>
            <select
              className="form-control mb-2"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-success mb-3"
              onClick={addMember}
              disabled={!selectedUserId}
            >
              + Add Member
            </button>

            {members.map((member) => (
              <div
                key={member.userId}
                className="d-flex align-items-center gap-2 mb-2"
              >
                <input
                  type="text"
                  className="form-control"
                  value={member.userName}
                  readOnly
                />
                <input
                  type="text"
                  className="form-control"
                  value={member.roleName}
                  readOnly
                />
                <button
                  className="btn btn-danger"
                  onClick={() => removeMember(member.userId)}
                >
                  ❌
                </button>
              </div>
            ))}
            {error && <p className="text-danger">Error creating team</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Team"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewTeam;
