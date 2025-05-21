import React, { useState, useEffect } from "react";
import { Form, Dropdown } from "react-bootstrap";
import { toast } from "sonner"; // Changed import
import Flatpickr from "react-flatpickr";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import moment from "moment";
import { useGetAllAttendanceQuery } from "../../api/attendanceApi";

const AttendanceList = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    date: moment().format("YYYY-MM-DD"),
  });
  const [page, setPage] = useState(1);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const limit = 10;

  // Fetch attendance data
  const {
    data: allAttendance,
    isLoading: isAllAttendanceLoading,
    error: allAttendanceError,
    refetch,
  } = useGetAllAttendanceQuery({
    page,
    limit,
    search: filters.search,
    status: filters.status,
    startDate: filters.date,
    endDate: filters.date,
  });

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // Handle date change
  const handleDateChange = (selectedDates) => {
    const date = selectedDates[0]
      ? moment(selectedDates[0]).format("YYYY-MM-DD")
      : "";
    handleFilterChange("date", date);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!allAttendance?.attendances?.length) {
      toast.error("No data to export"); // Sonner toast
      return;
    }

    const doc = new jsPDF();
    doc.text("Attendance Report", 20, 10);
    let y = 20;
    allAttendance.attendances.forEach((att, index) => {
      const clockIn = att.clockIn
        ? new Date(att.clockIn).toLocaleTimeString()
        : "N/A";
      const clockOut = att.clockOut
        ? new Date(att.clockOut).toLocaleTimeString()
        : "N/A";
      doc.text(
        `${index + 1}. ${att.user?.name || "Unknown"} - ${
          att.status
        } - Clock In: ${clockIn}`,
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
      toast.error("No data to export"); // Sonner toast
      return;
    }

    const data = allAttendance.attendances.map((att) => ({
      Employee: att.user?.name || "Unknown",
      Role: att.user?.roles?.join(", ") || "N/A",
      Status: att.status,
      "Clock In": att.clockIn
        ? new Date(att.clockIn).toLocaleTimeString()
        : "N/A",
      "Clock Out": att.clockOut
        ? new Date(att.clockOut).toLocaleTimeString()
        : "N/A",
      Production: att.production || "N/A",
      Break: att.break || "N/A",
      Overtime: att.overtime || "N/A",
      "Total Hours": att.totalHours || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance-report.xlsx");
  };

  // Handle refresh
  const handleRefresh = () => {
    setFilters({
      search: "",
      status: "",
      date: moment().format("YYYY-MM-DD"),
    });
    setPage(1);
    refetch();
    toast.info("Attendance data refreshed"); // Sonner toast
  };

  // Handle collapse
  const handleCollapse = () => {
    setIsTableCollapsed((prev) => !prev);
  };

  // Error handling
  useEffect(() => {
    if (allAttendanceError) {
      toast.error(allAttendanceError.message || "Failed to fetch attendance"); // Sonner toast
    }
  }, [allAttendanceError]);

  // Render table
  const renderTable = () => {
    if (isAllAttendanceLoading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
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
      <div className="table-responsive">
        <table className="table datatable">
          <thead className="thead-light">
            <tr>
              <th>Employee</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Production</th>
              <th>Break</th>
              <th>Overtime</th>
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
              // Use stored fields or calculate placeholders
              const production =
                att.production ||
                (totalHours !== "N/A" ? totalHours : "0h 00m");
              const breakTime = att.break || "0h 00m";
              const overtime = att.overtime || "0h 00m";

              return (
                <tr key={att._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <a href="#" className="avatar avatar-md me-2">
                        <img
                          src={
                            att.user?.avatar || "assets/img/users/user-01.jpg"
                          }
                          alt="product"
                        />
                      </a>
                      <div>
                        <h6>
                          <a href="#">{att.user?.name || "Unknown"}</a>
                        </h6>
                        <span>{att.user?.roles?.join(", ") || "N/A"}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${
                        att.status === "present"
                          ? "success"
                          : att.status === "late"
                          ? "warning"
                          : "danger"
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
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Attendance</h4>
              <h6>Manage your Attendance</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li className="me-2">
              <a
                href="#"
                onClick={exportToPDF}
                data-bs-toggle="tooltip"
                title="PDF"
              >
                <img src="assets/img/icons/pdf.svg" alt="img" />
              </a>
            </li>
            <li className="me-2">
              <a
                href="#"
                onClick={exportToExcel}
                data-bs-toggle="tooltip"
                title="Excel"
              >
                <img src="assets/img/icons/excel.svg" alt="img" />
              </a>
            </li>
            <li className="me-2">
              <a
                href="#"
                onClick={handleRefresh}
                data-bs-toggle="tooltip"
                title="Refresh"
              >
                <i className="ti ti-refresh"></i>
              </a>
            </li>
            <li className="me-2">
              <a
                href="#"
                onClick={handleCollapse}
                data-bs-toggle="tooltip"
                title={isTableCollapsed ? "Expand" : "Collapse"}
                id="collapse-header"
              >
                <i
                  className={
                    isTableCollapsed ? "ti ti-chevron-down" : "ti ti-chevron-up"
                  }
                ></i>
              </a>
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <Form.Control
                  type="text"
                  placeholder="Search by employee name"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div className="me-2 date-select-small">
                <div className="input-addon-left position-relative">
                  <Flatpickr
                    value={filters.date}
                    onChange={handleDateChange}
                    options={{ dateFormat: "Y-m-d" }}
                    className="form-control datetimepicker"
                    placeholder="Select Date"
                  />
                  <span className="cus-icon">
                    <i data-feather="calendar" className="feather-clock"></i>
                  </span>
                </div>
              </div>
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
                  <Dropdown.Item
                    onClick={() => handleFilterChange("status", "late")}
                  >
                    Late
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          <div
            className="card-body p-0"
            style={{ display: isTableCollapsed ? "none" : "block" }}
          >
            {renderTable()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;
