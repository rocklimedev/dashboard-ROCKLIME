import React, { useState, useEffect, useMemo } from "react";
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
import DataTablePagination from "../Common/DataTablePagination";
import PageHeader from "../Common/PageHeader";
import { SearchOutlined } from "@ant-design/icons";
const AttendanceWrapper = ({ userId }) => {
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
          .filter(Boolean) // Ensure field exists
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

  // Render overview

  // Render table
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
        <div className="card">
          <PageHeader
            title="Attendance"
            subtitle="Manage your Attendance"
            tableData={paginatedAttendance}
          />
        </div>
      </div>
    </div>
  );
};

export default AttendanceWrapper;
