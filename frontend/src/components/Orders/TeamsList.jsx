import React, { useState } from "react";
import { useGetAllTeamsQuery, useDeleteTeamMutation } from "../../api/teamApi";
import user from "../../assets/img/profiles/avatar-01.jpg";
import avatar from "../../assets/img/profiles/avatar-15.jpg";
import PageHeader from "../Common/PageHeader";
import AddNewTeam from "./AddNewTeam";
import DeleteModal from "../Common/DeleteModal";
import {
  Input,
  Select,
  Button,
  Card,
  Avatar,
  Tooltip,
  Space,
  Typography,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import "./teamList.css";

const { Option } = Select;
const { Text, Title } = Typography;

const TeamsList = ({ onClose, adminName }) => {
  const { data, isLoading, isError, refetch } = useGetAllTeamsQuery();
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredTeams = teams.filter((team) =>
    [team.teamName, team.adminName]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <PageHeader
          onAdd={handleAddTeam}
          title="Teams"
          subtitle="Manage your teams & team-members"
        />

        <Card className="filter-card">
          <Space
            direction="horizontal"
            size="middle"
            style={{
              width: "100%",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <div className="search-input">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 300, borderRadius: 20 }}
              />
            </div>
            <Space>
              <Select
                defaultValue="All Status"
                style={{ width: 150 }}
                dropdownStyle={{ borderRadius: 8 }}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="new">New Joiners</Option>
              </Select>
              <Select
                defaultValue="Last 7 Days"
                style={{ width: 150 }}
                dropdownStyle={{ borderRadius: 8 }}
              >
                <Option value="recent">Recently Added</Option>
                <Option value="asc">Ascending</Option>
                <Option value="desc">Descending</Option>
                <Option value="last-month">Last Month</Option>
                <Option value="last-7-days">Last 7 Days</Option>
              </Select>
            </Space>
          </Space>
        </Card>

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

          <div className="row row-cells-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {filteredTeams.map((team) => (
              <div key={team.id} className="col">
                <Card className="team-card" hoverable>
                  <div className="card-content">
                    <div className="card-header">
                      <Title level={5} className="team-name">
                        <span className="status-dot"></span>
                        {team.teamName}
                      </Title>
                      <Select
                        value="Actions"
                        style={{ width: 50 }}
                        bordered={false}
                        dropdownStyle={{ borderRadius: 8 }}
                      >
                        <Option onClick={() => handleEditTeam(team)}>
                          <EditOutlined /> Edit
                        </Option>
                        <Option onClick={() => handleDeleteTeam(team)}>
                          <DeleteOutlined /> Delete
                        </Option>
                      </Select>
                    </div>
                    <div className="admin-info text-center">
                      <Avatar src={team.adminImage || user} size={60} />
                      <Text strong>{team.adminName}</Text>
                    </div>
                    <div className="card-footer">
                      <Text>
                        Total Members: {team.teammembers?.length || 0}
                      </Text>
                      <Space className="avatar-list-stacked">
                        {team.teammembers
                          ?.slice(0, 3)
                          .map((teammember, index) => (
                            <Tooltip key={index} title={teammember.userName}>
                              <Avatar
                                src={teammember.userImage || avatar}
                                size={30}
                              />
                            </Tooltip>
                          ))}
                        {team.teammembers?.length > 3 && (
                          <Tooltip
                            title={`+${
                              team.teammembers.length - 3
                            } more members`}
                          >
                            <Avatar
                              size={30}
                              style={{
                                backgroundColor: "#6c757d",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              +{team.teammembers.length - 3}
                            </Avatar>
                          </Tooltip>
                        )}
                      </Space>
                    </div>
                  </div>
                </Card>
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
