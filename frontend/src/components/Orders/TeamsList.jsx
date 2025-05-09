import React, { useState } from "react";
import { useGetAllTeamsQuery, useDeleteTeamMutation } from "../../api/teamApi";
import user from "../../assets/img/users/user-01.jpg";
import avatar from "../../assets/img/profiles/avatar-15.jpg";
import PageHeader from "../Common/PageHeader";
import AddNewTeam from "./AddNewTeam";
import DeleteModal from "../Common/DeleteModal";
import { Dropdown, Form } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./teamList.css";

const TeamsList = ({ onClose, adminName }) => {
  const { data, isLoading, isError, refetch } = useGetAllTeamsQuery();
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  const handleAddTeam = () => {
    setSelectedTeam(null);
    setShowNewTeamModal(true);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowNewTeamModal(true);
  };

  const handleDeleteTeam = (team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;

    try {
      await deleteTeam(teamToDelete.id).unwrap();
      toast.success("Team deleted successfully!");
      refetch();
    } catch (err) {
      toast.error(
        `Error deleting team: ${
          err.data?.message || err.data?.error || "Unknown error"
        }`
      );
    } finally {
      setShowDeleteModal(false);
      setTeamToDelete(null);
    }
  };

  // Filter teams based on search term
  const filteredTeams = teams.filter((team) =>
    [team.teamName, team.adminName]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <ToastContainer />
      <div className="content container-fluid">
        <PageHeader
          onAdd={handleAddTeam}
          title="Teams"
          subtitle="Manage your teams & team-members"
        />

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="search-set">
                <div className="search-input">
                  <span className="btn-searchset">
                    <i className="ti ti-search fs-14"></i>
                  </span>
                  <Form.Control
                    type="search"
                    className="form-control"
                    placeholder="Search teams..."
                    aria-label="Search teams"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Dropdown>
                  <Dropdown.Toggle
                    variant="light"
                    className="btn btn-outline-secondary btn-md"
                  >
                    Select Status
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    <Dropdown.Item>Active</Dropdown.Item>
                    <Dropdown.Item>Inactive</Dropdown.Item>
                    <Dropdown.Item>New Joiners</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="light"
                    className="btn btn-outline-secondary btn-md"
                  >
                    Sort By: Last 7 Days
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    <Dropdown.Item>Recently Added</Dropdown.Item>
                    <Dropdown.Item>Ascending</Dropdown.Item>
                    <Dropdown.Item>Descending</Dropdown.Item>
                    <Dropdown.Item>Last Month</Dropdown.Item>
                    <Dropdown.Item>Last 7 Days</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        <div className="employee-grid-widget">
          {isLoading && <p className="text-center">Loading teams...</p>}
          {isError && (
            <p className="text-center text-danger">Error fetching teams.</p>
          )}
          {filteredTeams.length === 0 && !isLoading && (
            <p className="text-center">
              {searchTerm ? "No teams match your search." : "No teams found."}
            </p>
          )}

          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {filteredTeams.map((team) => (
              <div key={team.id} className="col">
                <div className="card team-card h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="team-name d-flex align-items-center mb-0">
                        <i className="ti ti-point-filled text-success me-2"></i>
                        {team.teamName}
                      </h5>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="light"
                          className="border-0 p-0"
                          aria-label="Team actions"
                        >
                          <i className="bi bi-three-dots-vertical fs-18"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end">
                          <Dropdown.Item onClick={() => handleEditTeam(team)}>
                            <i className="bi bi-pencil me-2"></i> Edit
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDeleteTeam(team)}>
                            <i className="bi bi-trash me-2"></i> Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className="admin-info text-center mb-4">
                      <div className="avatar avatar-lg mb-2">
                        <img
                          src={team.adminImage || user}
                          alt={team.adminName}
                          className="rounded-circle"
                        />
                      </div>
                      <h6 className="mb-0">{team.adminName}</h6>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0">
                        Total Members: {team.teammembers?.length || 0}
                      </p>
                      <div className="avatar-list-stacked d-flex">
                        {team.teammembers
                          ?.slice(0, 3)
                          .map((teammember, index) => (
                            <span
                              key={index}
                              className="avatar avatar-sm avatar-rounded"
                              title={teammember.userName}
                            >
                              <img
                                src={teammember.userImage || avatar}
                                alt={teammember.userName}
                                className="border border-white"
                              />
                            </span>
                          ))}
                        {team.teammembers?.length > 3 && (
                          <span className="avatar avatar-sm avatar-rounded text-fixed-white fs-12 fw-medium">
                            <img src={avatar} alt="More members" />
                            <span className="more-members">
                              +{team.teammembers.length - 3}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNewTeamModal && (
        <AddNewTeam
          team={selectedTeam}
          onClose={() => setShowNewTeamModal(false)}
          onTeamAdded={refetch}
        />
      )}
      {showDeleteModal && (
        <DeleteModal
          item={teamToDelete}
          itemType="Team"
          isVisible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setTeamToDelete(null);
          }}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default TeamsList;
