import React from "react";
import { useParams, Link } from "react-router-dom";
import { useGetUserByIdQuery } from "../../api/userApi";
import Avatar from "react-avatar"; // Import react-avatar
import {
  LeftOutlined,
  ReloadOutlined,
  NodeCollapseOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
const UserPage = () => {
  const { userId } = useParams(); // Get userId from URL

  // Skip query if userId is undefined
  const {
    data: userData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUserByIdQuery(userId, { skip: !userId });
  const user = userData?.user || {};

  // Format roles (array or string)
  const roles = Array.isArray(user.roles)
    ? user.roles.join(", ")
    : user.roles || "User";

  // Handle address (null addressId in sample data)
  const address = user.address
    ? `${user.address.street || ""}, ${user.address.city || ""}, ${
        user.address.state || ""
      }, ${user.address.country || ""} ${user.address.zipCode || ""}`.trim()
    : "N/A";

  // Derive team from roles (optional)
  const team = user.roles?.includes("SALES")
    ? "Sales Team"
    : user.team || "N/A";

  // Format shift (convert TIME to readable format)
  const formatTime = (time) => {
    if (!time) return "N/A";
    const date = new Date(`1970-01-01T${time}`);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date (e.g., createdAt, dateOfBirth)
  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  };

  if (!userId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-warning">
            No user ID provided in the URL.
            <Link to="/users/list" className="btn btn-link">
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            Error loading user:{" "}
            {error?.status === 404
              ? "User not found"
              : error?.data?.message || "Unknown error"}
            <button className="btn btn-link" onClick={refetch}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !user.userId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-info">User not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-xl-4 theiaStickySidebar">
            <div className="card rounded-0 border-0">
              <div className="card-header rounded-0 bg-primary d-flex align-items-center">
                <span className="avatar avatar-xl avatar-rounded flex-shrink-0 border border-white border-3 me-3">
                  <Avatar
                    name={user.name || "User"} // Use user name for initials
                    src={user.avatar || "/assets/img/users/user-32.jpg"} // Use avatar URL or fallback
                    size="60" // Match the size of the previous image
                    round={true} // Rounded avatar
                    className="rounded"
                    color="#4A90E2" // Optional: Customize background color
                    textSizeRatio={2.5} // Optional: Adjust text size for initials
                    alt={`Avatar of ${user.name || "User"}`}
                  />
                </span>
                <div className="me-3">
                  <h6 className="text-white mb-1">{user.name || "N/A"}</h6>
                  <span className="badge bg-purple-transparent text-purple">
                    {roles}
                  </span>
                </div>
                <div>
                  <Link to={`/user/${userId}/edit`} className="btn btn-white">
                    Edit Profile
                  </Link>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <TeamOutlined />
                    Team
                  </span>
                  <p className="text-dark">{team}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-inline-flex align-items-center">
                    <CalendarOutlined />
                    Date Of Join
                  </span>
                  <p className="text-dark">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-8">
            <div className="card rounded-0 border-0">
              <div className="card-header border-0 rounded-0 bg-light d-flex align-items-center">
                <h6>Basic Information</h6>
              </div>
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Phone</p>
                      <span className="text-gray-900 fs-13">
                        {user.mobileNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Email</p>
                      <span className="text-gray-900 fs-13">
                        <a href={`mailto:${user.email}`}>{user.email}</a>
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Username</p>
                      <span className="text-gray-900 fs-13">
                        {user.username || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Birthday</p>
                      <span className="text-gray-900 fs-13">
                        {formatDate(user.dateOfBirth)}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Address</p>
                      <span className="text-gray-900 fs-13">{address}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Blood Group</p>
                      <span className="text-gray-900 fs-13">
                        {user.bloodGroup || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Shift</p>
                      <span className="text-gray-900 fs-13">
                        {user.shiftFrom && user.shiftTo
                          ? `${formatTime(user.shiftFrom)} - ${formatTime(
                              user.shiftTo
                            )}`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Status</p>
                      <span className="text-gray-900 fs-13">
                        {user.status || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card rounded-0 border-0">
              <div className="card-header border-0 rounded-0 bg-light d-flex align-items-center">
                <h6>Emergency Contact</h6>
              </div>
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Phone Number</p>
                      <span className="text-gray-900 fs-13">
                        {user.emergencyNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
