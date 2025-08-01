import React, { useState, useMemo } from "react";
import {
  Input,
  Select,
  Button,
  Table,
  Card,
  Space,
  Typography,
  Alert,
} from "antd";
import { Spinner } from "react-bootstrap";
import {
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import moment from "moment";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import {
  useGetAllAttendanceQuery,
  useGetAttendanceQuery,
  useClockInMutation,
  useClockOutMutation,
} from "../../api/attendanceApi";
import PageHeader from "../Common/PageHeader";
import DataTablePagination from "../Common/DataTablePagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { subDays } from "date-fns";
import "./attendancelist.css";

const { Option } = Select;
const { Text } = Typography;

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
  const itemsPerPage = 12;

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

  const { data: userAttendance, isLoading: isUserAttendanceLoading } =
    useGetAttendanceQuery(
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
        att.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      toast.success("Clocked in successfully!");
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
      toast.success("Clocked out successfully!");
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
    toast.info("Filters cleared");
  };

  const handleRefresh = () => {
    handleClearFilters();
    refetch();
    toast.info("Attendance data refreshed");
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

  // Table columns
  const columns = [
    {
      title: "Employee",
      dataIndex: "user",
      key: "employee",
      render: (user) => (
        <Space>
          <div>
            <Text strong>{user?.name || "Unknown"}</Text>
            <br />
            <Text type="secondary">{user?.email || "N/A"}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date).format("MM/DD/YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`badge ${
            status === "present" ? "bg-success" : "bg-danger"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      title: "Clock In",
      dataIndex: "clockIn",
      key: "clockIn",
      render: (clockIn) =>
        clockIn ? moment(clockIn).format("hh:mm A") : "N/A",
    },
    {
      title: "Clock Out",
      dataIndex: "clockOut",
      key: "clockOut",
      render: (clockOut) =>
        clockOut ? moment(clockOut).format("hh:mm A") : "N/A",
    },
    {
      title: "Total Hours",
      key: "totalHours",
      render: (_, record) =>
        record.clockIn && record.clockOut
          ? (
              (new Date(record.clockOut) - new Date(record.clockIn)) /
              (1000 * 60 * 60)
            ).toFixed(2) + "h"
          : "N/A",
    },
  ];

  // Loading state
  if (isAllAttendanceLoading || isUserAttendanceLoading) {
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
            <p>Loading attendance data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (allAttendanceError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert
              message="Error"
              description={
                allAttendanceError.data?.message ||
                "Failed to load attendance data. Please try again."
              }
              type="error"
              showIcon
            />
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
                  className="me-2"
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
                    {Object.keys(groupedAttendances).map((status) => (
                      <li className="nav-item" role="presentation" key={status}>
                        <button
                          className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                            activeTab === status ? "active" : ""
                          }`}
                          id={`tab-${status}`}
                          data-bs-toggle="pill"
                          data-bs-target={`#pills-${status}`}
                          type="button"
                          role="tab"
                          aria-selected={activeTab === status}
                          onClick={() => setActiveTab(status)}
                        >
                          {status} ({groupedAttendances[status].length})
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="form-control datetimepicker me-2"
                    placeholderText="Start Date"
                    dateFormat="dd/MM/yyyy"
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="form-control datetimepicker me-2"
                    placeholderText="End Date"
                    dateFormat="dd/MM/yyyy"
                  />
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: 150 }}
                    className="me-2"
                  >
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Ascending">Name (A-Z)</Option>
                    <Option value="Descending">Name (Z-A)</Option>
                  </Select>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search by employee name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 200 }}
                    className="me-2"
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    className="me-2"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
            <Button
              icon={isTableCollapsed ? <DownOutlined /> : <UpOutlined />}
              onClick={handleCollapse}
              className="mb-3"
            >
              {isTableCollapsed ? "Show Table" : "Hide Table"}
            </Button>
            <div className="tab-content" id="pills-tabContent">
              {Object.entries(groupedAttendances).map(([status, list]) => (
                <div
                  className={`tab-pane fade ${
                    activeTab === status ? "show active" : ""
                  }`}
                  id={`pills-${status}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${status}`}
                  key={status}
                >
                  {filteredAttendances.length === 0 ? (
                    <p className="text-muted">
                      No {status.toLowerCase()} attendance records match the
                      applied filters
                    </p>
                  ) : !isTableCollapsed ? (
                    <div className="table-responsive">
                      <Table
                        columns={columns}
                        dataSource={paginatedAttendances}
                        pagination={false}
                        rowKey="_id"
                        className="attendance-table table table-hover"
                      />
                      <div className="pagination-section mt-4">
                        <DataTablePagination
                          totalItems={filteredAttendances.length}
                          itemNo={itemsPerPage}
                          onPageChange={setCurrentPage}
                          currentPage={currentPage}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;
