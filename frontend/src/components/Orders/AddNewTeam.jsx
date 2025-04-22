import React, { useState, useEffect } from "react";
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useGetTeamMembersQuery,
  useGetTeamByIdQuery, // Add useGetTeamByIdQuery
} from "../../api/teamApi";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "../../api/userApi";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddNewTeam = ({ onClose, onTeamAdded, team }) => {
  const [teamName, setTeamName] = useState(team?.teamName || "");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [members, setMembers] = useState([]);
  const [adminId, setAdminId] = useState(team?.adminId || "");

  // Fetch all users
  const { data: usersData } = useGetAllUsersQuery();
  const users = Array.isArray(usersData?.users) ? usersData.users : [];

  // Fetch user details for selected user
  const { data: userDetails } = useGetUserByIdQuery(selectedUserId, {
    skip: !selectedUserId,
  });

  // Fetch team details when editing
  const {
    data: teamData,
    isLoading: isTeamLoading,
    error: teamError,
  } = useGetTeamByIdQuery(team?.id, {
    skip: !team?.id, // Skip if no team ID (create mode)
  });

  // Fetch team members when editing
  const {
    data: teamMembersData,
    isLoading: isMembersLoading,
    error: membersError,
  } = useGetTeamMembersQuery(team?.id, {
    skip: !team?.id,
  });

  const [createTeam, { isLoading: creating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: updating }] = useUpdateTeamMutation();

  // Log for debugging
  useEffect(() => {
    console.log("Team prop:", team);
    console.log("Team Data (API):", teamData);
    console.log("Team Error:", teamError);
    console.log("Team Members Data:", teamMembersData);
    console.log("Members Error:", membersError);
  }, [team, teamData, teamError, teamMembersData, membersError]);

  // Initialize form with team data
  useEffect(() => {
    if (team) {
      if (!team.id) {
        toast.error("Invalid team ID. Cannot edit team.");
        onClose();
        return;
      }

      // Use API-fetched team data if available
      const sourceTeam = teamData?.team || team;
      setTeamName(sourceTeam.teamName || "");
      setAdminId(sourceTeam.adminId || "");

      // Use API-fetched members if available
      if (teamMembersData?.members) {
        setMembers(
          teamMembersData.members.map((member) => ({
            userId: member.userId,
            userName: member.userName,
            roleId: member.roleId,
            roleName: member.roleName || "No Role",
          }))
        );
      } else {
        // Fallback to team.teammembers or team.members
        const sourceMembers =
          Array.isArray(sourceTeam.teammembers) ||
          Array.isArray(sourceTeam.members)
            ? (sourceTeam.teammembers || sourceTeam.members).map((member) => ({
                userId: member.userId,
                userName: member.userName,
                roleId: member.roleId,
                roleName: member.roleName || "No Role",
              }))
            : [];
        setMembers(sourceMembers);
      }
    } else {
      // Reset for new team
      setTeamName("");
      setAdminId("");
      setMembers([]);
    }
  }, [team, teamData, teamMembersData]);

  // Handle team not found error
  useEffect(() => {
    if (teamError?.status === 404) {
      toast.error("Team not found. It may have been deleted.");
      onClose();
    }
  }, [teamError, onClose]);

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
        if (!team.id) {
          throw new Error("Team ID is missing");
        }
        console.log("Updating team with ID:", team.id, teamData);
        await updateTeam({
          teamId: team.id,
          teamData,
        }).unwrap();
        toast.success("Team updated successfully");
      } else {
        console.log("Creating team:", teamData);
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
      let errorMessage = "Please try again";
      if (err.status === 404) {
        errorMessage = "Team not found. It may have been deleted.";
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }
      toast.error(`Error saving team: ${errorMessage}`);
    }
  };

  const addMember = () => {
    if (userDetails?.user) {
      // Prevent adding duplicate members
      if (members.some((member) => member.userId === selectedUserId)) {
        toast.warning("User is already a team member");
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
      toast.success("Member added successfully");
    }
  };

  const removeMember = (id) => {
    setMembers(members.filter((member) => member.userId !== id));
    toast.info("Member removed");
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <ToastContainer />
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5>{team ? "Edit Team" : "Add New Team"}</h5>
            <button type="button" className="close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            {(isTeamLoading || isMembersLoading) && team ? (
              <p>Loading team data...</p>
            ) : teamError && team ? (
              <p className="text-danger">
                Error loading team: {teamError.data?.message || "Unknown error"}
              </p>
            ) : membersError && team ? (
              <p className="text-danger">
                Error loading team members:{" "}
                {membersError.data?.message || "Unknown error"}
              </p>
            ) : null}

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

            {members.length > 0 ? (
              members.map((member) => (
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
              ))
            ) : (
              <p>No team members added.</p>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={
                creating || updating || isTeamLoading || isMembersLoading
              }
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
