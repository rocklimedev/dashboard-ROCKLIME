import React, { useState, useEffect } from "react";
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
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify"; // Use react-toastify as per API
import moment from "moment";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useGetAllAttendanceQuery } from "../../api/attendanceApi";
import "./attendancelist.css";
import { Pagination as AntdPagination } from "antd";
const { Option } = Select;

const { Title, Text } = Typography;
const AttendanceList = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    date: moment().format("YYYY-MM-DD"),
  });
  const [page, setPage] = useState(1);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const limit = 10;

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

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleDateChange = (date) => {
    const formattedDate = date ? moment(date).format("YYYY-MM-DD") : "";
    handleFilterChange("date", formattedDate);
  };

  const exportToPDF = () => {
    if (!allAttendance?.attendances?.length) {
      toast.error("No data to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Attendance Report", 20, 10);
    doc.setFontSize(12);
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
        } - Clock In: ${clockIn} - Clock Out: ${clockOut}`,
        20,
        y
      );
      y += 10;
    });
    doc.save("attendance-report.pdf");
  };

  const exportToExcel = () => {
    if (!allAttendance?.attendances?.length) {
      toast.error("No data to export");
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

  const handleRefresh = () => {
    setFilters({
      search: "",
      status: "",
      date: moment().format("YYYY-MM-DD"),
    });
    setPage(1);
    refetch();
    toast.info("Attendance data refreshed");
  };

  const handleCollapse = () => {
    setIsTableCollapsed((prev) => !prev);
  };

  useEffect(() => {
    if (allAttendanceError) {
      toast.error(allAttendanceError.message || "Failed to fetch attendance");
    }
  }, [allAttendanceError]);

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
          className={`badge badge-${
            status === "present"
              ? "success"
              : status === "late"
              ? "warning"
              : "danger"
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

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <div className="add-item">
            <Title level={4}>Attendance</Title>
            <Text>Manage your Attendance</Text>
          </div>
          <Space>
            <Tooltip title="Export to PDF">
              <Button icon={<DownloadOutlined />} onClick={exportToPDF} />
            </Tooltip>
            <Tooltip title="Export to Excel">
              <Button icon={<DownloadOutlined />} onClick={exportToExcel} />
            </Tooltip>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
            <Tooltip title={isTableCollapsed ? "Expand" : "Collapse"}>
              <Button
                icon={isTableCollapsed ? <DownOutlined /> : <UpOutlined />}
                onClick={handleCollapse}
              />
            </Tooltip>
          </Space>
        </div>

        <Card className="attendance-card">
          <Space
            direction="horizontal"
            size="middle"
            style={{
              width: "100%",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder
              markedlydown="Search by employee name"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              style={{ width: 300, borderRadius: 20 }}
            />
            <Space>
              <DatePicker
                value={filters.date ? moment(filters.date) : null}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                style={{ borderRadius: 20 }}
              />
              <Select
                value={filters.status || "All"}
                onChange={(value) => handleFilterChange("status", value)}
                style={{ width: 150, borderRadius: 20 }}
              >
                <Option value="">All</Option>
                <Option value="present">Present</Option>
                <Option value="absent">Absent</Option>
                <Option value="late">Late</Option>
              </Select>
            </Space>
          </Space>

          {!isTableCollapsed && (
            <>
              <Table
                columns={columns}
                dataSource={allAttendance?.attendances || []}
                loading={isAllAttendanceLoading}
                pagination={false}
                rowKey="_id"
                className="attendance-table"
              />
              {allAttendance?.meta?.total > limit && (
                <div style={{ textAlign: "right", marginTop: 16 }}>
                  <AntdPagination
                    current={page}
                    pageSize={limit}
                    total={allAttendance?.meta?.total || 0}
                    onChange={setPage}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AttendanceList;
