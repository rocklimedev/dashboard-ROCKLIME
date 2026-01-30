// src/components/JobDetails.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetJobByIdQuery,
  useCancelJobMutation,
  useDeleteJobMutation,
  useLazyDownloadSuccessfulEntriesQuery, // ← add this
} from "../../api/jobsApi"; // adjust path if needed
import {
  Card,
  Descriptions,
  Tag,
  Badge,
  Progress,
  Space,
  Button,
  Modal,
  Spin,
  Divider,
  Typography,
  List,
  Alert,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  ReloadOutlined,
  StopOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  FileTextOutlined, // ← we'll use this for download
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DownloadOutlined, // ← nice alternative icon
} from "@ant-design/icons";

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

const { Title, Text } = Typography;

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const {
    data: jobResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetJobByIdQuery(jobId, { skip: !jobId });

  const [cancelJob, { isLoading: isCancelling }] = useCancelJobMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  // Lazy query for download
  const [triggerDownload, { isLoading: isDownloading }] =
    useLazyDownloadSuccessfulEntriesQuery();

  const handleCancel = () => {
    Modal.confirm({
      title: "Cancel Job",
      content: "Are you sure you want to cancel this job?",
      okText: "Yes, Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelJob(jobId).unwrap();
          refetch();
        } catch (err) {
          Modal.error({
            title: "Cancellation failed",
            content: err?.data?.message || "Unknown error",
          });
        }
      },
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Job",
      content: "This action cannot be undone. Delete this job record?",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteJob(jobId).unwrap();
          navigate("/jobs");
        } catch (err) {
          Modal.error({
            title: "Deletion failed",
            content: err?.data?.message || "Unknown error",
          });
        }
      },
    });
  };

  const handleDownloadSuccessful = async () => {
    try {
      const blob = await triggerDownload(jobId).unwrap();

      if (!blob) {
        Modal.warning({
          title: "No file available",
          content: "The successful entries file could not be retrieved.",
        });
        return;
      }

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `successful-entries-job-${jobId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      Modal.error({
        title: "Download failed",
        content:
          err?.data?.message ||
          "Could not download the file. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  if (!jobResponse?.success || !jobResponse?.data) {
    return (
      <Card>
        <Alert
          message="Job Not Found"
          description="The requested job could not be found."
          type="error"
          showIcon
        />
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/jobs")}
          className="mt-4"
        >
          Back to Jobs List
        </Button>
      </Card>
    );
  }

  const job = jobResponse.data;

  const progress = job.progress || {};
  const results = job.results || {};
  const params = job.params || {};
  const errorLog = job.errorLog || [];

  const percent =
    progress.totalRows > 0
      ? Math.round((progress.processedRows / progress.totalRows) * 100)
      : 0;

  // Show download button only for completed bulk-import jobs with successful entries
  const canDownload =
    job.type === "bulk-import" &&
    job.status === "completed" &&
    results.successfulEntriesCount > 0 &&
    results.successfulEntriesJsonPath;

  return (
    <div className="page-wrapper">
      <div className="content">
        <Card
          title={
            <Space>
              <Title level={4} className="mb-0">
                Job Details
              </Title>
              <Tag color="blue">{job.type.replace(/-/g, " ")}</Tag>
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={refetch}
                loading={isFetching}
              >
                Refresh
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/jobs/list")}
              >
                Back to List
              </Button>
            </Space>
          }
        >
          <Row gutter={[24, 24]}>
            {/* Left Column - Main Info & Progress */}
            <Col xs={24} lg={16}>
              <Descriptions
                bordered
                column={1}
                size="small"
                title="Basic Information"
              >
                <Descriptions.Item label="Job ID">
                  <Text copyable>{job.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Badge
                    status={statusColors[job.status]}
                    text={
                      <Space>
                        {statusIcons[job.status]}
                        <span className="text-capitalize">{job.status}</span>
                      </Space>
                    }
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {new Date(job.createdAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </Descriptions.Item>
                <Descriptions.Item label="Completed At">
                  {job.completedAt
                    ? new Date(job.completedAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="User ID">
                  {job.userId || "System / Guest"}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Card title="Progress" size="small">
                {progress.totalRows > 0 ? (
                  <>
                    <Progress
                      percent={percent}
                      size="small"
                      status={
                        progress.failedCount > 0 ? "exception" : undefined
                      }
                    />
                    <div className="mt-2">
                      <Text strong>
                        {progress.processedRows} / {progress.totalRows} rows
                        processed
                      </Text>
                      <br />
                      <Text type="secondary">
                        Success: {progress.successCount} • Failed:{" "}
                        {progress.failedCount}
                      </Text>
                    </div>
                  </>
                ) : (
                  <Text type="secondary">No progress data available yet</Text>
                )}
              </Card>
            </Col>

            {/* Right Column - Actions & Results */}
            <Col xs={24} lg={8}>
              <Card title="Actions" size="small">
                <Space direction="vertical" style={{ width: "100%" }}>
                  {["pending", "processing"].includes(job.status) && (
                    <Button
                      danger
                      block
                      icon={<StopOutlined />}
                      loading={isCancelling}
                      onClick={handleCancel}
                    >
                      Cancel Job
                    </Button>
                  )}

                  {["completed", "failed", "cancelled"].includes(
                    job.status,
                  ) && (
                    <Button
                      danger
                      block
                      icon={<DeleteOutlined />}
                      loading={isDeleting}
                      onClick={handleDelete}
                    >
                      Delete Job
                    </Button>
                  )}

                  {canDownload && (
                    <Button
                      type="primary"
                      block
                      icon={<DownloadOutlined />}
                      loading={isDownloading}
                      onClick={handleDownloadSuccessful}
                    >
                      Download Successful Entries
                    </Button>
                  )}

                  {job.status === "processing" && (
                    <Tooltip title="Job is currently running">
                      <Button block disabled>
                        Running...
                      </Button>
                    </Tooltip>
                  )}
                </Space>
              </Card>

              <Divider />

              <Card title="Results Summary" size="small">
                {results.successfulEntriesCount > 0 ? (
                  <List size="small">
                    <List.Item>
                      <Text strong>Successfully imported:</Text>{" "}
                      {results.successfulEntriesCount} products
                    </List.Item>
                    {results.newCategoriesCount > 0 && (
                      <List.Item>
                        +{results.newCategoriesCount} new Categories
                      </List.Item>
                    )}
                    {results.newBrandsCount > 0 && (
                      <List.Item>
                        +{results.newBrandsCount} new Brands
                      </List.Item>
                    )}
                    {results.newVendorsCount > 0 && (
                      <List.Item>
                        +{results.newVendorsCount} new Vendors
                      </List.Item>
                    )}
                  </List>
                ) : (
                  <Text type="secondary">
                    {job.status === "completed"
                      ? "No successful imports or no new entities created"
                      : "Results will appear when job completes"}
                  </Text>
                )}
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* Job Parameters */}
          <Card title="Job Parameters" size="small" className="mb-4">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Original File">
                {params.originalFileName || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="File Path (FTP)">
                <Text copyable ellipsis={{ tooltip: params.filePath }}>
                  {params.filePath || "—"}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {params.mapping && Object.keys(params.mapping).length > 0 && (
              <>
                <Divider orientation="left">Column Mapping</Divider>
                <List
                  size="small"
                  bordered
                  dataSource={Object.entries(params.mapping)}
                  renderItem={([colIndex, field]) => (
                    <List.Item>
                      <Text strong>Column {colIndex} →</Text> {field}
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>

          {/* Error Log */}
          {errorLog.length > 0 && (
            <Card title="Error / Event Log" size="small">
              <List
                size="small"
                bordered
                dataSource={errorLog}
                renderItem={(entry) => (
                  <List.Item>
                    <Space align="start">
                      <Text type="secondary">
                        {new Date(entry.timestamp).toLocaleString("en-IN")}
                      </Text>
                      <Text>{entry.message}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Card>
      </div>
    </div>
  );
};

export default JobDetails;
