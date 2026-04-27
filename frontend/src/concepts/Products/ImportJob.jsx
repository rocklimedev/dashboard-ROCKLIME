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
  Progress,
  Typography,
  Alert,
  Result,
  Divider,
  Select,
  Tabs,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
  FileExcelOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  useStartBulkImportMutation,
  useGetJobStatusQuery,
} from "../../api/jobsApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import AddBrandModal from "../../components/Brands/AddBrandModal";
import { useSearchParams } from "react-router-dom"; // ← Added for URL params

const { Step } = Steps;
const { Option } = Select;
const { Title, Text } = Typography;

const BulkProductImport = () => {
  const [searchParams, setSearchParams] = useSearchParams(); // ← URL Params

  // Get initial tab from URL or default to "products"
  const initialTab =
    searchParams.get("tab") === "inventory" ? "inventory" : "products";

  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState(initialTab); // "products" or "inventory"

  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [jobId, setJobId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);

  const [startBulkImport, { isLoading: isStarting }] =
    useStartBulkImportMutation();

  const { data: jobStatus } = useGetJobStatusQuery(jobId, {
    skip: !jobId,
    pollingInterval: 5000,
  });

  // Brands (only for Product Import)
  const {
    data: brandsData = [],
    isLoading: brandsLoading,
    refetch: refetchBrands,
  } = useGetAllBrandsQuery();

  const brands = brandsData || [];

  // ── Time estimation logic ─────────────────────────────────────
  const [startTime, setStartTime] = useState(null);
  const [processedHistory, setProcessedHistory] = useState([]);

  useEffect(() => {
    if (
      jobStatus?.progress?.processedRows > 0 &&
      jobStatus?.status === "processing"
    ) {
      const now = Date.now();
      setProcessedHistory((prev) => [
        ...prev.slice(-9),
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

  // ── Field mapping options based on active tab ─────────────────────────────────────
  const fieldOptions = useMemo(() => {
    if (activeTab === "products") {
      return [
        { value: "name", label: "Product Name *", required: true },
        { value: "product_code", label: "Product Code *", required: true },
        { value: "description", label: "Description" },
        { value: "quantity", label: "Initial Quantity" },
        { value: "alert_quantity", label: "Low Stock Alert Quantity" },
        { value: "tax", label: "Tax (%)" },
        { value: "isFeatured", label: "Featured (true / yes / 1)" },
        { value: "category", label: "Category Name" },
        { value: "vendor", label: "Vendor Name" },
        {
          value: "brand_parentcategoriesId",
          label: "Brand Parent Category ID (UUID)",
        },
        { value: "keywords", label: "Keywords (comma separated)" },
        { value: "images", label: "Image URLs (comma separated)" },
        { value: "is_master", label: "Is Master Product? (yes/no/true/false)" },
        { value: "is_variant", label: "Is Variant? (yes/no/true/false)" },
        { value: "variant_name", label: "Variant Name" },
        { value: "variant_value", label: "Variant Value" },
        // Meta fields
        {
          value: "meta_0f429633-220c-478b-972e-817193a527f2",
          label: "Size (mm)",
        },
        {
          value: "meta_16ffa365-3b25-4230-a8f5-73ba5b8ac5a1",
          label: "Product Segment",
        },
        {
          value: "meta_32cef946-b417-4acf-a342-58e6c60f5aa4",
          label: "Area Covered per Box (sqft)",
        },
        {
          value: "meta_4ded1cb3-5d31-42e8-90ec-a381a6ab1e35",
          label: "Barcode",
        },
        {
          value: "meta_73c6caff-3b7d-4eae-bb7a-dfd176d130c7",
          label: "MRP per Pcs (INR)",
        },
        {
          value: "meta_7687da21-9173-4172-9371-51aa426de108",
          label: "Purchasing Price (INR)",
        },
        {
          value: "meta_7e2b4efb-4ff2-4e4d-9b08-82559a7e3cd0",
          label: "Size (inches/feet)",
        },
        {
          value: "meta_81cd6d76-d7d2-4226-b48e-6704e6224c2b",
          label: "Product Group",
        },
        {
          value: "meta_963ad7fb-734b-41d7-a95a-27a84e068ae0",
          label: "MRP per Box (INR)",
        },
        {
          value: "meta_9ba862ef-f993-4873-95ef-1fef10036aa5",
          label: "Selling Price (INR)",
        },
        {
          value: "meta_af3b4db4-6365-4dbc-b46b-4c9a744b1b4e",
          label: "Length (inch)",
        },
        {
          value: "meta_d11da9f9-3f2e-4536-8236-9671200cca4a",
          label: "Company Code",
        },
        {
          value: "meta_d3d3bd17-86fd-4390-83ea-8822755b8de9",
          label: "Width (inch)",
        },
        {
          value: "meta_e926224f-7ca6-4e28-b28c-69f0162d57c4",
          label: "Area Covered per Pcs (sqft)",
        },
        {
          value: "meta_ff53919e-40ac-4cb9-9b8e-d159547901f7",
          label: "Pcs per Box",
        },
      ];
    } else {
      // Inventory Import Fields
      return [
        { value: "product_code", label: "Product Code *", required: true },
        { value: "quantity", label: "Quantity *", required: true },
        { value: "warehouse", label: "Warehouse / Location" },
        { value: "batch_number", label: "Batch Number" },
        { value: "expiry_date", label: "Expiry Date (YYYY-MM-DD)" },
        { value: "purchase_price", label: "Purchase Price (INR)" },
        { value: "selling_price", label: "Selling Price (INR)" },
        { value: "mrp", label: "MRP (INR)" },
        { value: "notes", label: "Notes / Remarks" },
      ];
    }
  }, [activeTab]);

  const requiredFields = fieldOptions
    .filter((f) => f.required)
    .map((f) => f.value);

  const isMappingValid = requiredFields.every((field) =>
    Object.values(mapping).includes(field),
  );

  // ── Update URL when tab changes ───────────────────────────────────────────
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key }); // ← Update URL param
    handleReset(); // Reset form when switching tabs
  };

  // ── File upload & parse ───────────────────────────────────────────────────
  const handleFileUpload = (uploadedFile) => {
    if (activeTab === "products" && !selectedBrandId) {
      message.error("Please select a brand first");
      return false;
    }

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
      }
    };

    if (isCsv) reader.readAsText(uploadedFile);
    else reader.readAsArrayBuffer(uploadedFile);

    return false;
  };

  // ── Start import with proper params ───────────────────────────────────────
  const handleStartImport = async () => {
    if (!isMappingValid) {
      message.warning("Please map all required fields");
      return;
    }
    if (activeTab === "products" && !selectedBrandId) {
      message.error("Please select a brand before starting import");
      return;
    }

    setImporting(true);

    try {
      const payload = {
        file,
        mapping,
        importType: activeTab, // ← Tab type sent to backend
        selectedBrandId:
          activeTab === "products" ? String(selectedBrandId) : null,
      };

      const result = await startBulkImport(payload).unwrap();

      message.success(
        `${activeTab === "products" ? "Product" : "Inventory"} import job started successfully!`,
      );

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

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setCurrentStep(0);
    setFile(null);
    setHeaders([]);
    setMapping({});
    setJobId(null);
    setStartTime(null);
    setProcessedHistory([]);
  };

  // ── Download Template ─────────────────────────────────────────────────────
  const downloadTemplate = () => {
    let templateData = [];

    if (activeTab === "products") {
      templateData = [
        [
          "name",
          "product_code",
          "description",
          "quantity",
          "category",
          "vendor",
          "keywords",
          "images",
        ],
      ];
    } else {
      templateData = [
        [
          "product_code",
          "quantity",
          "warehouse",
          "batch_number",
          "expiry_date",
          "purchase_price",
          "selling_price",
          "mrp",
          "notes",
        ],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      activeTab === "products" ? "Products" : "Inventory",
    );
    XLSX.writeFile(wb, `bulk-${activeTab}-import-template.xlsx`);
  };

  const handleBrandCreated = () => {
    refetchBrands();
    setShowAddBrandModal(false);
    message.success("Brand added successfully!");
  };

  const tabItems = [
    {
      key: "products",
      label: (
        <span>
          <FileExcelOutlined /> Import Brand Products
        </span>
      ),
    },
    {
      key: "inventory",
      label: (
        <span>
          <DatabaseOutlined /> Import Inventory
        </span>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Card>
          <Space
            align="center"
            style={{ marginBottom: 24, flexWrap: "wrap" }}
            size="middle"
          >
            <Title level={3} style={{ margin: 0 }}>
              Bulk Import Center
            </Title>
          </Space>

          <Alert
            message="All imports run in the background"
            description="You can safely navigate away. The job will continue processing on the server."
            type="info"
            showIcon
            style={{ marginBottom: 32 }}
          />

          {/* Tabs with URL Params Support */}
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange} // ← Updated to use handleTabChange
            items={tabItems}
            style={{ marginBottom: 32 }}
          />

          <Steps current={currentStep} style={{ margin: "32px 0" }}>
            <Step title="Select & Upload" />
            <Step title="Map Columns" />
            <Step title="Import Progress" />
          </Steps>

          {/* Step 0: Upload */}
          {currentStep === 0 && (
            <Card>
              {activeTab === "products" && (
                <div style={{ marginBottom: 32 }}>
                  <label
                    style={{
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    Select Brand (applied to all products in this import) *
                  </label>
                  <Space style={{ width: "100%" }}>
                    <Select
                      placeholder="Choose brand"
                      style={{ width: "100%", minWidth: 320, maxWidth: 500 }}
                      showSearch
                      optionFilterProp="children"
                      value={selectedBrandId}
                      onChange={setSelectedBrandId}
                      loading={brandsLoading}
                      disabled={brandsLoading}
                      filterOption={(input, option) =>
                        (option?.children ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {brands.map((brand) => (
                        <Option key={brand.id} value={brand.id}>
                          {brand.brandName}{" "}
                          {brand.brandSlug && `(${brand.brandSlug})`}
                        </Option>
                      ))}
                    </Select>

                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddBrandModal(true)}
                    >
                      Add New Brand
                    </Button>
                  </Space>
                </div>
              )}

              <Upload.Dragger
                accept=".csv,.xlsx,.xls"
                beforeUpload={handleFileUpload}
                fileList={
                  file ? [{ ...file, status: "done", name: file.name }] : []
                }
                onRemove={() => setFile(null)}
                disabled={
                  activeTab === "products" &&
                  (!selectedBrandId || brandsLoading)
                }
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p>
                  {activeTab === "products" && !selectedBrandId
                    ? "Please select a brand first"
                    : `Click or drag ${activeTab === "products" ? "Product" : "Inventory"} file here`}
                </p>
                <p className="ant-upload-hint">
                  Supported formats: CSV, XLSX • Max ~50 MB
                </p>
              </Upload.Dragger>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                  Download {activeTab === "products" ? "Products" : "Inventory"}{" "}
                  Template
                </Button>
              </div>
            </Card>
          )}

          {/* Step 1: Mapping */}
          {currentStep === 1 && (
            <Card
              title={`Map File Columns → ${activeTab === "products" ? "Product Fields" : "Inventory Fields"}`}
            >
              {!isMappingValid && (
                <Alert
                  message="Required fields missing"
                  description={`Please map all * fields (${activeTab === "products" ? "Name & Code" : "Code & Quantity"})`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Table
                size="small"
                pagination={false}
                dataSource={headers.map((h, i) => ({
                  key: `${i}-${h}`,
                  header: h,
                }))}
                columns={[
                  {
                    title: "Column in Your File",
                    dataIndex: "header",
                    render: (text) => (
                      <Tag color="blue">{text || "(empty)"}</Tag>
                    ),
                  },
                  {
                    title: "Map to System Field",
                    render: (_, { header }) => {
                      const colIndex = headers.indexOf(header);
                      return (
                        <Select
                          style={{ width: 340 }}
                          placeholder="Select matching field"
                          allowClear
                          value={mapping[colIndex]}
                          onChange={(val) => {
                            setMapping((prev) => {
                              if (val === undefined) {
                                const { [colIndex]: removed, ...rest } = prev;
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
                  size="large"
                  onClick={handleStartImport}
                  loading={isStarting || importing}
                  disabled={
                    !file ||
                    !isMappingValid ||
                    (activeTab === "products" && !selectedBrandId)
                  }
                >
                  Start Background Import
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Progress */}
          {currentStep === 2 && jobId && (
            <Card
              title={`Import Job #${jobId.slice(0, 8)}... - ${activeTab.toUpperCase()}`}
            >
              {jobStatus ? (
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
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

                  {jobStatus.errorLog?.length > 0 && (
                    <>
                      <Title level={5}>Failed Rows</Title>
                      <Table
                        size="small"
                        dataSource={jobStatus.errorLog}
                        columns={[
                          { title: "Row", dataIndex: "row", width: 80 },
                          { title: "Error Message", dataIndex: "message" },
                        ]}
                        pagination={{ pageSize: 5 }}
                      />
                    </>
                  )}

                  {jobStatus.status === "completed" && (
                    <Result
                      status="success"
                      title="Import Completed Successfully"
                      subTitle="You can now import another file."
                      extra={[
                        <Button type="primary" onClick={handleReset}>
                          Import Another File
                        </Button>,
                      ]}
                    />
                  )}

                  {jobStatus.status === "processing" && (
                    <Alert
                      message="Processing in Background"
                      description="This job is running on the server. You can safely leave this page."
                      type="info"
                      showIcon
                    />
                  )}
                </Space>
              ) : (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                  <Spin tip="Initializing import job..." size="large" />
                </div>
              )}
            </Card>
          )}
        </Card>
      </div>

      {/* Add Brand Modal */}
      {showAddBrandModal && (
        <AddBrandModal
          onClose={() => setShowAddBrandModal(false)}
          onSuccess={handleBrandCreated}
        />
      )}
    </div>
  );
};

export default BulkProductImport;
