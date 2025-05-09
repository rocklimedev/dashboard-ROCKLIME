import React, { useState, useEffect } from "react";
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useGetTeamMembersQuery,
  useGetTeamByIdQuery,
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
    skip: !team?.id,
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

  // Initialize form with team data
  useEffect(() => {
    if (team) {
      if (!team.id) {
        toast.error("Invalid team ID. Cannot edit team.");
        onClose();
        return;
      }

      const sourceTeam = teamData?.team || team;
      setTeamName(sourceTeam.teamName || "");
      setAdminId(sourceTeam.adminId || "");

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
        const sourceMembers = Array.isArray(sourceTeam.teammembers)
          ? sourceTeam.teammembers.map((member) => ({
              userId: member.userId,
              userName: member.userName,
              roleId: member.roleId,
              roleName: member.roleName || "No Role",
            }))
          : [];
        setMembers(sourceMembers);
      }
    } else {
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
      let response;
      if (team) {
        if (!team.id) {
          throw new Error("Team ID is missing");
        }

        response = await updateTeam({
          teamId: team.id,
          ...teamData,
        }).unwrap();

        toast.success("Team updated successfully");
      } else {
        response = await createTeam(teamData).unwrap();

        toast.success("Team created successfully");
      }

      setTeamName("");
      setMembers([]);
      setAdminId("");
      if (typeof onTeamAdded === "function") onTeamAdded();
      onClose();
    } catch (err) {
      let errorMessage = "Please try again";
      if (err.status === 404) {
        errorMessage = "Team not found. It may have been deleted.";
      } else if (err.status === 400) {
        errorMessage = err.data?.message || "Invalid data provided";
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }
      toast.error(`Error saving team: ${errorMessage}`);
    }
  };

  const addMember = () => {
    if (userDetails?.user) {
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
                Error loading team data. Please try again later.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="teamName">Team Name</label>
                  <input
                    type="text"
                    id="teamName"
                    className="form-control"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="adminId">Admin</label>
                  <select
                    id="adminId"
                    className="form-control"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                  >
                    <option value="">Select Admin</option>
                    {users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="members">Team Members</label>
                  <select
                    id="members"
                    className="form-control"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Select Member</option>
                    {users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addMember}
                    className="btn btn-primary mt-2"
                  >
                    Add Member
                  </button>
                </div>
                <div className="members-list mt-2">
                  {members.map((member) => (
                    <div
                      key={member.userId}
                      className="d-flex justify-content-between"
                    >
                      <span>
                        {member.userName} - {member.roleName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMember(member.userId)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creating || updating}
                  >
                    {team
                      ? updating
                        ? "Updating..."
                        : "Update"
                      : creating
                      ? "Creating..."
                      : "Create"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewTeam;
