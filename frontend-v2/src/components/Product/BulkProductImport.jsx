// src/pages/products/BulkProductImport.jsx
import React, { useState } from "react";
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
  Empty,
  Select,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import CreateProduct from "./CreateProduct";

import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
const { Step } = Steps;
const { Option } = Select;

const BulkProductImport = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [processedProducts, setProcessedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch reference data at component level ← THIS FIXES THE ERROR
  const {
    data: categoryData = { categories: [] },
    isLoading: loadingCategories,
  } = useGetAllCategoriesQuery();
  const { data: brands = [], isLoading: loadingBrands } =
    useGetAllBrandsQuery();
  const { data: vendors = [], isLoading: loadingVendors } =
    useGetVendorsQuery();

  const categories = categoryData.categories || [];
  const metaFieldOptions = [
    { value: "meta_barcode", label: "Barcode" },
    { value: "meta_companyCode", label: "Company Code" },
    { value: "meta_productGroup", label: "Product Group" },
    { value: "meta_sellingPrice", label: "Selling Price" },
    { value: "meta_mrpPerPcs", label: "MRP per Pcs" },
    { value: "meta_mrpPerBox", label: "MRP per Box" },
    { value: "meta_purchasingPrice", label: "Purchasing Price" },
    { value: "meta_sizeMM", label: "Size (mm)" },
    { value: "meta_sizeFeet", label: "Size (inches/feet)" },
    { value: "meta_pcsPerBox", label: "Pcs per Box" },
    { value: "meta_areaCoveredPerBox", label: "Area Covered per Box (sqft)" },
    { value: "meta_areaCoveredPerPcs", label: "Area Covered per Pcs (sqft)" },
    { value: "meta_length", label: "Length (inch)" },
    { value: "meta_width", label: "Width (inch)" },
    { value: "meta_productSegment", label: "Product Segment" },
    // Add more as needed
  ];
  const fieldOptions = [
    // Core fields
    { value: "name", label: "Product Name" },
    { value: "product_code", label: "Product Code" },
    { value: "description", label: "Description" },
    { value: "quantity", label: "Quantity" },
    { value: "alert_quantity", label: "Low Stock Alert" },
    { value: "tax", label: "Tax (%)" },
    { value: "status", label: "Status" },
    { value: "isFeatured", label: "Featured (true/false)" },
    { value: "discountType", label: "Discount Type (percent/fixed)" },

    // Relationships
    { value: "category", label: "Category (by name)" },
    { value: "brand", label: "Brand (by name)" },
    { value: "vendor", label: "Vendor (by name)" },
    { value: "brand_parentcategories", label: "Parent Category (by name)" },

    // Variants
    { value: "isMaster", label: "Is Master Product (true/false)" },
    { value: "masterProductName", label: "Master Product Name" },
    { value: "variantAttributes", label: "Variant Attributes (JSON)" },

    // Other
    { value: "keywords", label: "Keywords (comma-separated)" },
    { value: "images", label: "Images (comma-separated URLs)" },

    // === REAL META FIELDS (mapped to correct slugs) ===
    ...metaFieldOptions,
  ];

  const handleUpload = (file) => {
    setLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;

      if (file.name.endsWith(".csv")) {
        Papa.parse(content, {
          complete: (result) => {
            if (result.data.length > 0) {
              setHeaders(result.data[0]);
              setRawData(
                result.data
                  .slice(1)
                  .filter((row) => row.some((cell) => cell && cell.trim()))
              );
              message.success("CSV parsed successfully");
              setCurrentStep(1);
            }
          },
          header: false,
        });
      } else {
        const workbook = XLSX.read(content, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length > 0) {
          setHeaders(json[0]);
          setRawData(json.slice(1).filter((row) => row.some((cell) => cell)));
          message.success("Excel parsed successfully");
          setCurrentStep(1);
        }
      }
      setFile(file);
      setLoading(false);
    };

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    return false;
  };

  const renderMappingStep = () => (
    <Card title="Map Columns to Product Fields">
      <Table
        dataSource={headers.map((h, i) => ({ key: i, header: h }))}
        pagination={false}
        columns={[
          {
            title: "Excel Column",
            dataIndex: "header",
            render: (text) => <Tag color="blue">{text || "<Empty>"}</Tag>,
          },
          {
            title: "Map to →",
            render: (_, record) => (
              <Select
                style={{ width: 250 }}
                placeholder="Select field"
                allowClear
                value={mapping[record.header]}
                onChange={(value) => {
                  setMapping((prev) => ({
                    ...prev,
                    [record.header]: value,
                  }));
                }}
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
          onClick={() => {
            const required = ["name", "product_code"];
            const hasRequired = required.some((r) =>
              Object.values(mapping).includes(r)
            );
            if (!hasRequired) {
              message.warning(
                "Please map at least Product Name and Product Code"
              );
              return;
            }
            processData();
          }}
          disabled={loadingCategories || loadingBrands || loadingVendors}
        >
          Preview Products →
        </Button>
      </div>
    </Card>
  );
  const metaSlugMap = {
    meta_barcode: "barcode",
    meta_companyCode: "companyCode",
    meta_productGroup: "productGroup",
    meta_sellingPrice: "sellingPrice",
    meta_mrpPerPcs: "mrpPerPcs",
    meta_mrpPerBox: "mrpPerBox",
    meta_purchasingPrice: "purchasingPrice",
    meta_sizeMM: "sizeMM",
    meta_sizeFeet: "sizeFeet",
    meta_pcsPerBox: "pcsPerBox",
    meta_areaCoveredPerBox: "areaCoveredPerBox",
    meta_areaCoveredPerPcs: "areaCoveredPerPcs",
    meta_length: "length",
    meta_width: "width",
    meta_productSegment: "productSegment",
    // Add others as needed
  };
  const processData = () => {
    if (loadingCategories || loadingBrands || loadingVendors) {
      message.warning("Still loading reference data...");
      return;
    }

    setLoading(true);

    const productsToCreate = rawData.map((row, index) => {
      const rowObj = {};
      headers.forEach((h, i) => {
        if (h && h.trim()) {
          rowObj[h.trim()] = (row[i] || "").toString().trim();
        }
      });

      const product = {
        rowIndex: index + 2, // Excel row number for display
        meta: {}, // Collect meta/spec fields
        images: [], // Will hold image URLs from the sheet
      };

      // Map Excel columns → product fields based on user mapping
      Object.entries(mapping).forEach(([excelCol, formField]) => {
        const rawValue = rowObj[excelCol];
        if (rawValue === undefined || rawValue === "") return;

        const value = rawValue;

        // === HANDLE IMAGES ===
        if (formField === "images") {
          const urls = value
            .split(",")
            .map((u) => u.trim())
            .filter(
              (u) => u && (u.startsWith("http://") || u.startsWith("https://"))
            );

          if (urls.length > 0) {
            // Limit to 5 if needed
            const limitedUrls = urls.slice(0, 5);
            product.images = limitedUrls; // ← This must be an array of strings

            if (urls.length > 5) {
              product.imageWarning = `Truncated to 5 images (max allowed)`;
            }
          } else {
            product.images = []; // Ensure it's always an array
          }
        }
        // === META FIELDS ===
        // === META FIELDS (using real slugs from product_metas table) ===
        else if (formField.startsWith("meta_")) {
          const slug = metaSlugMap[formField];
          if (slug) {
            // Convert to number if it's a numeric field
            const numericSlugs = [
              "sellingPrice",
              "mrpPerPcs",
              "mrpPerBox",
              "purchasingPrice",
              "sizeMM",
              "pcsPerBox",
              "areaCoveredPerBox",
              "areaCoveredPerPcs",
              "length",
              "width",
            ];

            let parsedValue = value;
            if (numericSlugs.includes(slug)) {
              parsedValue =
                value === "" || value === null ? null : parseFloat(value);
              if (isNaN(parsedValue)) parsedValue = value; // fallback to string if invalid
            }

            product.meta = product.meta || {};
            product.meta[slug] = parsedValue || null;
          }
        }
        // === KEYWORDS ===
        else if (formField === "keywords") {
          product.keywords = value
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
        }
        // === BOOLEAN FIELDS ===
        else if (formField === "isFeatured" || formField === "isMaster") {
          product[formField] = ["true", "1", "yes", "y"].includes(
            value.toLowerCase()
          );
        }
        // === NUMERIC FIELDS ===
        else if (["quantity", "tax", "alert_quantity"].includes(formField)) {
          product[formField] = parseFloat(value) || 0;
        }
        // === REFERENCE BY NAME ===
        else if (formField === "category") {
          product.categoryName = value;
        } else if (formField === "brand") {
          product.brandName = value;
        } else if (formField === "vendor") {
          product.vendorName = value;
        } else if (formField === "brand_parentcategories") {
          product.brandParentCategoryName = value;
        }
        // === VARIANT ATTRIBUTES ===
        else if (formField === "variantAttributes") {
          try {
            const parsed = JSON.parse(value);
            product.variantOptions = parsed;
            product.variantAttributes = Object.entries(parsed).map(
              ([k, v]) => ({
                key: k,
                value: v,
              })
            );
          } catch (e) {
            product.variantOptionsNote = value; // fallback if invalid JSON
          }
        }
        // === MASTER PRODUCT NAME (for variants) ===
        else if (formField === "masterProductName") {
          product.masterProductName = value;
        }
        // === ALL OTHER DIRECT FIELDS ===
        else {
          product[formField] = value;
        }
      });

      // === RESOLVE EXISTING REFERENCES OR MARK FOR CREATION ===

      // Category
      if (product.categoryName) {
        const existingCat = categories.find(
          (c) => c.name.toLowerCase() === product.categoryName.toLowerCase()
        );
        if (existingCat) {
          product.categoryId = existingCat.categoryId;
          delete product.categoryName;
        } else {
          product.categoryToCreate = product.categoryName;
        }
      }

      // Brand
      if (product.brandName) {
        const existingBrand = brands.find(
          (b) => b.brandName.toLowerCase() === product.brandName.toLowerCase()
        );
        if (existingBrand) {
          product.brandId = existingBrand.id;
          delete product.brandName;
        } else {
          product.brandToCreate = product.brandName;
        }
      }

      // Vendor
      if (product.vendorName) {
        const existingVendor = vendors.find(
          (v) =>
            v.vendorName?.toLowerCase() === product.vendorName.toLowerCase()
        );
        if (existingVendor) {
          product.vendorId = existingVendor.id;
          delete product.vendorName;
        } else {
          product.vendorToCreate = product.vendorName;
        }
      }

      // Parent Category (optional – just store name for now)
      if (product.brandParentCategoryName) {
        product.brand_parentcategoriesName = product.brandParentCategoryName;
      }

      // Ensure required fields for display
      if (!product.name) product.name = "[Missing Name]";
      if (!product.product_code) product.product_code = "[Missing Code]";

      return product;
    });

    setProcessedProducts(productsToCreate);
    setCurrentStep(2);
    setLoading(false);
    message.success(
      `${productsToCreate.length} products processed with images, meta, and references!`
    );
  };

  const renderPreviewStep = () => (
    <div>
      <h3>Review & Edit Products ({processedProducts.length})</h3>
      <div style={{ maxHeight: "80vh", overflowY: "auto", padding: "0 8px" }}>
        {processedProducts.map((productData, index) => (
          <Card
            key={index}
            title={`Product ${index + 1}: ${productData.name || "Untitled"}`}
            style={{ marginBottom: 24 }}
            extra={
              <Space>
                <Tag color="purple">Row {productData.rowIndex}</Tag>
                {productData.categoryToCreate && (
                  <Tag color="orange">
                    New Category: {productData.categoryToCreate}
                  </Tag>
                )}
                {productData.brandToCreate && (
                  <Tag color="volcano">
                    New Brand: {productData.brandToCreate}
                  </Tag>
                )}
                {productData.vendorToCreate && (
                  <Tag color="blue">
                    New Vendor: {productData.vendorToCreate}
                  </Tag>
                )}

                {/* DELETE BUTTON */}
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    // Confirm before delete
                    Modal.confirm({
                      title: "Remove this product?",
                      content: `Are you sure you want to remove "${
                        productData.name || "this product"
                      }" from the import list?`,
                      okText: "Yes, Remove",
                      okType: "danger",
                      cancelText: "Cancel",
                      onOk: () => {
                        setProcessedProducts((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                        message.success("Product removed from import list");
                      },
                    });
                  }}
                />
              </Space>
            }
          >
            <CreateProduct
              initialData={productData}
              isBulkMode={true}
              bulkIndex={index}
              onUpdate={(updatedData) => {
                setProcessedProducts((prev) => {
                  const newList = [...prev];
                  newList[index] = { ...newList[index], ...updatedData };
                  return newList;
                });
              }}
            />
          </Card>
        ))}
      </div>

      {processedProducts.length === 0 && (
        <div style={{ textAlign: "center", padding: 50, color: "#999" }}>
          <Empty description="No products to import" />
        </div>
      )}

      <Space style={{ marginTop: 32, width: "100%", justifyContent: "center" }}>
        <Button
          type="primary"
          size="large"
          disabled={processedProducts.length === 0}
          onClick={() => message.info("Bulk save coming soon!")}
        >
          Save All Products ({processedProducts.length})
        </Button>
        <Button onClick={() => setCurrentStep(1)}>← Back to Mapping</Button>
      </Space>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <h2>Bulk Import Products</h2>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="Upload File" />
          <Step title="Map Columns" />
          <Step title="Review & Save" />
        </Steps>

        {currentStep === 0 && (
          <Card>
            <Upload
              accept=".csv,.xlsx,.xls"
              beforeUpload={handleUpload}
              fileList={file ? [file] : []}
              onRemove={() => {
                setFile(null);
                setRawData([]);
                setHeaders([]);
                setCurrentStep(0);
              }}
            >
              <Button icon={<UploadOutlined />} size="large">
                Click to Upload CSV or Excel
              </Button>
            </Upload>
            <div style={{ marginTop: 16, color: "#666" }}>
              <FileExcelOutlined /> Supports CSV and Excel (.xlsx, .xls)
            </div>
          </Card>
        )}

        {currentStep === 1 && renderMappingStep()}
        {currentStep === 2 &&
          (loading ? (
            <div style={{ textAlign: "center", padding: 50 }}>
              <Spin size="large" />
            </div>
          ) : (
            renderPreviewStep()
          ))}
      </div>
    </div>
  );
};

export default BulkProductImport;
