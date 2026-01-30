// src/components/JobList.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetAllJobsQuery,
  useCancelJobMutation,
  useDeleteJobMutation,
} from "../../api/jobsApi";
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Progress,
  Tooltip,
  Spin,
  Badge,
  Card,
  Typography,
  Row,
  Col,
  Select,
  Pagination,
} from "antd";
import {
  ReloadOutlined,
  StopOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const statusColors = {
  pending: "default",
  processing: "processing",
  completed: "success",
  failed: "error",
  cancelled: "warning",
};

const statusIcons = {
  pending: <ClockCircleOutlined />,
  processing: <ReloadOutlined spin />,
  completed: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
  cancelled: <WarningOutlined />,
};

const JobList = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const navigate = useNavigate();
  const {
    data: jobsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllJobsQuery({
    page,
    limit: pageSize,
    status: statusFilter,
    type: typeFilter,
  });

  const [cancelJob, { isLoading: isCancelling }] = useCancelJobMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  const jobs = jobsData?.data || [];
  const paginationInfo = jobsData?.pagination || {
    total: 0,
    page,
    limit: pageSize,
  };

  const handleCancel = (jobId) => {
    Modal.confirm({
      title: "Cancel Job",
      content:
        "Are you sure you want to cancel this job? It may stop processing soon.",
      okText: "Yes, Cancel",
      cancelText: "No",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelJob(jobId).unwrap();
          refetch();
        } catch (err) {
          Modal.error({
            title: "Failed to cancel job",
            content: err?.data?.message || "Unknown error",
          });
        }
      },
    });
  };

  const handleDelete = (jobId) => {
    Modal.confirm({
      title: "Delete Job",
      content: "This action cannot be undone. Delete this job record?",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteJob(jobId).unwrap();
          refetch();
        } catch (err) {
          Modal.error({
            title: "Failed to delete job",
            content: err?.data?.message || "Unknown error",
          });
        }
      },
    });
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      ellipsis: true,
      width: 180,
      render: (text) => (
        <Text copyable ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text) => (
        <Tag color="blue" className="text-capitalize">
          {text.replace(/-/g, " ")}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => (
        <Badge
          status={statusColors[status]}
          text={
            <Space>
              {statusIcons[status]}
              <span className="text-capitalize">{status}</span>
            </Space>
          }
        />
      ),
    },
    {
      title: "Progress",
      key: "progress",
      width: 220,
      render: (_, record) => {
        if (!record.progress) return <Text type="secondary">—</Text>;

        const {
          totalRows = 0,
          processedRows = 0,
          successCount = 0,
          failedCount = 0,
        } = record.progress;
        const percent =
          totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Progress
              percent={percent}
              size="small"
              status={failedCount > 0 ? "exception" : undefined}
            />
            <Text type="secondary" style={{ fontSize: "0.85rem" }}>
              {processedRows} / {totalRows || "?"} rows • {successCount} ok •{" "}
              {failedCount} failed
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Results",
      key: "results",
      render: (_, record) => {
        if (!record.results) return null;
        const {
          newCategoriesCount = 0,
          newBrandsCount = 0,
          newVendorsCount = 0,
        } = record.results;
        if (newCategoriesCount + newBrandsCount + newVendorsCount === 0)
          return <Text type="secondary">—</Text>;

        return (
          <Space size="small">
            {newCategoriesCount > 0 && (
              <Tag color="cyan">+{newCategoriesCount} Categories</Tag>
            )}
            {newBrandsCount > 0 && (
              <Tag color="geekblue">+{newBrandsCount} Brands</Tag>
            )}
            {newVendorsCount > 0 && (
              <Tag color="purple">+{newVendorsCount} Vendors</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) =>
        new Date(date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => window.open(`/job/${record.id}`, "_blank")}
            />
          </Tooltip>

          {["pending", "processing"].includes(record.status) && (
            <Tooltip title="Cancel Job">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                loading={isCancelling}
                onClick={() => handleCancel(record.id)}
              />
            </Tooltip>
          )}

          {["completed", "failed", "cancelled"].includes(record.status) && (
            <Tooltip title="Delete Job">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
                onClick={() => handleDelete(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <Card className="shadow-sm border-0">
          <Row justify="space-between" align="middle" className="mb-4">
            <Col>
              <Title level={4} className="mb-0">
                Background Jobs
              </Title>
              <Text type="secondary">
                Monitor import, report generation, and other background tasks
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/job/add")} // already at step 0
                >
                  Create Job
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                  loading={isFetching}
                >
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: "100%" }}
                onChange={(val) => setStatusFilter(val)}
                value={statusFilter}
              >
                <Option value="pending">Pending</Option>
                <Option value="processing">Processing</Option>
                <Option value="completed">Completed</Option>
                <Option value="failed">Failed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Filter by Type"
                allowClear
                style={{ width: "100%" }}
                onChange={(val) => setTypeFilter(val)}
                value={typeFilter}
              >
                <Option value="bulk-import">Bulk Import</Option>
                <Option value="report-generation">Report Generation</Option>
                {/* Add more types as you implement them */}
              </Select>
            </Col>
          </Row>

          {isLoading ? (
            <div className="text-center py-5">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={jobs}
                rowKey="id"
                pagination={false}
                loading={isFetching && !isLoading}
                scroll={{ x: 1200 }}
                bordered
                size="middle"
              />

              <div className="d-flex justify-content-center mt-4">
                <Pagination
                  current={paginationInfo.page}
                  pageSize={paginationInfo.limit}
                  total={paginationInfo.total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `Total ${total} jobs`}
                  onChange={(p, ps) => {
                    setPage(p);
                    setPageSize(ps);
                  }}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default JobList;
