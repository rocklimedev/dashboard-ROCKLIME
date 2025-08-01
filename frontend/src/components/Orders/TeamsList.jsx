import React, { useState, useMemo } from "react";
import { useGetAllTeamsQuery, useDeleteTeamMutation } from "../../api/teamApi";
import PageHeader from "../Common/PageHeader";
import AddNewTeam from "./AddNewTeam";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays } from "date-fns";
import {
  Input,
  Select,
  Button,
  Card,
  Avatar,
  Tooltip,
  Space,
  Typography,
  Alert,
} from "antd";
import { Spinner } from "react-bootstrap";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import user from "../../assets/img/profiles/avatar-01.jpg";
import avatar from "../../assets/img/profiles/avatar-15.jpg";

const { Option } = Select;
const { Text, Title } = Typography;

const TeamsList = ({ adminName }) => {
  // Queries
  const { data, isLoading, isError, refetch } = useGetAllTeamsQuery();
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();

  // Data assignments
  const teams = Array.isArray(data?.teams) ? data.teams : [];

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [createdDate, setCreatedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Memoized grouped teams for tab-based filtering
  const groupedTeams = useMemo(
    () => ({
      All: teams,
      Active: teams.filter((team) => team.status?.toLowerCase() === "active"),
      Inactive: teams.filter(
        (team) => team.status?.toLowerCase() === "inactive"
      ),
      "New Joiners": teams.filter(
        (team) => team.status?.toLowerCase() === "new"
      ),
    }),
    [teams]
  );

  // Filtered and sorted teams
  const filteredTeams = useMemo(() => {
    let result = groupedTeams[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((team) =>
        [team.teamName, team.adminName]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // Apply created date filter
    if (createdDate) {
      result = result.filter((team) => {
        const teamDate = new Date(team.createdDate);
        return teamDate.toDateString() === createdDate.toDateString();
      });
    }

    // Apply status filter from dropdown
    if (selectedStatus) {
      result = result.filter(
        (team) => team.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          a.teamName.localeCompare(b.teamName)
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          b.teamName.localeCompare(a.teamName)
        );
        break;
      case "Recently Added":
      case "Created Date":
        result = [...result].sort(
          (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
        );
        break;
      case "Last 7 Days":
        const sevenDaysAgo = subDays(new Date(), 7);
        result = result.filter(
          (team) => new Date(team.createdDate) >= sevenDaysAgo
        );
        result = [...result].sort(
          (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
        );
        break;
      case "Last Month":
        const oneMonthAgo = subDays(new Date(), 30);
        result = result.filter(
          (team) => new Date(team.createdDate) >= oneMonthAgo
        );
        result = [...result].sort(
          (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
        );
        break;
      default:
        break;
    }

    return result;
  }, [
    groupedTeams,
    activeTab,
    searchTerm,
    createdDate,
    selectedStatus,
    sortBy,
  ]);

  // Paginated teams
  const paginatedTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeams.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeams, currentPage]);

  // Handlers
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
      if (paginatedTeams.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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

  const clearFilters = () => {
    setSearchTerm("");
    setCreatedDate(null);
    setSelectedStatus("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <Spinner
              animation="border"
              variant="primary"
              role="status"
              aria-label="Loading data"
            />
            <p>Loading teams...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert variant="danger" role="alert">
              Error loading teams: {JSON.stringify(isError)}. Please try again.
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            onAdd={handleAddTeam}
            title="Teams"
            subtitle="Manage your teams & team-members"
            tableData={paginatedTeams}
          />
          <div className="card-body">
            <div className="row">
              <div className="col-lg-12">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <div className="input-icon w-120 position-relative me-2">
                    <DatePicker
                      selected={createdDate}
                      onChange={(date) => setCreatedDate(date)}
                      className="form-control datetimepicker"
                      placeholderText="Created Date"
                      dateFormat="dd/MM/yyyy"
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar text-gray-9"></i>
                    </span>
                  </div>
                  <div className="input-icon-start position-relative me-2">
                    <span className="input-icon-addon">
                      <SearchOutlined />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Teams"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search teams"
                    />
                  </div>

                  <button
                    className="btn btn-outline-secondary ms-2"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            <div className="tab-content" id="pills-tabContent">
              {Object.entries(groupedTeams).map(([status, list]) => (
                <div
                  className={`tab-pane fade ${
                    activeTab === status ? "show active" : ""
                  }`}
                  id={`pills-${status}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${status}`}
                  key={status}
                >
                  {filteredTeams.length === 0 ? (
                    <p className="text-muted">
                      No {status.toLowerCase()} teams match the applied filters
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Team Name</th>
                            <th>Admin</th>
                            <th>Total Members</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTeams.map((team) => (
                            <tr key={team.id}>
                              <td>{team.teamName || "N/A"}</td>
                              <td>
                                <Space>
                                  <Avatar
                                    src={team.adminImage || user}
                                    size={30}
                                  />
                                  {team.adminName || "Unknown"}
                                </Space>
                              </td>
                              <td>
                                <Space className="avatar-list-stacked">
                                  {team.teammembers
                                    ?.slice(0, 3)
                                    .map((member, index) => (
                                      <Tooltip
                                        key={index}
                                        title={member.userName}
                                      >
                                        <Avatar
                                          src={member.userImage || avatar}
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
                                  <Text>{team.teammembers?.length || 0}</Text>
                                </Space>
                              </td>

                              <td>
                                <div className="action-buttons">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEditTeam(team)}
                                    title="Edit Team"
                                    aria-label={`Edit team ${team.teamName}`}
                                    className="me-1"
                                  >
                                    <EditOutlined />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteTeam(team)}
                                    disabled={isDeleting}
                                    title="Delete Team"
                                    aria-label={`Delete team ${team.teamName}`}
                                  >
                                    <DeleteOutlined />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="pagination-section mt-4">
                        <DataTablePagination
                          totalItems={filteredTeams.length}
                          itemNo={itemsPerPage}
                          onPageChange={handlePageChange}
                          currentPage={currentPage}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <AddNewTeam
          team={selectedTeam}
          visible={showNewTeamModal}
          onClose={() => setShowNewTeamModal(false)}
          onTeamAdded={refetch}
        />
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
    </div>
  );
};

export default TeamsList;
