// src/pages/products/BulkProductImport.jsx
import React, { useState, useMemo } from "react";
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
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useBulkImportProductsMutation } from "../../api/productApi"; // ← adjust path

const { Step } = Steps;
const { Option } = Select;
const { Title, Text } = Typography;

const BULK_CHUNK_SIZE = 150;

const BulkProductImport = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [mapping, setMapping] = useState({});
  const [processedProducts, setProcessedProducts] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    failed: [],
    newCategories: new Set(),
    newBrands: new Set(),
    newVendors: new Set(),
  });

  const [bulkImport, { isLoading: mutationLoading }] =
    useBulkImportProductsMutation();

  const fieldOptions = useMemo(
    () => [
      { value: "name", label: "Product Name *", required: true },
      { value: "product_code", label: "Product Code *", required: true },
      { value: "description", label: "Description" },
      { value: "quantity", label: "Initial Quantity" },
      { value: "alert_quantity", label: "Low Stock Alert Qty" },
      { value: "tax", label: "Tax %" },
      { value: "status", label: "Status (active/out_of_stock)" },
      { value: "isFeatured", label: "Featured (true/false)" },
      { value: "category", label: "Category (name)" },
      { value: "brand", label: "Brand (name)" },
      { value: "vendor", label: "Vendor (name)" },
      { value: "keywords", label: "Keywords (comma separated)" },
      { value: "images", label: "Images (comma separated URLs)" },
      // Meta fields – extend as needed
      { value: "meta_barcode", label: "Barcode" },
      { value: "meta_sellingPrice", label: "Selling Price" },
      { value: "meta_mrp", label: "MRP" },
      { value: "meta_purchasePrice", label: "Purchase Price" },
      // ... add more meta fields
    ],
    [],
  );

  const requiredFields = useMemo(
    () => fieldOptions.filter((f) => f.required).map((f) => f.value),
    [fieldOptions],
  );

  const [loading, setLoading] = useState(false);

  const handleFileUpload = (file) => {
    const isCsv = file.name.endsWith(".csv");
    const isExcel = /\.(xlsx|xls)$/.test(file.name);

    if (!isCsv && !isExcel) {
      message.error("Only .csv, .xlsx, .xls files are allowed");
      return false;
    }

    setFile(file);
    setLoading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let parsedHeaders = [];
        let parsedRows = [];

        if (isCsv) {
          const result = Papa.parse(e.target.result, {
            skipEmptyLines: true,
          });
          if (result.data.length > 0) {
            parsedHeaders = result.data[0];
            parsedRows = result.data
              .slice(1)
              .filter((row) => row.some((cell) => cell?.trim()));
          }
        } else {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (json.length > 0) {
            parsedHeaders = json[0];
            parsedRows = json
              .slice(1)
              .filter((row) => row.some((cell) => cell));
          }
        }

        setHeaders(parsedHeaders);
        setRawData(parsedRows);
        setCurrentStep(1);
        message.success(`File parsed – ${parsedRows.length} rows found`);
      } catch (err) {
        message.error("Failed to parse file");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    return false;
  };

  const isMappingValid = useMemo(() => {
    return requiredFields.every((field) =>
      Object.values(mapping).includes(field),
    );
  }, [mapping, requiredFields]);

  const processAndPreview = () => {
    if (!isMappingValid) {
      message.warning("Please map all required fields (Name & Product Code)");
      return;
    }

    setLoading(true);

    const products = rawData.map((row, idx) => {
      const rowObj = {};
      headers.forEach((header, i) => {
        if (header?.trim()) {
          rowObj[header.trim()] = (row[i] ?? "").toString().trim();
        }
      });

      const product = {
        rowIndex: idx + 2,
        errors: [],
      };

      Object.entries(mapping).forEach(([excelCol, field]) => {
        const value = rowObj[excelCol];
        if (value === undefined || value === "") return;

        if (field === "images") {
          product.images = value
            .split(",")
            .map((u) => u.trim())
            .filter((u) => u && /^https?:\/\//i.test(u));
        } else if (field === "keywords") {
          product.keywords = value
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
        } else if (field === "isFeatured") {
          product.isFeatured = ["true", "1", "yes"].includes(
            value.toLowerCase(),
          );
        } else if (["quantity", "alert_quantity", "tax"].includes(field)) {
          product[field] = parseFloat(value) || 0;
        } else if (field.startsWith("meta_")) {
          product.meta = product.meta || {};
          const metaKey = field.replace("meta_", "");
          product.meta[metaKey] = isNaN(parseFloat(value))
            ? value
            : parseFloat(value);
        } else if (["category", "brand", "vendor"].includes(field)) {
          product[`${field}Name`] = value;
        } else {
          product[field] = value;
        }
      });

      if (!product.name) product.errors.push("Missing product name");
      if (!product.product_code) product.errors.push("Missing product code");

      return product;
    });

    setProcessedProducts(products);
    setCurrentStep(2);
    setLoading(false);
  };

  const startBulkImport = async () => {
    if (processedProducts.some((p) => p.errors?.length > 0)) {
      Modal.confirm({
        title: "Validation issues detected",
        content: "Some rows have errors. Proceed anyway?",
        okText: "Yes, Import Anyway",
        okType: "danger",
        onOk: doImport,
      });
      return;
    }
    doImport();
  };

  const doImport = async () => {
    setImporting(true);
    setProgress({
      current: 0,
      total: processedProducts.length,
      success: 0,
      failed: [],
      newCategories: new Set(),
      newBrands: new Set(),
      newVendors: new Set(),
    });

    const chunks = [];
    for (let i = 0; i < processedProducts.length; i += BULK_CHUNK_SIZE) {
      chunks.push(processedProducts.slice(i, i + BULK_CHUNK_SIZE));
    }

    let totalSuccess = 0;

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];

      const payload = chunk.map((p) => ({
        rowIndex: p.rowIndex,
        name: p.name,
        product_code: p.product_code,
        description: p.description,
        quantity: p.quantity || 0,
        alert_quantity: p.alert_quantity,
        tax: p.tax,
        isFeatured: !!p.isFeatured,
        categoryName: p.categoryName,
        brandName: p.brandName,
        vendorName: p.vendorName,
        keywords: p.keywords || [],
        images: p.images || [],
        meta: p.meta || {},
      }));

      try {
        const res = await bulkImport({ products: payload }).unwrap();

        totalSuccess += res.successCount || 0;

        setProgress((prev) => ({
          ...prev,
          current: (chunkIndex + 1) * BULK_CHUNK_SIZE,
          success: totalSuccess,
          failed: [...prev.failed, ...(res.failed || [])],
          newCategories: new Set([
            ...prev.newCategories,
            ...(res.newCategories || []),
          ]),
          newBrands: new Set([...prev.newBrands, ...(res.newBrands || [])]),
          newVendors: new Set([...prev.newVendors, ...(res.newVendors || [])]),
        }));

        message.success(`Chunk ${chunkIndex + 1}/${chunks.length} processed`);
      } catch (err) {
        const errMsg =
          err?.data?.message ||
          err?.message ||
          "Unknown error during chunk import";

        message.error(`Chunk ${chunkIndex + 1} failed: ${errMsg}`);

        setProgress((prev) => ({
          ...prev,
          current: (chunkIndex + 1) * BULK_CHUNK_SIZE,
          failed: [
            ...prev.failed,
            ...chunk.map((p) => ({
              rowIndex: p.rowIndex,
              product_code: p.product_code || "—",
              error: errMsg,
            })),
          ],
        }));
      }
    }

    setImporting(false);

    Modal.success({
      title: "Import Completed",
      width: 720,
      content: (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            message={`Processed ${progress.total} products`}
            description={
              <div>
                <p>
                  <strong>Successfully imported:</strong> {progress.success}
                </p>
                <p>
                  <strong>Failed / Skipped:</strong> {progress.failed.length}
                </p>
                <p>
                  <strong>New Categories:</strong> {progress.newCategories.size}
                </p>
                <p>
                  <strong>New Brands:</strong> {progress.newBrands.size}
                </p>
                <p>
                  <strong>New Vendors:</strong> {progress.newVendors.size}
                </p>
              </div>
            }
            type="success"
            showIcon
          />

          {progress.failed.length > 0 && (
            <>
              <Title level={5}>Failed / Problematic Rows</Title>
              <Table
                size="small"
                pagination={{ pageSize: 8 }}
                dataSource={progress.failed}
                columns={[
                  { title: "Row", dataIndex: "rowIndex", width: 80 },
                  { title: "Code", dataIndex: "product_code", width: 160 },
                  { title: "Error", dataIndex: "error" },
                ]}
                scroll={{ x: true }}
              />
            </>
          )}
        </Space>
      ),
    });
  };

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
        // extend as needed
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Template");
    XLSX.writeFile(wb, "bulk-product-import-template.xlsx");
  };

  const renderMappingTable = () => (
    <Card title="2. Map Excel Columns to Product Fields">
      <Table
        size="small"
        pagination={false}
        dataSource={headers.map((h, i) => ({ key: i, header: h }))}
        columns={[
          {
            title: "Excel Column",
            dataIndex: "header",
            render: (text) => <Tag color="blue">{text || "(empty)"}</Tag>,
          },
          {
            title: "Map to Field",
            render: (_, { header }) => (
              <Select
                style={{ width: 280 }}
                placeholder="Choose field"
                allowClear
                value={mapping[header]}
                onChange={(val) =>
                  setMapping((prev) => ({ ...prev, [header]: val }))
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
          onClick={processAndPreview}
          disabled={!isMappingValid || loading}
        >
          Preview & Validate →
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <Space align="center" style={{ marginBottom: 24 }}>
          <Title level={3}>Bulk Product Import</Title>
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
          <Step title="Review & Import" />
        </Steps>

        {currentStep === 0 && (
          <Card>
            <Upload.Dragger
              accept=".csv,.xlsx,.xls"
              beforeUpload={handleFileUpload}
              fileList={file ? [{ ...file, status: "done" }] : []}
              onRemove={() => {
                setFile(null);
                setRawData([]);
                setHeaders([]);
                setCurrentStep(0);
              }}
              disabled={loading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file here</p>
              <p className="ant-upload-hint">
                Supports CSV & Excel • Max ~200 MB recommended
              </p>
            </Upload.Dragger>
          </Card>
        )}

        {currentStep === 1 && renderMappingTable()}

        {currentStep === 2 && (
          <Card
            title={
              <Space>
                <span>Review Products ({processedProducts.length})</span>
                {processedProducts.some((p) => p.errors?.length > 0) && (
                  <Tag color="warning">
                    {
                      processedProducts.filter((p) => p.errors?.length > 0)
                        .length
                    }{" "}
                    with issues
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Button onClick={() => setCurrentStep(1)}>
                ← Back to Mapping
              </Button>
            }
          >
            {importing || mutationLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Spin size="large" />
                <div style={{ marginTop: 24 }}>
                  <Progress
                    percent={Math.round(
                      progress.total > 0
                        ? (progress.current / progress.total) * 100
                        : 0,
                    )}
                    status="active"
                  />
                  <Text
                    type="secondary"
                    style={{ marginTop: 8, display: "block" }}
                  >
                    Processing chunk{" "}
                    {Math.ceil(progress.current / BULK_CHUNK_SIZE)} of{" "}
                    {Math.ceil(progress.total / BULK_CHUNK_SIZE)}
                  </Text>
                </div>
              </div>
            ) : (
              <>
                {processedProducts.length === 0 ? (
                  <Empty description="No products to import" />
                ) : (
                  <div style={{ maxHeight: "60vh", overflow: "auto" }}>
                    <Table
                      size="small"
                      pagination={{ pageSize: 10 }}
                      dataSource={processedProducts}
                      rowKey="rowIndex"
                      columns={[
                        { title: "Row", dataIndex: "rowIndex", width: 70 },
                        { title: "Name", dataIndex: "name" || "—" },
                        { title: "Code", dataIndex: "product_code" || "—" },
                        {
                          title: "Status",
                          render: (_, record) =>
                            record.errors?.length > 0 ? (
                              <Tag color="error">
                                Issues ({record.errors.length})
                              </Tag>
                            ) : (
                              <Tag color="success">Ready</Tag>
                            ),
                        },
                        {
                          title: "Action",
                          render: (_, __, idx) => (
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                setProcessedProducts((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                            />
                          ),
                        },
                      ]}
                    />
                  </div>
                )}

                <div style={{ marginTop: 32, textAlign: "center" }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={startBulkImport}
                    loading={importing || mutationLoading}
                    disabled={
                      processedProducts.length === 0 ||
                      importing ||
                      mutationLoading
                    }
                  >
                    Start Bulk Import ({processedProducts.length})
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" tip="Parsing file..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkProductImport;
