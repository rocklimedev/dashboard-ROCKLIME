import React, { useState, useMemo } from "react";
import { useGetAllTeamsQuery, useDeleteTeamMutation } from "../../api/teamApi";
import PageHeader from "../Common/PageHeader";
import AddNewTeam from "./AddNewTeam";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { message, Button, Space, Tooltip, Card } from "antd";
import Avatar from "react-avatar";

import {
  MoreOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

import { Dropdown, Menu } from "antd";

const TeamsList = () => {
  const { data, refetch } = useGetAllTeamsQuery();
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();

  const teams = Array.isArray(data?.teams) ? data.teams : [];

  // === State ===
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // === Grouping ===
  const groupedTeams = useMemo(
    () => ({
      All: teams,
      Active: teams.filter((t) => t.status?.toLowerCase() === "active"),
      Inactive: teams.filter((t) => t.status?.toLowerCase() === "inactive"),
      "New Joiners": teams.filter((t) => t.status?.toLowerCase() === "new"),
    }),
    [teams]
  );

  // === Filtering & Sorting ===
  const filteredTeams = useMemo(() => {
    let result = groupedTeams[activeTab] || [];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (team) =>
          team.teamName?.toLowerCase().includes(term) ||
          team.adminName?.toLowerCase().includes(term)
      );
    }

    return result.sort(
      (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
    );
  }, [groupedTeams, activeTab, searchTerm]);

  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTeams.slice(start, start + itemsPerPage);
  }, [filteredTeams, currentPage]);

  // === Handlers ===
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
      message.success("Team deleted successfully");
      refetch();

      // Adjust page if needed
      if (paginatedTeams.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      message.error(err?.data?.message || "Failed to delete team");
    } finally {
      setShowDeleteModal(false);
      setTeamToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const closeModal = () => {
    setShowNewTeamModal(false);
    setSelectedTeam(null);
  };

  // === Render (No loading/error states — handled globally) ===
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Teams"
            subtitle="Manage your teams & team members"
            onAdd={handleAddTeam}
          />

          <div className="card-body">
            {/* Tabs + Filters */}
            <div className="row mb-4 align-items-center">
              <div className="col-lg-8">
                <div className="d-flex gap-2 flex-wrap">
                  {Object.keys(groupedTeams).map((tab) => (
                    <button
                      key={tab}
                      className={`btn btn-sm ${
                        activeTab === tab
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => {
                        setActiveTab(tab);
                        setCurrentPage(1);
                      }}
                    >
                      {tab} ({groupedTeams[tab].length})
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="d-flex justify-content-end gap-2 flex-wrap">
                  <div className="position-relative" style={{ width: 250 }}>
                    <SearchOutlined className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search teams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={clearFilters}
                  >
                    Clear
                  </button>

                  {/* View Toggle */}
                  <div className="btn-group">
                    <button
                      className={`btn ${
                        viewMode === "list"
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setViewMode("list")}
                      title="List View"
                    >
                      <UnorderedListOutlined />
                    </button>
                    <button
                      className={`btn ${
                        viewMode === "card"
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setViewMode("card")}
                      title="Card View"
                    >
                      <AppstoreOutlined />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD VIEW */}
            {viewMode === "card" && (
              <div className="row g-4">
                {paginatedTeams.map((team) => (
                  <div key={team.id} className="col-md-6 col-lg-4">
                    <Card
                      hoverable
                      className="h-100 shadow-sm"
                      actions={[
                        <Tooltip title="Edit" key="edit">
                          <EditOutlined onClick={() => handleEditTeam(team)} />
                        </Tooltip>,
                        <Dropdown
                          key="more"
                          overlay={
                            <Menu>
                              <Menu.Item
                                danger
                                onClick={() => handleDeleteTeam(team)}
                                disabled={isDeleting}
                              >
                                <DeleteOutlined /> Delete Team
                              </Menu.Item>
                            </Menu>
                          }
                          trigger={["click"]}
                        >
                          <Button type="text" icon={<MoreOutlined />} />
                        </Dropdown>,
                      ]}
                    >
                      <div className="d-flex align-items-center mb-3">
                        <Avatar
                          name={team.teamName}
                          size="50"
                          round
                          color="#1890ff"
                          className="me-3"
                        />
                        <div>
                          <h6 className="mb-0">
                            {team.teamName || "Unnamed Team"}
                          </h6>
                          <small className="text-muted">
                            {team.teammembers?.length || 0} member
                            {team.teammembers?.length !== 1 ? "s" : ""}
                          </small>
                        </div>
                      </div>

                      <div className="mb-3">
                        <Space size={8}>
                          <Avatar
                            name={team.adminName || "Admin"}
                            size="32"
                            round
                          />
                          <span>{team.adminName || "Unknown Admin"}</span>
                        </Space>
                      </div>

                      <Space size={[8, 8]} wrap>
                        {team.teammembers?.slice(0, 6).map((member, i) => (
                          <Tooltip key={i} title={member.userName}>
                            <Avatar name={member.userName} size="32" round />
                          </Tooltip>
                        ))}
                        {team.teammembers?.length > 6 && (
                          <Avatar
                            name={`+${team.teammembers.length - 6}`}
                            size="32"
                            round
                            style={{ backgroundColor: "#999" }}
                          />
                        )}
                      </Space>
                    </Card>
                  </div>
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Team Name</th>
                      <th>Admin</th>
                      <th>Members</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTeams.map((team) => (
                      <tr key={team.id}>
                        <td>
                          <strong>{team.teamName || "Unnamed Team"}</strong>
                        </td>
                        <td>
                          <Space>
                            <Avatar
                              name={team.adminName || "A"}
                              size="32"
                              round
                            />
                            <span>{team.adminName || "Unknown"}</span>
                          </Space>
                        </td>
                        <td>
                          <Space size={8} wrap>
                            {team.teammembers?.slice(0, 5).map((m, i) => (
                              <Tooltip key={i} title={m.userName}>
                                <Avatar name={m.userName} size="30" round />
                              </Tooltip>
                            ))}
                            {team.teammembers?.length > 5 && (
                              <Avatar
                                name={`+${team.teammembers.length - 5}`}
                                size="30"
                                round
                                style={{ backgroundColor: "#666" }}
                              />
                            )}
                            <span className="text-muted small ms-2">
                              ({team.teammembers?.length || 0})
                            </span>
                          </Space>
                        </td>
                        <td>
                          <Space>
                            <Tooltip title="Edit">
                              <EditOutlined
                                style={{ cursor: "pointer", fontSize: 18 }}
                                onClick={() => handleEditTeam(team)}
                              />
                            </Tooltip>
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item
                                    danger
                                    onClick={() => handleDeleteTeam(team)}
                                  >
                                    <DeleteOutlined /> Delete
                                  </Menu.Item>
                                </Menu>
                              }
                              trigger={["click"]}
                            >
                              <Button type="text" icon={<MoreOutlined />} />
                            </Dropdown>
                          </Space>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredTeams.length > itemsPerPage && (
              <div className="mt-4 d-flex justify-content-center">
                <DataTablePagination
                  totalItems={filteredTeams.length}
                  itemNo={itemsPerPage}
                  onPageChange={setCurrentPage}
                  currentPage={currentPage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AddNewTeam
          team={selectedTeam}
          visible={showNewTeamModal}
          onClose={closeModal}
          onTeamAdded={refetch}
        />

        <DeleteModal
          isVisible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setTeamToDelete(null);
          }}
          itemType="Team"
          item={teamToDelete?.teamName}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default TeamsList;
