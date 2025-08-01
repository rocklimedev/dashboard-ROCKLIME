import React, { useState, useMemo } from "react";
import {
  Input,
  Select,
  Button,
  Table,
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
  DownloadOutlined,
  ReloadOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import moment from "moment";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useGetAllAttendanceQuery } from "../../api/attendanceApi";
import PageHeader from "../Common/PageHeader";
import DataTablePagination from "../Common/DataTablePagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { subDays } from "date-fns";
import "./attendancelist.css";

const { Option } = Select;
const { Text } = Typography;

const AttendanceList = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const itemsPerPage = 12;

  // Query
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
    startDate: selectedDate ? moment(selectedDate).format("YYYY-MM-DD") : "",
    endDate: selectedDate ? moment(selectedDate).format("YYYY-MM-DD") : "",
  });

  const attendances = allAttendance?.attendances || [];

  // Memoized grouped attendances for tab-based filtering
  const groupedAttendances = useMemo(
    () => ({
      All: attendances,
      Present: attendances.filter(
        (att) => att.status?.toLowerCase() === "present"
      ),
      Absent: attendances.filter(
        (att) => att.status?.toLowerCase() === "absent"
      ),
      Late: attendances.filter((att) => att.status?.toLowerCase() === "late"),
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

    // Apply date filter
    if (selectedDate) {
      result = result.filter((att) => {
        const attDate = new Date(att.clockIn || att.createdDate);
        return attDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Apply status filter from dropdown
    if (selectedStatus) {
      result = result.filter(
        (att) => att.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          a.user?.name?.localeCompare(b.user?.name || "")
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          b.user?.name?.localeCompare(a.user?.name || "")
        );
        break;
      case "Recently Added":
      case "Created Date":
        result = [...result].sort(
          (a, b) =>
            new Date(b.clockIn || b.createdDate) -
            new Date(a.clockIn || a.createdDate)
        );
        break;
      case "Last 7 Days":
        const sevenDaysAgo = subDays(new Date(), 7);
        result = result.filter(
          (att) => new Date(att.clockIn || att.createdDate) >= sevenDaysAgo
        );
        result = [...result].sort(
          (a, b) =>
            new Date(b.clockIn || b.createdDate) -
            new Date(a.clockIn || a.createdDate)
        );
        break;
      case "Last Month":
        const oneMonthAgo = subDays(new Date(), 30);
        result = result.filter(
          (att) => new Date(att.clockIn || att.createdDate) >= oneMonthAgo
        );
        result = [...result].sort(
          (a, b) =>
            new Date(b.clockIn || b.createdDate) -
            new Date(a.clockIn || a.createdDate)
        );
        break;
      default:
        break;
    }

    return result;
  }, [
    groupedAttendances,
    activeTab,
    searchTerm,
    selectedDate,
    selectedStatus,
    sortBy,
  ]);

  // Paginated attendances
  const paginatedAttendances = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAttendances.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAttendances, currentPage]);

  // Handlers
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate(null);
    setSelectedStatus("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
    toast.info("Filters cleared");
  };

  const handleRefresh = () => {
    clearFilters();
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
        ? new Date(att.clockIn).toLocaleTimeString()
        : "N/A";
      const clockOut = att.clockOut
        ? new Date(att.clockOut).toLocaleTimeString()
        : "N/A";
      doc.text(
        `${index + 1}. ${att.user?.name || "Unknown"} - ${
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
      Break: att.break || "0h 00m",
      Overtime: att.overtime || "0h 00m",
      "Total Hours":
        att.totalHours ||
        (att.clockIn && att.clockOut
          ? (
              (new Date(att.clockOut) - new Date(att.clockIn)) /
              (1000 * 60 * 60)
            ).toFixed(2) + "h"
          : "N/A"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance-report.xlsx");
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: "user",
      key: "employee",
      render: (user) => (
        <Space>
          <Avatar
            src={user?.avatar || "assets/img/users/user-01.jpg"}
            size={40}
          />
          <div>
            <Text strong>{user?.name || "Unknown"}</Text>
            <br />
            <Text type="secondary">{user?.roles?.join(", ") || "N/A"}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`badge ${
            status === "present"
              ? "bg-success"
              : status === "late"
              ? "bg-warning"
              : "bg-danger"
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
        clockIn ? new Date(clockIn).toLocaleTimeString() : "N/A",
    },
    {
      title: "Clock Out",
      dataIndex: "clockOut",
      key: "clockOut",
      render: (clockOut) =>
        clockOut ? new Date(clockOut).toLocaleTimeString() : "N/A",
    },
    {
      title: "Production",
      dataIndex: "production",
      key: "production",
      render: (production, record) => {
        const totalHours =
          record.clockIn && record.clockOut
            ? (
                (new Date(record.clockOut) - new Date(record.clockIn)) /
                (1000 * 60 * 60)
              ).toFixed(2) + "h"
            : "N/A";
        return production || totalHours;
      },
    },
    {
      title: "Break",
      dataIndex: "break",
      key: "break",
      render: (breakTime) => breakTime || "0h 00m",
    },
    {
      title: "Overtime",
      dataIndex: "overtime",
      key: "overtime",
      render: (overtime) => overtime || "0h 00m",
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
          : record.totalHours || "N/A",
    },
  ];

  if (isAllAttendanceLoading) {
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

  if (allAttendanceError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert variant="danger" role="alert">
              Error loading attendance: {JSON.stringify(allAttendanceError)}.
              Please try again.
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
            title="Attendance"
            subtitle="Manage your Attendance"
            tableData={paginatedAttendances}
          />
          <div className="card-body">
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
                  <div className="input-icon w-120 position-relative me-2">
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      className="form-control datetimepicker"
                      placeholderText="Select Date"
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
                      placeholder="Search by employee name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search attendance"
                    />
                  </div>

                  <Button
                    className="btn btn-outline-secondary ms-2"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
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
                        loading={isAllAttendanceLoading}
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
