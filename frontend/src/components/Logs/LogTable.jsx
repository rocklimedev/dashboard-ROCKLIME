import React, { useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { Input, Select, DatePicker, Button } from "antd";
import moment from "moment";
import PageHeader from "../Common/PageHeader";
import DataTablePagination from "../Common/DataTablePagination";
import { useGetLogsQuery } from "../../api/logApi";
const { Option } = Select;
const { RangePicker } = DatePicker;

const LogTable = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    method: "",
    route: "",
    user: "",
    startDate: null,
    endDate: null,
    sortBy: "Recently Added",
  });

  const { data, isLoading, error, refetch } = useGetLogsQuery({
    ...filters,
    sortBy: filters.sortBy === "Recently Added" ? "createdAt" : "route",
    sortOrder:
      filters.sortBy === "Recently Added"
        ? "desc"
        : filters.sortBy === "Ascending"
        ? "asc"
        : "desc",
  });

  const logs = Array.isArray(data?.logs) ? data.logs : [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  // Memoized filtered logs
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (filters.route.trim()) {
      result = result.filter((log) =>
        log.route.toLowerCase().includes(filters.route.toLowerCase())
      );
    }

    switch (filters.sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) => a.route.localeCompare(b.route));
        break;
      case "Descending":
        result = [...result].sort((a, b) => b.route.localeCompare(a.route));
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        break;
    }

    return result;
  }, [logs, filters.route, filters.sortBy]);

  // Paginated logs
  const currentLogs = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.limit;
    return filteredLogs.slice(startIndex, startIndex + filters.limit);
  }, [filteredLogs, filters.page, filters.limit]);

  // Format logs for tableData prop
  const formattedLogs = useMemo(() => {
    return currentLogs.map((log) => ({
      id: log._id,
      method: log.method,
      route: log.route,
      user: log.user
        ? `${log.user.name || "Unknown"} (${log.user.email || "Unknown"})`
        : "Anonymous",
      status: log.status || "-",
      duration: log.duration || "-",
      createdAt: moment(log.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      ipAddress: log.ipAddress || "-",
      body: log.body ? JSON.stringify(log.body) : "-",
      query: log.query ? JSON.stringify(log.query) : "-",
      error: log.error || "-",
    }));
  }, [currentLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    refetch();
  };

  const handlePageChange = ({ selected }) => {
    setFilters((prev) => ({ ...prev, page: selected + 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      method: "",
      route: "",
      user: "",
      startDate: null,
      endDate: null,
      sortBy: "Recently Added",
    });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error fetching logs:{" "}
              {error.data?.message || JSON.stringify(error)}
            </div>
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
            title="API Logs"
            subtitle="View API request logs"
            tableData={formattedLogs}
          />
          <div className="card-body">
            <div className="row">
              <div className="col-lg-12">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <div className="input-icon-start position-relative">
                    <span className="input-icon-addon">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by Route"
                      value={filters.route}
                      onChange={(e) =>
                        handleFilterChange("route", e.target.value)
                      }
                      aria-label="Search logs"
                    />
                  </div>
                  <Select
                    style={{ width: 120, marginLeft: 10 }}
                    placeholder="Select Method"
                    allowClear
                    onChange={(value) => handleFilterChange("method", value)}
                    value={filters.method}
                  >
                    <Option value="GET">GET</Option>
                    <Option value="POST">POST</Option>
                    <Option value="PUT">PUT</Option>
                    <Option value="DELETE">DELETE</Option>
                    <Option value="PATCH">PATCH</Option>
                    <Option value="OPTIONS">OPTIONS</Option>
                  </Select>
                  <Input
                    style={{ width: 200, marginLeft: 10 }}
                    placeholder="Filter by User ID"
                    onChange={(e) => handleFilterChange("user", e.target.value)}
                    value={filters.user}
                  />
                  <RangePicker
                    style={{ marginLeft: 10 }}
                    onChange={(dates) => {
                      handleFilterChange("startDate", dates ? dates[0] : null);
                      handleFilterChange("endDate", dates ? dates[1] : null);
                    }}
                    value={[filters.startDate, filters.endDate]}
                  />
                  <Select
                    style={{ width: 150, marginLeft: 10 }}
                    value={filters.sortBy}
                    onChange={(value) => handleFilterChange("sortBy", value)}
                  >
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Ascending">Route (A-Z)</Option>
                    <Option value="Descending">Route (Z-A)</Option>
                  </Select>
                  <Button
                    type="primary"
                    style={{ marginLeft: 10 }}
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                  <Button style={{ marginLeft: 10 }} onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Method</th>
                    <th>Route</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Created At</th>
                    <th>IP Address</th>
                    <th>Body</th>
                    <th>Query</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log, index) => (
                    <tr key={log._id}>
                      <td>{(filters.page - 1) * filters.limit + index + 1}</td>
                      <td>{log.method}</td>
                      <td>{log.route}</td>
                      <td>
                        {log.user
                          ? `${log.user.name || "Unknown"} (${
                              log.user.email || "Unknown"
                            })`
                          : "Anonymous"}
                      </td>
                      <td>{log.status || "-"}</td>
                      <td>{log.duration ? `${log.duration} ms` : "-"}</td>
                      <td>
                        {moment(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td>{log.ipAddress || "-"}</td>
                      <td>{log.body ? JSON.stringify(log.body) : "-"}</td>
                      <td>{log.query ? JSON.stringify(log.query) : "-"}</td>
                      <td>{log.error || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length > filters.limit && (
                <div className="pagination-section mt-4">
                  <DataTablePagination
                    totalItems={pagination.total}
                    itemNo={pagination.limit}
                    onPageChange={handlePageChange}
                    currentPage={filters.page}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogTable;
