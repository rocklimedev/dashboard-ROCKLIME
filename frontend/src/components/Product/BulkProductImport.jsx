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
  Empty,
  Select,
} from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  useStartBulkImportMutation,
  useGetImportStatusQuery,
} from "../../api/importApi";

const { Step } = Steps;
const { Option } = Select;
const { Title, Text } = Typography;

const BulkProductImport = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [jobId, setJobId] = useState(null);
  const [importing, setImporting] = useState(false);

  const [startBulkImport, { isLoading: isStarting }] =
    useStartBulkImportMutation();

  const { data: status, isFetching: isPolling } = useGetImportStatusQuery(
    jobId,
    {
      skip: !jobId,
      pollingInterval: 4000,
    },
  );

  const fieldOptions = useMemo(
    () => [
      { value: "name", label: "Product Name *", required: true },
      { value: "product_code", label: "Product Code *", required: true },
      { value: "description", label: "Description" },
      { value: "quantity", label: "Initial Quantity" },
      { value: "alert_quantity", label: "Low Stock Alert Qty" },
      { value: "tax", label: "Tax %" },
      { value: "isFeatured", label: "Featured (true/false)" },
      { value: "category", label: "Category (name)" },
      { value: "brand", label: "Brand (name)" },
      { value: "vendor", label: "Vendor (name)" },
      { value: "keywords", label: "Keywords (comma separated)" },
      { value: "images", label: "Images (comma separated URLs)" },
      { value: "meta_barcode", label: "Barcode" },
      { value: "meta_sellingPrice", label: "Selling Price" },
      { value: "meta_mrp", label: "MRP" },
      { value: "meta_purchasePrice", label: "Purchase Price" },
    ],
    [],
  );

  const requiredFields = useMemo(
    () => fieldOptions.filter((f) => f.required).map((f) => f.value),
    [fieldOptions],
  );

  const isMappingValid = useMemo(() => {
    return requiredFields.every((field) =>
      Object.values(mapping).includes(field),
    );
  }, [mapping, requiredFields]);

  const handleFileUpload = (uploadedFile) => {
    const isCsv = uploadedFile.name.endsWith(".csv");
    const isExcel = /\.(xlsx|xls)$/.test(uploadedFile.name);

    if (!isCsv && !isExcel) {
      message.error("Only CSV or Excel files allowed");
      return false;
    }

    setFile(uploadedFile);
    setHeaders([]);
    setMapping({});
    setCurrentStep(0);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let parsedHeaders = [];

        if (isCsv) {
          const result = Papa.parse(e.target.result, { skipEmptyLines: true });
          if (result.data.length > 0) {
            parsedHeaders = result.data[0];
          }
        } else {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (json.length > 0) {
            parsedHeaders = json[0];
          }
        }

        const cleanHeaders = parsedHeaders
          .map((h) => (h || "").toString().trim())
          .filter(Boolean);

        setHeaders(cleanHeaders);
        setCurrentStep(1);
        message.success("File loaded. Now map columns.");
      } catch (err) {
        message.error("Failed to read file");
        console.error("File parse error:", err);
      }
    };

    if (isCsv) reader.readAsText(uploadedFile);
    else reader.readAsArrayBuffer(uploadedFile);

    return false;
  };

  const handleStartImport = async () => {
    if (!file) return;

    if (!isMappingValid) {
      message.warning("Please map both Product Name and Product Code fields");
      return;
    }

    // ── Debug: see what is actually being sent to backend ───────────────────
    console.log("=== Starting import ===");
    console.log("File:", file.name);
    console.log("Mapping object:", mapping);
    console.log("Mapped fields:", Object.values(mapping));
    console.log(
      "Required fields present?",
      requiredFields.every((f) => Object.values(mapping).includes(f)),
    );
    // ───────────────────────────────────────────────────────────────────────

    setImporting(true);

    try {
      const result = await startBulkImport({ file, mapping }).unwrap();
      message.success("Import job queued! Tracking progress...");
      setJobId(result.jobId);
      setCurrentStep(2);
    } catch (err) {
      console.error("Start import failed:", err);
      message.error(err?.data?.message || "Failed to start import");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (status?.status === "completed") {
      Modal.success({
        title: "Import Completed",
        content: (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Alert
              message="Success"
              description={
                <div>
                  <p>
                    <strong>Total rows:</strong> {status.totalRows}
                  </p>
                  <p>
                    <strong>Processed:</strong> {status.processedRows}
                  </p>
                  <p>
                    <strong>Success:</strong> {status.successCount}
                  </p>
                  <p>
                    <strong>Failed:</strong> {status.failedCount}
                  </p>
                  <p>
                    <strong>New Categories:</strong> {status.newCategories || 0}
                  </p>
                  <p>
                    <strong>New Brands:</strong> {status.newBrands || 0}
                  </p>
                  <p>
                    <strong>New Vendors:</strong> {status.newVendors || 0}
                  </p>
                </div>
              }
              type="success"
              showIcon
            />

            {status.failedCount > 0 && status.errorLog?.length > 0 && (
              <>
                <Title level={5}>Failed Rows</Title>
                <Table
                  size="small"
                  dataSource={status.errorLog}
                  columns={[
                    { title: "Row", dataIndex: "rowIndex", width: 80 },
                    { title: "Code", dataIndex: "product_code", width: 140 },
                    { title: "Error", dataIndex: "error" },
                  ]}
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: true }}
                />
              </>
            )}
          </Space>
        ),
        width: 800,
      });
    } else if (status?.status === "failed") {
      message.error("Import failed – check server logs");
    }
  }, [status]);

  const downloadTemplate = () => {
    const template = [
      [
        "name",
        "product_code",
        "description",
        "quantity",
        "category",
        "brand",
        "vendor",
        "images",
        "keywords",
        "meta_barcode",
        "meta_sellingPrice",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "bulk-import-template.xlsx");
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Space align="center" style={{ marginBottom: 24 }}>
          <Title level={3}>Bulk Product Import (Background Job)</Title>
          <Button
            icon={<DownloadOutlined />}
            onClick={downloadTemplate}
            type="link"
          >
            Download Template
          </Button>
        </Space>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="Upload File" />
          <Step title="Map Columns" />
          <Step title="Import & Track" />
        </Steps>

        {currentStep === 0 && (
          <Card>
            <Upload.Dragger
              accept=".csv,.xlsx,.xls"
              beforeUpload={handleFileUpload}
              fileList={
                file ? [{ ...file, status: "done", name: file.name }] : []
              }
              onRemove={() => {
                setFile(null);
                setCurrentStep(0);
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p>Click or drag CSV / Excel file here</p>
              <p className="ant-upload-hint">Max ~50 MB recommended</p>
            </Upload.Dragger>
          </Card>
        )}

        {currentStep === 1 && (
          <Card title="2. Map File Columns to Product Fields">
            {!isMappingValid && (
              <Alert
                message="Required fields"
                description="You must map at least 'Product Name' and 'Product Code' to continue."
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
                  render: (text) => <Tag color="blue">{text || "(empty)"}</Tag>,
                },
                {
                  title: "Map to Field",
                  render: (_, { header }) => (
                    <Select
                      style={{ width: 280 }}
                      placeholder="Select field"
                      allowClear
                      value={mapping[String(headers.indexOf(header))]}
                      onChange={(val) =>
                        setMapping((prev) => {
                          const index = headers.indexOf(header);
                          if (index === -1) return prev;
                          if (val === undefined) {
                            const { [String(index)]: _, ...rest } = prev;
                            return rest;
                          }
                          return { ...prev, [String(index)]: val };
                        })
                      }
                    >
                      {fieldOptions.map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  ),
                },
              ]}
            />

            <div style={{ marginTop: 24, textAlign: "right" }}>
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

        {currentStep === 2 && (
          <Card title="Import Progress">
            {jobId && status ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Alert
                  message={`Job ID: ${jobId} — ${status.status.toUpperCase()}`}
                  type={
                    status.status === "completed"
                      ? "success"
                      : status.status === "failed"
                        ? "error"
                        : "info"
                  }
                  showIcon
                />

                <Progress
                  percent={
                    status.totalRows
                      ? Math.round(
                          (status.processedRows / status.totalRows) * 100,
                        )
                      : 0
                  }
                  status="active"
                />

                <p>
                  <strong>Progress:</strong> {status.processedRows} /{" "}
                  {status.totalRows || "?"}
                </p>
                <p>
                  <strong>Success:</strong> {status.successCount} |{" "}
                  <strong>Failed:</strong> {status.failedCount}
                </p>
                <p>
                  New Categories: {status.newCategories || 0} | Brands:{" "}
                  {status.newBrands || 0} | Vendors: {status.newVendors || 0}
                </p>

                {status.failedCount > 0 && status.errorLog?.length > 0 && (
                  <>
                    <Title level={5}>Failed Rows</Title>
                    <Table
                      size="small"
                      dataSource={status.errorLog}
                      columns={[
                        { title: "Row", dataIndex: "rowIndex", width: 80 },
                        {
                          title: "Code",
                          dataIndex: "product_code",
                          width: 140,
                        },
                        { title: "Error", dataIndex: "error" },
                      ]}
                      pagination={{ pageSize: 5 }}
                      scroll={{ x: true }}
                    />
                  </>
                )}
              </Space>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Spin tip="Queuing job..." />
              </div>
            )}
          </Card>
        )}

        {(isStarting || isPolling) && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Spin tip="Processing..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkProductImport;
