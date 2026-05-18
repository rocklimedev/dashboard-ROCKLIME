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
import { useBulkInventoryUpdateMutation } from "../../api/productApi"; // ← NEW
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import AddBrandModal from "../../components/Brands/AddBrandModal";

const { Step } = Steps;
const { Option } = Select;
const { Title, Text } = Typography;

const BulkProductImport = () => {
  const [activeTab, setActiveTab] = useState("products"); // "products" | "inventory"
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [jobId, setJobId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);

  // Mutations
  const [startBulkImport, { isLoading: isStarting }] =
    useStartBulkImportMutation();
  const [bulkInventoryUpdate] = useBulkInventoryUpdateMutation();

  const { data: jobStatus } = useGetJobStatusQuery(jobId, {
    skip: !jobId,
    pollingInterval: 5000,
  });

  // Brands (only needed for Product Import)
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

  // ── Dynamic Field Options ─────────────────────────────────────
  const fieldOptions = useMemo(() => {
    if (activeTab === "products") {
      return [
        // ── Core required fields ─────────────────────────────────────────────
        { value: "name", label: "Product Name *", required: true },
        { value: "product_code", label: "Product Code *", required: true },

        // ── Standard product fields ──────────────────────────────────────────
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

        // ── Variant / Master fields (optional) ───────────────────────────────
        { value: "is_master", label: "Is Master Product? (yes/no/true/false)" },
        { value: "is_variant", label: "Is Variant? (yes/no/true/false)" },
        { value: "variant_name", label: "Variant Name (e.g. Color)" },
        { value: "variant_value", label: "Variant Value (e.g. Red)" },

        // ── Meta fields using REAL UUIDs from product_metas table ─────────────
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
      // Inventory Update
      return [
        { value: "product_code", label: "Product Code *", required: true },
        { value: "quantity", label: "Quantity to Add *", required: true },
        { value: "warehouse", label: "Warehouse / Location" },
        { value: "message", label: "Custom Note / Remark" },
      ];
    }
  }, [activeTab]);

  const requiredFields = fieldOptions
    .filter((f) => f.required)
    .map((f) => f.value);
  const isMappingValid = requiredFields.every((field) =>
    Object.values(mapping).includes(field),
  );

  // ── File Upload ───────────────────────────────────────────────────
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
          parsedHeaders = result.data[0] || [];
        } else {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          parsedHeaders = json[0] || [];
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

  // ── Parse File Data with Mapping ─────────────────────────────────
  const parseFileData = (fileToParse, colMapping) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const isCsv = fileToParse.name.toLowerCase().endsWith(".csv");
          let rows = [];

          if (isCsv) {
            const result = Papa.parse(e.target.result, {
              header: true,
              skipEmptyLines: true,
            });
            rows = result.data;
          } else {
            const workbook = XLSX.read(e.target.result, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(sheet);
          }

          const mappedData = rows.map((row) => {
            const mapped = {};
            Object.keys(colMapping).forEach((colIndex) => {
              const field = colMapping[colIndex];
              mapped[field] = row[headers[colIndex]] ?? null;
            });
            return mapped;
          });

          resolve(mappedData);
        } catch (err) {
          reject(err);
        }
      };

      if (fileToParse.name.toLowerCase().endsWith(".csv")) {
        reader.readAsText(fileToParse);
      } else {
        reader.readAsArrayBuffer(fileToParse);
      }
    });
  };

  // ── Start Import ─────────────────────────────────────────────────
  const handleStartImport = async () => {
    if (!isMappingValid) {
      message.warning("Please map all required fields");
      return;
    }

    setImporting(true);

    try {
      if (activeTab === "products") {
        if (!selectedBrandId) {
          message.error("Please select a brand");
          return;
        }

        const result = await startBulkImport({
          file,
          mapping,
          selectedBrandId: String(selectedBrandId),
        }).unwrap();

        message.success("Product import job started!");
        setJobId(result.jobId);
      } else {
        // Inventory Update
        const parsedData = await parseFileData(file, mapping);

        const result = await bulkInventoryUpdate({
          updates: parsedData,
        }).unwrap();

        message.success(
          `Inventory updated successfully! ${result.successCount} products affected.`,
        );
        setCurrentStep(2);
        // For direct update, we don't use job polling
        setJobId(null);
        return;
      }

      setCurrentStep(2);
      setStartTime(Date.now());
      setProcessedHistory([]);
    } catch (err) {
      message.error(err?.data?.message || "Failed to start import");
    } finally {
      setImporting(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────
  const handleReset = () => {
    setCurrentStep(0);
    setFile(null);
    setHeaders([]);
    setMapping({});
    setJobId(null);
    setStartTime(null);
    setProcessedHistory([]);
  };

  // ── Download Template ────────────────────────────────────────────
  const downloadTemplate = () => {
    let templateHeaders = [];

    if (activeTab === "products") {
      templateHeaders = [
        "name",
        "product_code",
        "description",
        "quantity",
        "category",
        "vendor",
        "keywords",
      ];
    } else {
      templateHeaders = ["product_code", "quantity", "warehouse", "message"];
    }

    const ws = XLSX.utils.aoa_to_sheet([templateHeaders]);
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
          <FileExcelOutlined /> Product Import
        </span>
      ),
    },
    {
      key: "inventory",
      label: (
        <span>
          <DatabaseOutlined /> Bulk Inventory Update
        </span>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Card>
          <Space align="center" style={{ marginBottom: 24 }} size="middle">
            <Title level={3} style={{ margin: 0 }}>
              Bulk Import Center
            </Title>
          </Space>

          <Alert
            message="All operations are safe and logged"
            description="Inventory updates create proper history records."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ marginBottom: 32 }}
          />

          <Steps current={currentStep} style={{ margin: "32px 0" }}>
            <Step title="Upload File" />
            <Step title="Map Columns" />
            <Step title="Result" />
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
                    Select Brand *
                  </label>
                  <Space>
                    <Select
                      placeholder="Choose brand"
                      style={{ width: 400 }}
                      showSearch
                      value={selectedBrandId}
                      onChange={setSelectedBrandId}
                      loading={brandsLoading}
                    >
                      {brands.map((b) => (
                        <Option key={b.id} value={b.id}>
                          {b.brandName}
                        </Option>
                      ))}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddBrandModal(true)}
                    >
                      Add Brand
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
                disabled={activeTab === "products" && !selectedBrandId}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p>
                  Click or drag{" "}
                  {activeTab === "products" ? "Product" : "Inventory"} file here
                </p>
              </Upload.Dragger>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                  Download {activeTab === "products" ? "Product" : "Inventory"}{" "}
                  Template
                </Button>
              </div>
            </Card>
          )}

          {/* Step 1: Mapping */}
          {currentStep === 1 && (
            <Card
              title={`Map Columns → ${activeTab === "products" ? "Product Fields" : "Inventory Fields"}`}
            >
              <Table
                size="small"
                pagination={false}
                dataSource={headers.map((h, i) => ({ key: i, header: h }))}
                columns={[
                  {
                    title: "File Column",
                    dataIndex: "header",
                    render: (text) => <Tag color="blue">{text}</Tag>,
                  },
                  {
                    title: "Map to Field",
                    render: (_, { header }, index) => (
                      <Select
                        style={{ width: 320 }}
                        placeholder="Select field"
                        allowClear
                        value={mapping[index]}
                        onChange={(val) =>
                          setMapping((prev) =>
                            val
                              ? { ...prev, [index]: val }
                              : { ...prev, [index]: undefined },
                          )
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

              <Divider />
              <div style={{ textAlign: "right" }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleStartImport}
                  loading={importing}
                  disabled={!file || !isMappingValid}
                >
                  {activeTab === "products"
                    ? "Start Product Import"
                    : "Update Inventory Now"}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Result */}
          {currentStep === 2 && (
            <Card
              title={
                activeTab === "products"
                  ? `Job #${jobId?.slice(0, 8)}`
                  : "Inventory Update Result"
              }
            >
              {activeTab === "products" && jobStatus ? (
                // Existing job progress UI (unchanged)
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
                  {/* ... your existing progress UI ... */}
                  {jobStatus.status === "completed" && (
                    <Result
                      status="success"
                      title="Import Completed"
                      extra={[
                        <Button onClick={handleReset}>New Import</Button>,
                      ]}
                    />
                  )}
                </Space>
              ) : (
                <Result
                  status="success"
                  title="Inventory Updated Successfully"
                  subTitle="Stock levels and history records have been updated."
                  extra={[
                    <Button type="primary" onClick={handleReset}>
                      Import Another File
                    </Button>,
                  ]}
                />
              )}
            </Card>
          )}
        </Card>
      </div>

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
