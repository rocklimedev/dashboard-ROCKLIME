import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../api/userApi";
import { useGetRolesQuery } from "../../api/rolesApi";
import { useForgotPasswordMutation } from "../../api/authApi";
import { SearchOutlined } from "@ant-design/icons";
import moment from "moment";
import { toast } from "react-toastify";
import ProfileForm from "./ProfileForm";
import DataTable from "./DataTable";
import Avatar from "react-avatar";
import "./profile.css";
import {
  LeftOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Button, Modal, Input, Form as AntdForm, Switch, Image } from "antd";
import PageHeader from "../Common/PageHeader";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAllAttendanceQuery,
  useGetAttendanceQuery,
} from "../../api/attendanceApi";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

import DataTablePagination from "../Common/DataTablePagination";

const Profile = () => {
  // Queries
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetProfileQuery();
  const {
    data: rolesData,
    isLoading: isRolesLoading,
    error: rolesError,
  } = useGetRolesQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [forgotPassword, { isLoading: isResetting }] =
    useForgotPasswordMutation();

  const userId = profile?.user?.userId;
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    sortBy: "Recently Added",
    startDate: moment().startOf("month").format("YYYY-MM-DD"),
    endDate: moment().endOf("month").format("YYYY-MM-DD"),
  });
  const [page, setPage] = useState(1);
  const limit = 10;

  // RTK Query hooks
  const [clockIn, { isLoading: isClockInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();
  const {
    data: allAttendance,
    isLoading: isAllAttendanceLoading,
    error: allAttendanceError,
  } = useGetAllAttendanceQuery({
    page,
    limit,
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const {
    data: userAttendance,
    isLoading: isUserAttendanceLoading,
    error: userAttendanceError,
  } = useGetAttendanceQuery(
    { userId, startDate: filters.startDate, endDate: filters.endDate },
    { skip: !userId }
  );

  // Check if user has clocked in/out today
  const todayAttendance = useMemo(() => {
    return (
      userAttendance?.find(
        (att) =>
          moment(att.date).isSame(moment(), "day") && att.status === "present"
      ) || null
    );
  }, [userAttendance]);

  // Memoized grouped attendance
  const groupedAttendance = useMemo(
    () => ({
      All: allAttendance?.attendances || [],
      Present:
        allAttendance?.attendances?.filter(
          (att) => att.status?.toLowerCase() === "present"
        ) || [],
      Absent:
        allAttendance?.attendances?.filter(
          (att) => att.status?.toLowerCase() === "absent"
        ) || [],
    }),
    [allAttendance?.attendances]
  );

  // Filtered and sorted attendance
  const filteredAttendance = useMemo(() => {
    let result = groupedAttendance[filters.status || "All"] || [];

    // Apply search filter
    if (filters.search.trim()) {
      result = result.filter((att) =>
        [att.user?.name, att.user?.email]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(filters.search.toLowerCase())
          )
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "Ascending":
        return [...result].sort((a, b) =>
          (a.user?.name || "").localeCompare(b.user?.name || "")
        );
      case "Descending":
        return [...result].sort((a, b) =>
          (b.user?.name || "").localeCompare(a.user?.name || "")
        );
      case "Recently Added":
        return [...result].sort((a, b) => new Date(b.date) - new Date(a.date));
      default:
        return result;
    }
  }, [groupedAttendance, filters.status, filters.search, filters.sortBy]);

  // Paginated attendance
  const paginatedAttendance = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredAttendance.slice(startIndex, startIndex + limit);
  }, [filteredAttendance, page]);

  // Calculate overview metrics
  const calculateOverview = () => {
    if (!userAttendance) {
      return { totalDays: 0, presentDays: 0, absentDays: 0 };
    }

    const totalDays =
      moment(filters.endDate).diff(moment(filters.startDate), "days") + 1;
    const presentDays = userAttendance.filter(
      (att) => att.status === "present"
    ).length;
    const absentDays = userAttendance.filter(
      (att) => att.status === "absent"
    ).length;

    return { totalDays, presentDays, absentDays };
  };

  const overview = calculateOverview();

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // Handle clock-in
  const handleClockIn = async () => {
    try {
      await clockIn({ userId }).unwrap();
    } catch (error) {
      toast.error(
        `Failed to clock in: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Handle clock-out
  const handleClockOut = async () => {
    try {
      await clockOut({ userId }).unwrap();
    } catch (error) {
      toast.error(
        `Failed to clock out: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!filteredAttendance.length) {
      toast.error("No data to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Attendance Report", 20, 10);
    let y = 20;
    filteredAttendance.forEach((att, index) => {
      doc.text(
        `${index + 1}. Date: ${moment(att.date).format(
          "MM/DD/YYYY"
        )} | Status: ${att.status} | Clock In: ${
          att.clockIn ? moment(att.clockIn).format("hh:mm A") : "N/A"
        } | Clock Out: ${
          att.clockOut ? moment(att.clockOut).format("hh:mm A") : "N/A"
        } | User: ${att.user?.name || "N/A"} (${att.user?.email || "N/A"})`,
        20,
        y
      );
      y += 10;
    });
    doc.save("attendance-report.pdf");
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!filteredAttendance.length) {
      toast.error("No data to export");
      return;
    }

    const data = filteredAttendance.map((att) => ({
      Date: moment(att.date).format("MM/DD/YYYY"),
      Status: att.status,
      "Clock In": att.clockIn ? moment(att.clockIn).format("hh:mm A") : "N/A",
      "Clock Out": att.clockOut
        ? moment(att.clockOut).format("hh:mm A")
        : "N/A",
      "User Name": att.user?.name || "N/A",
      "User Email": att.user?.email || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance-report.xlsx");
  };

  // Handle clear filters
  const clearFilters = () => {
    setFilters({
      status: "",
      search: "",
      sortBy: "Recently Added",
      startDate: moment().startOf("month").format("YYYY-MM-DD"),
      endDate: moment().endOf("month").format("YYYY-MM-DD"),
    });
    setPage(1);
  };

  // Error handling
  useEffect(() => {
    if (allAttendanceError) {
      toast.error(
        allAttendanceError.data?.message || "Failed to fetch all attendance"
      );
    }
    if (userAttendanceError) {
      toast.error(
        userAttendanceError.data?.message || "Failed to fetch user attendance"
      );
    }
  }, [allAttendanceError, userAttendanceError]);

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [form] = AntdForm.useForm();
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = profile?.user?.roles?.includes("SUPER_ADMIN");

  // Format roles
  const roles = Array.isArray(profile?.user?.roles)
    ? profile?.user?.roles.join(", ")
    : profile?.user?.roles || "User";

  // Derive team from roles
  const team = profile?.user?.roles?.includes("SALES")
    ? "Sales Team"
    : profile?.user?.team || "N/A";

  // Format time
  const formatTime = (time) => {
    if (!time) return "N/A";
    const date = new Date(`1970-01-01T${time}`);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date
  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  };

  // Initialize form
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Redirecting to login...");
      window.location.href = "/login";
    }

    if (profile?.user) {
      const user = profile.user;
      form.setFieldsValue({
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
        dateOfBirth: user.dateOfBirth ? moment(user.dateOfBirth) : null,
        shiftFrom: user.shiftFrom ? moment(user.shiftFrom, "HH:mm:ss") : null,
        shiftTo: user.shiftTo ? moment(user.shiftTo, "HH:mm:ss") : null,
        bloodGroup: user.bloodGroup || null,
        emergencyNumber: user.emergencyNumber || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        postalCode: user.address?.postalCode || "",
        country: user.address?.country || "",
      });
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [profile, form]);

  // Handlers
  const handleAvatarUpload = ({ file }) => {
    if (file.status === "done") {
      setAvatarUrl(file.response.url);
      localStorage.setItem(`avatar_${profile.user.userId}`, file.response.url);
    } else if (file.status === "error") {
      toast.error("Failed to upload avatar.");
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getFieldValue("email");
    if (!email) return toast.error("Email is required to reset password.");

    try {
      await forgotPassword({ email }).unwrap();
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      toast.error(
        `Failed to send reset link: ${error.data?.error || "Unknown error"}`
      );
    }
  };

  const handleSave = async (values) => {
    if (!profile?.user?.userId) return toast.error("User ID not found.");

    const updatedData = {
      username: values.username,
      name: values.name,
      email: values.email,
      mobileNumber: values.mobileNumber,
      dateOfBirth: values.dateOfBirth
        ? moment(values.dateOfBirth).format("YYYY-MM-DD")
        : null,
      shiftFrom: values.shiftFrom
        ? moment(values.shiftFrom).format("HH:mm:ss")
        : null,
      shiftTo: values.shiftTo
        ? moment(values.shiftTo).format("HH:mm:ss")
        : null,
      bloodGroup: values.bloodGroup || null,
      emergencyNumber: values.emergencyNumber || null,
      address: {
        street: values.street || "",
        city: values.city || "",
        state: values.state || "",
        postalCode: values.postalCode || "",
        country: values.country || "",
      },
      avatarUrl: avatarUrl || null,
    };

    try {
      await updateProfile(updatedData).unwrap();
      setIsEditing(false);
    } catch (error) {
      toast.error(
        `Failed to update profile: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Loading and error states
  if (isProfileLoading || isRolesLoading) {
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

  if (profileError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            Error loading data: {profileError?.data?.message || "Unknown error"}
            <button
              className="btn btn-link"
              onClick={() => {
                refetchProfile();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            Error loading roles: {rolesError?.message || "Unknown error"}
          </div>
        </div>
      </div>
    );
  }

  if (!profile?.user || !userId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-info">
            No user profile data available.
          </div>
        </div>
      </div>
    );
  }

  const user = profile.user;
  const renderTable = () => {
    if (isAllAttendanceLoading || isUserAttendanceLoading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading attendance...</p>
        </div>
      );
    }

    if (!paginatedAttendance.length) {
      return (
        <div className="text-center py-4 text-muted">
          No attendance records found.
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>User Name</th>
              <th>User Email</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAttendance.map((att) => {
              const clockIn = att.clockIn ? new Date(att.clockIn) : null;
              const clockOut = att.clockOut ? new Date(att.clockOut) : null;
              const totalHours =
                clockIn && clockOut
                  ? ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2) + "h"
                  : "N/A";

              return (
                <tr key={att._id}>
                  <td>{moment(att.date).format("MM/DD/YYYY")}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        att.status === "present" ? "success" : "danger"
                      } d-inline-flex align-items-center badge-xs`}
                    >
                      <i className="ti ti-point-filled me-1"></i>
                      {att.status.charAt(0).toUpperCase() + att.status.slice(1)}
                    </span>
                  </td>
                  <td>{clockIn ? moment(clockIn).format("hh:mm A") : "N/A"}</td>
                  <td>
                    {clockOut ? moment(clockOut).format("hh:mm A") : "N/A"}
                  </td>
                  <td>{att.user?.name || "N/A"}</td>
                  <td>{att.user?.email || "N/A"}</td>
                  <td>{totalHours}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAttendance.length > limit && (
          <div className="pagination-section mt-4">
            <DataTablePagination
              totalItems={filteredAttendance.length}
              itemNo={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-xl-4 theiaStickySidebar">
            <div className="card rounded-0 border-0">
              <div className="card-header rounded-0 bg-primary d-flex align-items-center">
                <span className="avatar avatar-xl avatar-rounded flex-shrink-0 border border-white border-3 me-3">
                  <Avatar
                    src={avatarUrl || undefined}
                    name={user.name || "User"}
                    size="60"
                    round={true}
                    textSizeRatio={2.5}
                    alt="User Avatar"
                  />
                </span>
                <div className="me-3">
                  <h6 className="text-white mb-1">{user.name || "N/A"}</h6>
                  <span className="badge bg-purple-transparent text-purple">
                    {roles}
                  </span>
                </div>
                <div>
                  <Button
                    type="primary"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
              <div className="card-body">
                {/* Moved all basic information to the sidebar */}
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <TeamOutlined />
                    Team
                  </span>
                  <p className="text-dark">{team}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <CalendarOutlined />
                    Date Of Join
                  </span>
                  <p className="text-dark">{formatDate(user.createdAt)}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    Phone
                  </span>
                  <p className="text-dark">{user.mobileNumber || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    Email
                  </span>
                  <p className="text-dark">
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                  </p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    Username
                  </span>
                  <p className="text-dark">{user.username || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    Birthday
                  </span>
                  <p className="text-dark">{formatDate(user.dateOfBirth)}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    Blood Group
                  </span>
                  <p className="text-dark">{user.bloodGroup || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    Shift
                  </span>
                  <p className="text-dark">
                    {user.shiftFrom && user.shiftTo
                      ? `${formatTime(user.shiftFrom)} - ${formatTime(
                          user.shiftTo
                        )}`
                      : "N/A"}
                  </p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    Emergency Contact
                  </span>
                  <p className="text-dark">{user.emergencyNumber || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    Status
                  </span>
                  <p className="text-dark">{user.status || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <EnvironmentOutlined />
                    Address
                  </span>
                  <p className="text-dark">
                    {user.address
                      ? `${user.address.street}, ${user.address.city}, ${user.address.state}, ${user.address.postalCode}, ${user.address.country}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-8">
            {isEditing ? (
              <div className="card rounded-0 border-0">
                <div className="card-header border-0 rounded-0 bg-light d-flex align-items-center">
                  <h6>Edit Profile</h6>
                </div>
                <div className="card-body">
                  <ProfileForm
                    form={form}
                    handleSave={handleSave}
                    isUpdating={isUpdating}
                    setIsEditing={setIsEditing}
                    handleAvatarUpload={handleAvatarUpload}
                  />
                </div>
              </div>
            ) : (
              <div className="card rounded-0 border-0">
                <div className="card-body">
                  {userId && (
                    <div className="mb-3">
                      <Button
                        type="primary"
                        className="me-2"
                        onClick={handleClockIn}
                        disabled={
                          isClockInLoading ||
                          (todayAttendance && !todayAttendance.clockOut)
                        }
                      >
                        {isClockInLoading ? "Clocking In..." : "Clock In"}
                      </Button>
                      <Button
                        type="default"
                        onClick={handleClockOut}
                        disabled={
                          isClockOutLoading ||
                          !todayAttendance ||
                          todayAttendance.clockOut
                        }
                      >
                        {isClockOutLoading ? "Clocking Out..." : "Clock Out"}
                      </Button>
                      <Button
                        type="default"
                        className="ms-2"
                        onClick={exportToPDF}
                      >
                        Export to PDF
                      </Button>
                      <Button
                        type="default"
                        className="ms-2"
                        onClick={exportToExcel}
                      >
                        Export to Excel
                      </Button>
                    </div>
                  )}

                  <div className="row">
                    <div className="col-lg-4">
                      <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                        <h6 className="me-2">Status</h6>
                        <ul
                          className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                          id="pills-tab"
                          role="tablist"
                        >
                          {Object.keys(groupedAttendance).map((status) => (
                            <li
                              className="nav-item"
                              role="presentation"
                              key={status}
                            >
                              <button
                                className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                                  (filters.status || "All") === status
                                    ? "active"
                                    : ""
                                }`}
                                id={`tab-${status}`}
                                data-bs-toggle="pill"
                                data-bs-target={`#pills-${status}`}
                                type="button"
                                role="tab"
                                aria-selected={
                                  (filters.status || "All") === status
                                }
                                onClick={() =>
                                  handleFilterChange(
                                    "status",
                                    status === "All" ? "" : status.toLowerCase()
                                  )
                                }
                              >
                                {status} ({groupedAttendance[status].length})
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="col-lg-8">
                      <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                        <div className="d-flex align-items-center border p-2 rounded">
                          <span className="d-inline-flex me-2">Sort By: </span>
                          <div className="dropdown">
                            <a
                              href="#"
                              className="dropdown-toggle btn btn-white d-inline-flex align-items-center border-0 bg-transparent p-0 text-dark"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              {filters.sortBy}
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              {[
                                "Recently Added",
                                "Ascending",
                                "Descending",
                              ].map((option) => (
                                <li key={option}>
                                  <a
                                    href="#"
                                    className="dropdown-item rounded-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleFilterChange("sortBy", option);
                                    }}
                                  >
                                    {option}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="input-icon-start position-relative">
                          <span className="input-icon-addon">
                            <SearchOutlined />
                          </span>
                          <Input
                            type="text"
                            className="form-control"
                            placeholder="Search Attendance"
                            value={filters.search}
                            onChange={(e) =>
                              handleFilterChange("search", e.target.value)
                            }
                            aria-label="Search attendance"
                          />
                        </div>
                        <Button
                          type="default"
                          className="ms-2"
                          onClick={clearFilters}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="tab-content" id="pills-tabContent">
                    {Object.keys(groupedAttendance).map((status) => (
                      <div
                        className={`tab-pane fade ${
                          (filters.status || "All") === status
                            ? "show active"
                            : ""
                        }`}
                        id={`pills-${status}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${status}`}
                        key={status}
                      >
                        {renderTable()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
