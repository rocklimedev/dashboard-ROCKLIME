import React, { useState } from "react";
import {
  EyeOutlined,
  DeleteOutlined,
  StopOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  useGetAllJobsQuery,
  useCancelJobMutation,
  useDeleteJobMutation,
} from "../../api/jobsApi";

import {
  Dropdown,
  Menu,
  Button,
  Pagination,
  Tooltip,
  message,
  Input,
  Select,
} from "antd";

import PageHeader from "../../components/Common/PageHeader";
import DeleteModal from "../../components/Common/DeleteModal";

const { Search } = Input;
const { Option } = Select;

const JobList = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState();
  const [typeFilter, setTypeFilter] = useState();
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);

  const { data, refetch, isFetching } = useGetAllJobsQuery({
    page,
    limit: 10,
    status: statusFilter,
    type: typeFilter,
  });

  const [cancelJob] = useCancelJobMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  const jobs = data?.data || [];
  const pagination = data?.pagination || {};

  const handleCancel = async (id) => {
    try {
      await cancelJob(id).unwrap();
      message.success("Job cancelled");
      refetch();
    } catch {
      message.error("Failed to cancel job");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(deleteId).unwrap();
      message.success("Job deleted");
      refetch();
    } catch {
      message.error("Delete failed");
    } finally {
      setDeleteModal(false);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: "secondary",
      processing: "info",
      completed: "success",
      failed: "danger",
      cancelled: "warning",
    };
    return `badge bg-${map[status] || "secondary"}`;
  };

  const renderProgress = (progress) => {
    if (!progress) return "—";

    const { totalRows = 0, processedRows = 0 } = progress;
    const percent =
      totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

    return (
      <div style={{ minWidth: 120 }}>
        <div className="progress" style={{ height: 6 }}>
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
        <small className="text-muted">
          {processedRows}/{totalRows}
        </small>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Jobs Management"
            subtitle="Monitor background jobs"
            onAdd={() => (window.location.href = "/import-job")}
          />

          <div className="card-body">
            {/* Filters */}
            <div className="row mb-4 align-items-center">
              <div className="col-lg-6 d-flex gap-2 flex-wrap">
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: 150 }}
                  onChange={setStatusFilter}
                >
                  <Option value="pending">Pending</Option>
                  <Option value="processing">Processing</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="failed">Failed</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>

                <Select
                  placeholder="Type"
                  allowClear
                  style={{ width: 180 }}
                  onChange={setTypeFilter}
                >
                  <Option value="bulk-import">Bulk Import</Option>
                  <Option value="report-generation">Report Generation</Option>
                </Select>
              </div>

              <div className="col-lg-6 text-end">
                <div style={{ maxWidth: 280, marginLeft: "auto" }}>
                  <Search
                    placeholder="Search jobs..."
                    allowClear
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Results</th>
                    <th>Created</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((job) => {
                    const menu = (
                      <Menu>
                        <Menu.Item
                          onClick={() =>
                            window.open(`/job/${job.id}`, "_blank")
                          }
                        >
                          <EyeOutlined /> View
                        </Menu.Item>

                        {["pending", "processing"].includes(job.status) && (
                          <Menu.Item onClick={() => handleCancel(job.id)}>
                            <StopOutlined /> Cancel
                          </Menu.Item>
                        )}

                        {["completed", "failed", "cancelled"].includes(
                          job.status,
                        ) && (
                          <Menu.Item
                            danger
                            onClick={() => {
                              setDeleteId(job.id);
                              setDeleteModal(true);
                            }}
                          >
                            <DeleteOutlined /> Delete
                          </Menu.Item>
                        )}
                      </Menu>
                    );

                    return (
                      <tr key={job.id}>
                        <td className="text-capitalize">
                          {job.type?.replace(/-/g, " ")}
                        </td>

                        <td>
                          <span className={getStatusBadge(job.status)}>
                            {job.status}
                          </span>
                        </td>

                        <td>{renderProgress(job.progress)}</td>

                        <td>
                          {job.results ? (
                            <span className="badge bg-light text-dark">
                              +{job.results.newBrandsCount || 0} Brands
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="text-muted">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>

                        <td>
                          <Dropdown overlay={menu} trigger={["click"]}>
                            <Button type="text" icon={<MoreOutlined />} />
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-end mt-4">
              <Pagination
                current={pagination.page}
                total={pagination.total}
                pageSize={pagination.limit}
                onChange={setPage}
              />
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        <DeleteModal
          isVisible={deleteModal}
          onCancel={() => setDeleteModal(false)}
          onConfirm={handleDelete}
          itemType="Job"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default JobList;
