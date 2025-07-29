import React, { useState, useEffect } from "react";
import { Form, Dropdown, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAllAttendanceQuery,
  useGetAttendanceQuery,
} from "../../api/attendanceApi";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import moment from "moment";

const AttendanceWrapper = ({ userId }) => {
  const [filters, setFilters] = useState({
    status: "",
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
    ...filters,
  });
  const {
    data: userAttendance,
    isLoading: isUserAttendanceLoading,
    error: userAttendanceError,
  } = useGetAttendanceQuery(
    { userId, startDate: filters.startDate, endDate: filters.endDate },
    { skip: !userId }
  );

  // Calculate overview metrics
  const calculateOverview = () => {
    if (!userAttendance)
      return {
        totalWorkingDays: 0,
        absentDays: 0,
        presentDays: 0,
        halfDays: 0,
        lateDays: 0,
        holidays: 0,
      };

    const totalWorkingDays =
      moment(filters.endDate).diff(moment(filters.startDate), "days") + 1;
    const presentDays = userAttendance.filter(
      (att) => att.status === "present"
    ).length;
    const absentDays = userAttendance.filter(
      (att) => att.status === "absent"
    ).length;
    // Placeholder logic for halfDays, lateDays, holidays (adjust based on your data)
    const halfDays = 0; // Add logic if half-day status exists
    const lateDays = 0; // Add logic if late status exists
    const holidays = 0; // Fetch holidays from another API or config

    return {
      totalWorkingDays,
      absentDays,
      presentDays,
      halfDays,
      lateDays,
      holidays,
    };
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
      // Error handled by transformErrorResponse
    }
  };

  // Handle clock-out
  const handleClockOut = async () => {
    try {
      await clockOut({ userId }).unwrap();
    } catch (error) {
      // Error handled by transformErrorResponse
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!allAttendance?.attendances?.length) {
      toast.error("No data to export");
      return;
    }

    const doc = new jsPDF();
    doc.text("Attendance Report", 20, 10);
    let y = 20;
    allAttendance.attendances.forEach((att, index) => {
      doc.text(
        `${index + 1}. ${new Date(att.date).toLocaleDateString()} - ${
          att.status
        } - Clock In: ${
          att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : "N/A"
        }`,
        20,
        y
      );
      y += 10;
    });
    doc.save("attendance-report.pdf");
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!allAttendance?.attendances?.length) {
      toast.error("No data to export");
      return;
    }

    const data = allAttendance.attendances.map((att) => ({
      Date: new Date(att.date).toLocaleDateString(),
      Status: att.status,
      "Clock In": att.clockIn
        ? new Date(att.clockIn).toLocaleTimeString()
        : "N/A",
      "Clock Out": att.clockOut
        ? new Date(att.clockOut).toLocaleTimeString()
        : "N/A",
      "User Name": att.user?.name || "N/A",
      "User Email": att.user?.email || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance-report.xlsx");
  };

  // Handle refresh
  const handleRefresh = () => {
    setFilters({
      status: "",
      startDate: moment().startOf("month").format("YYYY-MM-DD"),
      endDate: moment().endOf("month").format("YYYY-MM-DD"),
    });
    setPage(1);
    toast.info("Attendance data refreshed");
  };

  // Error handling
  useEffect(() => {
    if (allAttendanceError) {
      toast.error(
        allAttendanceError.message || "Failed to fetch all attendance"
      );
    }
    if (userAttendanceError) {
      toast.error(
        userAttendanceError.message || "Failed to fetch user attendance"
      );
    }
  }, [allAttendanceError, userAttendanceError]);

  // Render overview
  const renderOverview = () => (
    <div className="row">
      <div className="col-xl-3 col-md-6">
        <div className="card border-0" style={{ background: "#e31e24" }}>
          <div className="card-body d-flex align-items-center justify-content-between">
            <div>
              <p className="mb-1 text-white">Total Employees</p>
              <h4 className="text-white"></h4>
            </div>
            <div>
              <span className="avatar avatar-lg ">
                <i className="ti ti-users-group"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="card border-0" style={{ background: "#e31e24" }}>
          <div className="card-body d-flex align-items-center justify-content-between">
            <div>
              <p className="mb-1 text-white">Active</p>
              <h4 className="text-white"></h4>
            </div>
            <div>
              <span className="avatar avatar-lg ">
                <i className="ti ti-user-star"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="card border-0" style={{ background: "#e31e24" }}>
          <div className="card-body d-flex align-items-center justify-content-between">
            <div>
              <p className="mb-1 text-white">Inactive</p>
              <h4 className="text-white"></h4>
            </div>
            <div>
              <span className="avatar avatar-lg">
                <i className="ti ti-user-exclamation"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="card border-0" style={{ background: "#e31e24" }}>
          <div className="card-body d-flex align-items-center justify-content-between">
            <div>
              <p className="mb-1 text-white">New Joiners</p>
              <h4 className="text-white"></h4>
            </div>
            <div>
              <span className="avatar avatar-lg ">
                <i className="ti ti-user-check"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render table
  const renderTable = () => {
    if (isAllAttendanceLoading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p>Loading attendance...</p>
        </div>
      );
    }

    if (!allAttendance?.attendances?.length) {
      return (
        <div className="text-center py-4 text-muted">
          No attendance records found.
        </div>
      );
    }

    return (
      <div className="cm-table-wrapper">
        <table className="cm-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Production</th>
              <th>Break</th>
              <th>Overtime</th>
              <th>Progress</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {allAttendance.attendances.map((att) => {
              const clockIn = att.clockIn ? new Date(att.clockIn) : null;
              const clockOut = att.clockOut ? new Date(att.clockOut) : null;
              const totalHours =
                clockIn && clockOut
                  ? ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2) + "h"
                  : "N/A";
              // Placeholder calculations (adjust based on your logic)
              const production = totalHours !== "N/A" ? "9h 00m" : "0h 00m";
              const breakTime = "1h 13m"; // Add logic if available
              const overtime = "0h 00m"; // Add logic if available
              const progress = { success: 60, warning: 20, danger: 10 }; // Add logic

              return (
                <tr key={att._id}>
                  <td>{new Date(att.date).toLocaleDateString()}</td>
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
                  <td>{clockIn ? clockIn.toLocaleTimeString() : "N/A"}</td>
                  <td>{clockOut ? clockOut.toLocaleTimeString() : "N/A"}</td>
                  <td>{production}</td>
                  <td>{breakTime}</td>
                  <td>{overtime}</td>
                  <td>
                    <div className="progress attendance bg-secondary-transparent">
                      <div
                        className="progress-bar progress-bar-success"
                        role="progressbar"
                        style={{ width: `${progress.success}%` }}
                      ></div>
                      <div
                        className="progress-bar progress-bar-warning"
                        role="progressbar"
                        style={{ width: `${progress.warning}%` }}
                      ></div>
                      <div
                        className="progress-bar progress-bar-danger"
                        role="progressbar"
                        style={{ width: `${progress.danger}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>{totalHours}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {isUserAttendanceLoading ? (
          <Spinner animation="border" variant="primary" />
        ) : (
          renderOverview()
        )}

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <Form.Control
                  type="text"
                  placeholder="Search"
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <Dropdown>
                <Dropdown.Toggle
                  variant="white"
                  className="btn btn-md d-inline-flex align-items-center"
                >
                  Select Status: {filters.status || "All"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("status", "")}
                  >
                    All
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("status", "present")}
                  >
                    Present
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("status", "absent")}
                  >
                    Absent
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown>
                <Dropdown.Toggle
                  variant="white"
                  className="btn btn-md d-inline-flex align-items-center"
                >
                  Sort By: {filters.sortBy || "Last 7 Days"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("sortBy", "Last 7 Days")}
                  >
                    Last 7 Days
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("sortBy", "Last Month")}
                  >
                    Last Month
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("sortBy", "Ascending")}
                  >
                    Ascending
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("sortBy", "Descending")}
                  >
                    Descending
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          {renderTable()}
        </div>
      </div>
    </div>
  );
};

export default AttendanceWrapper;
