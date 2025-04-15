import React, { useState } from "react";
import { useGetAllTeamsQuery, useDeleteTeamMutation } from "../../api/teamApi"; // Import useDeleteTeamMutation
import user from "../../assets/img/users/user-01.jpg";
import avatar from "../../assets/img/profiles/avatar-15.jpg";
import PageHeader from "../Common/PageHeader";
import AddNewTeam from "./AddNewTeam";
import DeleteModal from "../Common/DeleteModal";
import { Dropdown } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toastify styles
const TeamsList = ({ onClose, adminName }) => {
  const { data, isLoading, isError, refetch } = useGetAllTeamsQuery();
  const teams = Array.isArray(data?.teams) ? data.teams : [];

  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation(); // Add delete mutation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null); // For Add/Edit
  const [teamToDelete, setTeamToDelete] = useState(null); // Track team to delete

  const handleAddTeam = () => {
    setSelectedTeam(null);
    setShowNewTeamModal(true);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowNewTeamModal(true);
  };

  const handleDeleteTeam = (team) => {
    setTeamToDelete(team); // Set the team to delete
    setShowDeleteModal(true); // Show the delete confirmation modal
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;

    try {
      await deleteTeam(teamToDelete.id).unwrap(); // Call the delete mutation with team ID
      toast.success("Team deleted successfully!"); // Success toast
      refetch(); // Refresh the team list after deletion
    } catch (err) {
      toast.error("Error deleting team!"); // Error toast
      console.error("Error deleting team:", err);
    } finally {
      setShowDeleteModal(false); // Close the modal
      setTeamToDelete(null); // Clear the selected team
    }
  };
  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          onAdd={handleAddTeam}
          title="Teams"
          subtitle="Manage your teams & team-members"
        />

        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set mb-0">
                <div className="search-input">
                  <span className="btn-searchset">
                    <i className="ti ti-search fs-14 feather-search"></i>
                  </span>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search"
                  />
                </div>
              </div>
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <a
                    href="javascript:void(0);"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Active
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Inactive
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        New Joiners
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <a
                    href="javascript:void(0);"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Recently Added
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Ascending
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Descending
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Last Month
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Last 7 Days
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="employee-grid-widget">
          <div className="row">
            {isLoading && <p>Loading...</p>}
            {isError && <p>Error fetching teams.</p>}

            {Array.isArray(teams) && teams.length > 0 ? (
              teams.map((team) => (
                <div
                  key={team.id}
                  className="col-xxl-3 col-xl-4 col-lg-6 col-md-6"
                >
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <h5 className="d-inline-flex align-items-center">
                          <i className="ti ti-point-filled text-success fs-20"></i>
                          {team.teamName}
                        </h5>
                        <Dropdown>
                          <Dropdown.Toggle variant="light" className="border-0">
                            <i className="bi bi-three-dots-vertical"></i>
                          </Dropdown.Toggle>

                          <Dropdown.Menu align="end">
                            <Dropdown.Item
                              href="javascript:void(0);"
                              onClick={() => handleEditTeam(team)}
                            >
                              <i className="bi bi-pencil me-2"></i> Edit
                            </Dropdown.Item>
                            <Dropdown.Item
                              href="javascript:void(0);"
                              onClick={() => handleDeleteTeam(team)} // Trigger delete handler
                            >
                              <i className="bi bi-trash me-2"></i> Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                      <div className="bg-light rounded p-3 text-center mb-4">
                        <div className="avatar avatar-lg mb-2">
                          <img src={user} alt="Img" />
                        </div>
                        <h4>{team.adminName}</h4>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <p className="mb-0">
                          Total Members: {team.teammembers?.length || 0}
                        </p>
                        <div className="avatar-list-stacked avatar-group-sm">
                          {team.teammembers
                            ?.slice(0, 3)
                            .map((teammember, index) => (
                              <span
                                className="avatar avatar-rounded"
                                key={index}
                              >
                                <img
                                  className="border border-white"
                                  src={teammember.userId || avatar}
                                  alt={teammember.userName}
                                />
                              </span>
                            ))}
                          {team.teammembers?.length > 3 && (
                            <a
                              className="avatar avatar-rounded text-fixed-white fs-10 fw-medium position-relative"
                              href="javascript:void(0);"
                            >
                              <img src={avatar} alt="img" />
                              <span className="position-absolute top-50 start-50 translate-middle text-center">
                                +{team.teammembers.length - 3}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No teams found</p>
            )}
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
          itemType="Team"
          isVisible={showDeleteModal}
          onConfirm={confirmDelete} // Call confirmDelete on confirmation
          onCancel={() => {
            setShowDeleteModal(false);
            setTeamToDelete(null); // Clear teamToDelete on cancel
          }}
          isLoading={isDeleting} // Pass loading state to modal (optional)
        />
      )}
    </div>
  );
};

export default TeamsList;
