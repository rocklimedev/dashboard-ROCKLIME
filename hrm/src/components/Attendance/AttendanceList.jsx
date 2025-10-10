import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAllAttendanceQuery,
  useGetAttendanceQuery,
} from "../../api/attendanceApi";
import { Spin, Button, Input, Select, Row, Col, Tabs } from "antd";
import moment from "moment";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { subDays } from "date-fns";
import PageHeader from "../Common/PageHeader";
import DataTablePagination from "../Common/DataTablePagination";
import "./attendancelist.css";
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TabPane } = Tabs;

const AttendanceList = ({ userId }) => {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const itemsPerPage = 10;

  // RTK Query hooks
  const {
    data: allAttendance,
    isLoading: isAllAttendanceLoading,
    error: allAttendanceError,
    refetch,
  } = useGetAllAttendanceQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: selectedStatus,
    startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : "",
    endDate: endDate ? moment(endDate).format("YYYY-MM-DD") : "",
  });

  const {
    data: userAttendance,
    isLoading: isUserAttendanceLoading,
    error: userAttendanceError,
  } = useGetAttendanceQuery(
    {
      userId,
      startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : "",
      endDate: endDate ? moment(endDate).format("YYYY-MM-DD") : "",
    },
    { skip: !userId }
  );

  const [clockIn, { isLoading: isClockInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();

  // Check if user has clocked in/out today
  const todayAttendance = useMemo(() => {
    return (
      userAttendance?.find(
        (att) =>
          moment(att.date).isSame(moment(), "day") && att.status === "present"
      ) || null
    );
  }, [userAttendance]);

  const attendances = allAttendance?.attendances || [];

  // Memoized grouped attendances
  const groupedAttendances = useMemo(
    () => ({
      All: attendances,
      Present: attendances.filter(
        (att) => att.status?.toLowerCase() === "present"
      ),
      Absent: attendances.filter(
        (att) => att.status?.toLowerCase() === "absent"
      ),
    }),
    [attendances]
  );

  // Filtered and sorted attendances
  const filteredAttendances = useMemo(() => {
    let result = groupedAttendances[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((att) =>
        [att.user?.name, att.user?.email]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply sorting
    switch (sortBy) {
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
  }, [groupedAttendances, activeTab, searchTerm, sortBy]);

  // Paginated attendances
  const paginatedAttendances = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAttendances.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAttendances, currentPage]);

  // Calculate overview metrics
  const overview = useMemo(() => {
    if (!userAttendance) {
      return { totalDays: 0, presentDays: 0, absentDays: 0 };
    }
    const totalDays = moment(endDate).diff(moment(startDate), "days") + 1;
    const presentDays = userAttendance.filter(
      (att) => att.status === "present"
    ).length;
    const absentDays = userAttendance.filter(
      (att) => att.status === "absent"
    ).length;
    return { totalDays, presentDays, absentDays };
  }, [userAttendance, startDate, endDate]);

  // Handlers
  const handleClockIn = async () => {
    try {
      await clockIn({ userId }).unwrap();
      toast.success("Clocked in successfully");
      refetch();
    } catch (error) {
      toast.error(
        `Failed to clock in: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut({ userId }).unwrap();
      toast.success("Clocked out successfully");
      refetch();
    } catch (error) {
      toast.error(
        `Failed to clock out: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    handleClearFilters();
    refetch();
  };

  const handleCollapse = () => {
    setIsTableCollapsed((prev) => !prev);
  };

  const exportToPDF = () => {
    if (!filteredAttendances.length) {
      toast.error("No data to export");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Attendance Report", 20, 10);
    doc.setFontSize(12);
    let y = 20;
    filteredAttendances.forEach((att, index) => {
      const clockIn = att.clockIn
        ? moment(att.clockIn).format("hh:mm A")
        : "N/A";
      const clockOut = att.clockOut
        ? moment(att.clockOut).format("hh:mm A")
        : "N/A";
      doc.text(
        `${index + 1}. ${moment(att.date).format("MM/DD/YYYY")} - ${
          att.user?.name || "Unknown"
        } (${att.user?.email || "N/A"}) - ${
          att.status
        } - Clock In: ${clockIn} - Clock Out: ${clockOut}`,
        20,
        y
      );
      y += 10;
    });
    doc.save("attendance-report.pdf");
  };

  const exportToExcel = () => {
    if (!filteredAttendances.length) {
      toast.error("No data to export");
      return;
    }
    const data = filteredAttendances.map((att) => ({
      Date: moment(att.date).format("MM/DD/YYYY"),
      Employee: att.user?.name || "Unknown",
      Email: att.user?.email || "N/A",
      Status: att.status,
      "Clock In": att.clockIn ? moment(att.clockIn).format("hh:mm A") : "N/A",
      "Clock Out": att.clockOut
        ? moment(att.clockOut).format("hh:mm A")
        : "N/A",
      "Total Hours":
        att.clockIn && att.clockOut
          ? (
              (new Date(att.clockOut) - new Date(att.clockIn)) /
              (1000 * 60 * 60)
            ).toFixed(2) + "h"
          : "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance-report.xlsx");
  };

  // Render table
  const renderTable = () => {
    if (isAllAttendanceLoading || isUserAttendanceLoading) {
      return (
        <div className="text-center py-4">
          <Spin tip="Loading attendance..." />
        </div>
      );
    }

    if (!paginatedAttendances.length) {
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
              <th>Employee</th>
              <th>Date</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAttendances.map((att) => {
              const clockIn = att.clockIn ? new Date(att.clockIn) : null;
              const clockOut = att.clockOut ? new Date(att.clockOut) : null;
              const totalHours =
                clockIn && clockOut
                  ? ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2) + "h"
                  : "N/A";

              return (
                <tr key={att._id}>
                  <td>
                    <div>
                      <strong>{att.user?.name || "Unknown"}</strong>
                      <br />
                      <small>{att.user?.email || "N/A"}</small>
                    </div>
                  </td>
                  <td>{moment(att.date).format("MM/DD/YYYY")}</td>
                  <td>
                    <span
                      className={`badge ${
                        att.status === "present"
                          ? "badge-success"
                          : "badge-danger"
                      }`}
                    >
                      {att.status.charAt(0).toUpperCase() + att.status.slice(1)}
                    </span>
                  </td>
                  <td>{clockIn ? moment(clockIn).format("hh:mm A") : "N/A"}</td>
                  <td>
                    {clockOut ? moment(clockOut).format("hh:mm A") : "N/A"}
                  </td>
                  <td>{totalHours}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAttendances.length > itemsPerPage && (
          <div className="pagination-section mt-4">
            <DataTablePagination
              totalItems={filteredAttendances.length}
              itemNo={itemsPerPage}
              onPageChange={setCurrentPage}
              currentPage={currentPage}
            />
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isAllAttendanceLoading || isUserAttendanceLoading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="attendance-card">
            <div className="text-center py-4">
              <Spin tip="Loading attendance data..." />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (allAttendanceError || userAttendanceError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="attendance-card">
            <div className="ant-alert ant-alert-error" role="alert">
              <strong>Error:</strong>{" "}
              {allAttendanceError?.data?.message ||
                userAttendanceError?.data?.message ||
                "Failed to load attendance data. Please try again."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="attendance-card">
          <PageHeader
            title="Attendance"
            subtitle="Manage your Attendance"
            tableData={paginatedAttendances}
          />
          <div className="card-body">
            {userId && (
              <div className="mb-3">
                <Button
                  type="primary"
                  onClick={handleClockIn}
                  disabled={
                    isClockInLoading ||
                    (todayAttendance && !todayAttendance.clockOut)
                  }
                  style={{ marginRight: 8 }}
                >
                  {isClockInLoading ? "Clocking In..." : "Clock In"}
                </Button>
                <Button
                  onClick={handleClockOut}
                  disabled={
                    isClockOutLoading ||
                    !todayAttendance ||
                    todayAttendance.clockOut
                  }
                >
                  {isClockOutLoading ? "Clocking Out..." : "Clock Out"}
                </Button>
              </div>
            )}

            {/* Overview Metrics */}
            <div className="days-overview mb-4">
              <Row gutter={[16, 16]} justify="space-between">
                <Col lg={4} xs={24} className="text-center">
                  <div className="stat-rectangle bg-primary-transparent">
                    {overview.totalDays}
                  </div>
                  <p className="fs-14">Total Days</p>
                </Col>
                <Col lg={4} xs={24} className="text-center">
                  <div className="stat-rectangle bg-success-transparent">
                    {overview.presentDays}
                  </div>
                  <p className="fs-14">Present Days</p>
                </Col>
                <Col lg={4} xs={24} className="text-center">
                  <div className="stat-rectangle bg-danger-transparent">
                    {overview.absentDays}
                  </div>
                  <p className="fs-14">Absent Days</p>
                </Col>
              </Row>
            </div>

            <Row gutter={[16, 16]}>
              <Col lg={8} xs={24}>
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  className="todo-tabs"
                >
                  {Object.keys(groupedAttendances).map((status) => (
                    <TabPane
                      tab={`${status} (${groupedAttendances[status].length})`}
                      key={status}
                    />
                  ))}
                </Tabs>
              </Col>
              <Col lg={16} xs={24}>
                <div className="d-flex align-items-center justify-content-end flex-wrap row-gap-3">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="form-control datetimepicker"
                    placeholderText="Start Date"
                    dateFormat="dd/MM/yyyy"
                    style={{ marginRight: 8 }}
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="form-control datetimepicker"
                    placeholderText="End Date"
                    dateFormat="dd/MM/yyyy"
                    style={{ marginRight: 8 }}
                  />
                  <Select
                    value={sortBy}
                    onChange={(value) => setSortBy(value)}
                    style={{ width: 150, marginRight: 8 }}
                  >
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Ascending">Name (A-Z)</Option>
                    <Option value="Descending">Name (Z-A)</Option>
                  </Select>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search by employee name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 200 }}
                  />
                </div>
              </Col>
            </Row>

            <div className="mt-4">
              {filteredAttendances.length === 0 ? (
                <p className="text-muted">
                  No {activeTab.toLowerCase()} attendance records match the
                  applied filters
                </p>
              ) : !isTableCollapsed ? (
                renderTable()
              ) : null}
            </div>

            <div className="mt-3">
              <Button onClick={handleClearFilters} style={{ marginRight: 8 }}>
                Clear Filters
              </Button>
              <Button onClick={handleRefresh} style={{ marginRight: 8 }}>
                Refresh
              </Button>
              <Button onClick={exportToPDF} style={{ marginRight: 8 }}>
                Export to PDF
              </Button>
              <Button onClick={exportToExcel}>Export to Excel</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;
