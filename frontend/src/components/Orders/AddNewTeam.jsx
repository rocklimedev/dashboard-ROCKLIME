import React, { useState, useEffect } from "react";
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
} from "../../api/teamApi";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "../../api/userApi";
import { toast } from "react-toastify"; // Import the toast function
import { ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for toast notifications

const AddNewTeam = ({ onClose, onTeamAdded, team }) => {
  const [teamName, setTeamName] = useState(team?.teamName || "");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [members, setMembers] = useState(team?.members || []);
  const [adminId, setAdminId] = useState(team?.adminId || "");

  const { data } = useGetAllUsersQuery();
  const users = Array.isArray(data?.users) ? data.users : [];

  const { data: userDetails } = useGetUserByIdQuery(selectedUserId, {
    skip: !selectedUserId,
  });

  const [createTeam, { isLoading: creating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: updating }] = useUpdateTeamMutation();

  useEffect(() => {
    if (team) {
      setTeamName(team.teamName);
      setAdminId(team.adminId);
      setMembers(team.members || []); // Ensure members is always an array
    }
  }, [team]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }
    if (!adminId) {
      toast.error("Admin must be selected");
      return;
    }

    const adminUser = users.find((user) => user.userId === adminId);
    if (!adminUser) {
      toast.error("Admin user not found");
      return;
    }

    const teamData = {
      teamName,
      adminId,
      adminName: adminUser?.name || "Unknown",
      members,
    };

    try {
      if (team) {
        await updateTeam({ id: team.id, ...teamData }).unwrap();
        toast.success("Team updated successfully");
      } else {
        await createTeam(teamData).unwrap();
        toast.success("Team created successfully");
      }

      setTeamName("");
      setMembers([]);
      setAdminId("");
      if (typeof onTeamAdded === "function") onTeamAdded();
      onClose();
    } catch (err) {
      console.error("Error saving team:", err);
      toast.error("Error saving team, please try again");
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
      toast.success("Member added successfully");
    }
  };

  const removeMember = (id) => {
    setMembers(members.filter((member) => member.userId !== id));
    toast.info("Member removed");
  };
  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5>{team ? "Edit Team" : "Add New Team"}</h5>
            <button type="button" className="close" onClick={onClose}>
              ×
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
              onChange={(e) => setAdminId(e.target.value)}
            >
              <option value="">Select Admin</option>
              {users?.length > 0 ? (
                users.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.name}
                  </option>
                ))
              ) : (
                <option disabled>Loading users...</option>
              )}
            </select>

            <h6>Team Members</h6>
            <select
              className="form-control mb-2"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select a user</option>
              {users?.length > 0 ? (
                users.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.name}
                  </option>
                ))
              ) : (
                <option disabled>Loading users...</option>
              )}
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
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={creating || updating}
            >
              {creating || updating
                ? "Saving..."
                : team
                ? "Update Team"
                : "Add Team"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewTeam;
