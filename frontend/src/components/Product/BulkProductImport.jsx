// src/pages/products/BulkProductImport.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Steps,
  Upload,
  Button,
  message,
  Card,
  Table,
  Tag,
  Spin,
  Space,
  Modal,
  Progress,
  Typography,
  Alert,
  Result,
  Divider,
  Select,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  useStartBulkImportMutation,
  useGetJobStatusQuery,
} from "../../api/jobsApi"; // Adjust path to your jobApi

const { Step } = Steps;
const { Option } = Select;
const { Title, Text } = Typography;

const BulkProductImport = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [jobId, setJobId] = useState(null);
  const [importing, setImporting] = useState(false);

  const [startBulkImport, { isLoading: isStarting }] =
    useStartBulkImportMutation();

  const { data: jobStatus, isFetching: isPolling } = useGetJobStatusQuery(
    jobId,
    {
      skip: !jobId,
      pollingInterval: 5000, // Poll every 5 seconds
    },
  );

  // ── Time estimation ───────────────────────────────────────────────────────
  const [startTime, setStartTime] = useState(null);
  const [processedHistory, setProcessedHistory] = useState([]); // [{time, processedRows}]

  useEffect(() => {
    if (
      jobStatus?.progress?.processedRows > 0 &&
      jobStatus?.status === "processing"
    ) {
      const now = Date.now();
      setProcessedHistory((prev) => [
        ...prev.slice(-9), // keep last 10 samples
        { time: now, processed: jobStatus.progress.processedRows },
      ]);

      if (!startTime) setStartTime(now);
    }
  }, [jobStatus, startTime]);

  const estimatedTimeLeft = useMemo(() => {
    if (
      !jobStatus?.progress?.totalRows ||
      jobStatus.progress.processedRows >= jobStatus.progress.totalRows
    ) {
      return null;
    }

    if (processedHistory.length < 3) return "Calculating...";

    const latest = processedHistory[processedHistory.length - 1];
    const earliest = processedHistory[0];

    const timeDiffSec = (latest.time - earliest.time) / 1000;
    const rowsDiff = latest.processed - earliest.processed;

    if (rowsDiff <= 0 || timeDiffSec <= 0) return "Calculating...";

    const rowsPerSec = rowsDiff / timeDiffSec;
    const remainingRows =
      jobStatus.progress.totalRows - jobStatus.progress.processedRows;
    const secondsLeft = remainingRows / rowsPerSec;

    if (secondsLeft < 60) return `${Math.round(secondsLeft)} seconds`;
    if (secondsLeft < 3600) return `${Math.round(secondsLeft / 60)} minutes`;
    return `${Math.round(secondsLeft / 3600)} hours +`;
  }, [processedHistory, jobStatus]);

  // ── Field mapping options ────────────────────────────────────────────────
  const fieldOptions = useMemo(
    () => [
      { value: "name", label: "Product Name *", required: true },
      { value: "product_code", label: "Product Code *", required: true },
      { value: "description", label: "Description" },
      { value: "quantity", label: "Initial Quantity" },
      { value: "alert_quantity", label: "Low Stock Alert Qty" },
      { value: "tax", label: "Tax %" },
      { value: "isFeatured", label: "Featured (true/false)" },
      { value: "category", label: "Category Name" },
      { value: "brand", label: "Brand Name" },
      { value: "vendor", label: "Vendor Name" },
      { value: "keywords", label: "Keywords (comma separated)" },
      { value: "images", label: "Image URLs (comma separated)" },
      { value: "meta_barcode", label: "Barcode" },
      { value: "meta_sellingPrice", label: "Selling Price" },
      { value: "meta_mrp", label: "MRP" },
      { value: "meta_purchasePrice", label: "Purchase Price" },
    ],
    [],
  );

  const requiredFields = fieldOptions
    .filter((f) => f.required)
    .map((f) => f.value);
  const isMappingValid = requiredFields.every((field) =>
    Object.values(mapping).includes(field),
  );

  // ── File upload & parse ──────────────────────────────────────────────────
  const handleFileUpload = (uploadedFile) => {
    const isCsv = uploadedFile.name.toLowerCase().endsWith(".csv");
    const isExcel = /\.(xlsx|xls)$/.test(uploadedFile.name);

    if (!isCsv && !isExcel) {
      message.error("Only CSV or Excel files are allowed");
      return false;
    }

    setFile(uploadedFile);
    setHeaders([]);
    setMapping({});
    setCurrentStep(1);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let parsedHeaders = [];

        if (isCsv) {
          const result = Papa.parse(e.target.result, { skipEmptyLines: true });
          if (result.data.length > 0) parsedHeaders = result.data[0];
        } else {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (json.length > 0) parsedHeaders = json[0];
        }

        const cleanHeaders = parsedHeaders
          .map((h) => (h || "").toString().trim())
          .filter(Boolean);

        setHeaders(cleanHeaders);
        message.success("File loaded successfully. Now map columns.");
      } catch (err) {
        message.error("Failed to parse file");
        console.error(err);
      }
    };

    if (isCsv) reader.readAsText(uploadedFile);
    else reader.readAsArrayBuffer(uploadedFile);

    return false;
  };

  // ── Start import ─────────────────────────────────────────────────────────
  const handleStartImport = async () => {
    if (!isMappingValid) {
      message.warning(
        "Please map at least Product Name and Product Code fields",
      );
      return;
    }

    setImporting(true);

    try {
      const result = await startBulkImport({ file, mapping }).unwrap();
      message.success("Import job started in the background!");
      setJobId(result.jobId);
      setCurrentStep(2);
      setStartTime(Date.now());
      setProcessedHistory([]);
    } catch (err) {
      message.error(err?.data?.message || "Failed to queue import job");
    } finally {
      setImporting(false);
    }
  };

  // ── Modal close handling ─────────────────────────────────────────────────
  const handleModalClose = () => {
    if (jobId && jobStatus?.status === "processing") {
      Modal.confirm({
        title: "Job is still running",
        content:
          "The import will continue in the background even if you close this window. " +
          "You can check progress anytime in the Jobs list.",
        okText: "Close Anyway",
        cancelText: "Stay Here",
        onOk: () => {
          resetImport();
          setIsModalOpen(false);
        },
      });
    } else {
      resetImport();
      setIsModalOpen(false);
    }
  };

  const resetImport = () => {
    setCurrentStep(0);
    setFile(null);
    setHeaders([]);
    setMapping({});
    setJobId(null);
    setStartTime(null);
    setProcessedHistory([]);
  };

  // ── Template download ────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const templateData = [
      [
        "name",
        "product_code",
        "description",
        "quantity",
        "category",
        "brand",
        "vendor",
        "keywords",
        "images",
        "meta_barcode",
        "meta_sellingPrice",
        "meta_mrp",
        "meta_purchasePrice",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Template");
    XLSX.writeFile(wb, "bulk-product-import-template.xlsx");
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Card>
          <Space align="center" style={{ marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>
              Bulk Product Import
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Start New Import
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={downloadTemplate}
              type="default"
            >
              Download Template
            </Button>
          </Space>

          <Alert
            message="All imports run in the background"
            description="You can close this page or navigate away — the job will continue on the server. Check status in the Background Jobs list anytime."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        </Card>

        {/* Main modal wizard */}
        <Modal
          title="Bulk Product Import"
          open={isModalOpen}
          onCancel={handleModalClose}
          footer={null}
          width={1000}
          destroyOnClose
        >
          <Steps current={currentStep} style={{ margin: "32px 0" }}>
            <Step title="Upload File" />
            <Step title="Map Columns" />
            <Step title="Import Progress" />
          </Steps>

          {currentStep === 0 && (
            <Card>
              <Upload.Dragger
                accept=".csv,.xlsx,.xls"
                beforeUpload={handleFileUpload}
                fileList={
                  file ? [{ ...file, status: "done", name: file.name }] : []
                }
                onRemove={() => setFile(null)}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p>Click or drag CSV / Excel file here</p>
                <p className="ant-upload-hint">
                  Max file size ~50 MB recommended
                </p>
              </Upload.Dragger>
            </Card>
          )}

          {currentStep === 1 && (
            <Card title="Map File Columns to Product Fields">
              {!isMappingValid && (
                <Alert
                  message="Required mapping"
                  description="You must map at least 'Product Name' and 'Product Code' fields."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Table
                size="small"
                pagination={false}
                dataSource={headers.map((h, i) => ({ key: i, header: h }))}
                columns={[
                  {
                    title: "Column in File",
                    dataIndex: "header",
                    render: (text) => (
                      <Tag color="blue">{text || "(empty)"}</Tag>
                    ),
                  },
                  {
                    title: "Map to Field",
                    render: (_, { header }) => {
                      const colIndex = headers.indexOf(header);
                      return (
                        <Select
                          style={{ width: 300 }}
                          placeholder="Choose field"
                          allowClear
                          value={mapping[colIndex]}
                          onChange={(val) => {
                            setMapping((prev) => {
                              if (val === undefined) {
                                const { [colIndex]: _, ...rest } = prev;
                                return rest;
                              }
                              return { ...prev, [colIndex]: val };
                            });
                          }}
                        >
                          {fieldOptions.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Option>
                          ))}
                        </Select>
                      );
                    },
                  },
                ]}
              />

              <Divider />

              <div style={{ textAlign: "right" }}>
                <Button
                  type="primary"
                  onClick={handleStartImport}
                  loading={isStarting || importing}
                  disabled={!file || !isMappingValid || isStarting}
                >
                  Start Background Import
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 2 && jobId && (
            <Card title={`Job #${jobId.slice(0, 8)}...`}>
              {jobStatus ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Alert
                    message={`Status: ${jobStatus.status.toUpperCase()}`}
                    type={
                      jobStatus.status === "completed"
                        ? "success"
                        : jobStatus.status === "failed"
                          ? "error"
                          : jobStatus.status === "cancelled"
                            ? "warning"
                            : "info"
                    }
                    showIcon
                  />

                  <Progress
                    percent={
                      jobStatus.progress?.totalRows
                        ? Math.round(
                            (jobStatus.progress.processedRows /
                              jobStatus.progress.totalRows) *
                              100,
                          )
                        : 0
                    }
                    status={
                      jobStatus.progress?.failedCount > 0
                        ? "exception"
                        : "active"
                    }
                  />

                  <Text strong>
                    Progress: {jobStatus.progress?.processedRows || 0} /{" "}
                    {jobStatus.progress?.totalRows || "?"} rows
                  </Text>

                  {jobStatus.status === "processing" && (
                    <Text type="secondary">
                      Estimated time remaining:{" "}
                      <strong>{estimatedTimeLeft}</strong>
                    </Text>
                  )}

                  <Text>
                    Success:{" "}
                    <strong>{jobStatus.progress?.successCount || 0}</strong> |
                    Failed:{" "}
                    <strong>{jobStatus.progress?.failedCount || 0}</strong>
                  </Text>

                  <Text>
                    New Categories: {jobStatus.results?.newCategoriesCount || 0}{" "}
                    | Brands: {jobStatus.results?.newBrandsCount || 0} |
                    Vendors: {jobStatus.results?.newVendorsCount || 0}
                  </Text>

                  {jobStatus.errorLog?.length > 0 && (
                    <>
                      <Title level={5}>Failed Rows / Errors</Title>
                      <Table
                        size="small"
                        dataSource={jobStatus.errorLog}
                        columns={[
                          { title: "Row", dataIndex: "row", width: 80 },
                          { title: "Error", dataIndex: "error" },
                        ]}
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: true }}
                      />
                    </>
                  )}

                  {jobStatus.status === "completed" && (
                    <Result
                      status="success"
                      title="Import Completed Successfully"
                      subTitle="All done! You can close this window."
                    />
                  )}

                  {jobStatus.status === "processing" && (
                    <Alert
                      message="Background Processing"
                      description={
                        <>
                          This job is running on the server. You can safely
                          close this modal or navigate away.
                          <br />
                          Check progress anytime in the{" "}
                          <strong>Background Jobs</strong> section.
                        </>
                      }
                      type="info"
                      showIcon
                    />
                  )}
                </Space>
              ) : (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <Spin tip="Initializing job..." size="large" />
                </div>
              )}
            </Card>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default BulkProductImport;
