import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useLazyCheckProductCodeQuery,
} from "../../api/productApi";
import { GiFeatherWound } from "react-icons/gi";
import { FiImage, FiPlusCircle, FiLifeBuoy } from "react-icons/fi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetProfileQuery } from "../../api/userApi";
import { message } from "antd";
import { useDropzone } from "react-dropzone";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useGetAllProductMetaQuery } from "../../api/productMetaApi";
import { useGetBrandParentCategoriesQuery } from "../../api/brandParentCategoryApi";
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Spin,
  Modal,
  Space,
  Accordion,
  Card,
  Collapse,
} from "antd";

const { Option } = Select;
const { TextArea } = Input;
const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a"; // Company Code UUID
const { Panel } = Collapse; // This is correct
const CreateProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);
  const [newImages, setNewImages] = useState([]); // { file, preview }
  const [existingImages, setExistingImages] = useState([]); // Image URLs
  const [imagesToDelete, setImagesToDelete] = useState([]); // Images to delete
  const [metaData, setMetaData] = useState({}); // Meta key-value pairs
  const [selectedImage, setSelectedImage] = useState(null); // For modal
  const [form] = Form.useForm();
  const [autoCode, setAutoCode] = useState("");
  const [isCodeDirty, setIsCodeDirty] = useState(false);
  const [codeStatus, setCodeStatus] = useState(""); // "checking" | "unique" | "duplicate"
  // Fetch data
  const { data: existingProduct, isLoading: isFetching } =
    useGetProductByIdQuery(productId, { skip: !isEditMode });
  const {
    data: categoryData = { categories: [] },
    isLoading: isCategoryLoading,
  } = useGetAllCategoriesQuery();
  const { data: brands, isLoading: isBrandLoading } = useGetAllBrandsQuery();
  const { data: vendors, isLoading: isVendorLoading } = useGetVendorsQuery();
  const {
    data: brandParentCategories,
    isLoading: isBrandParentCategoryLoading,
  } = useGetBrandParentCategoriesQuery();
  const { data: productMetas, isLoading: isProductMetaLoading } =
    useGetAllProductMetaQuery();
  const { data: user, isLoading: isUserLoading } = useGetProfileQuery();
  const [triggerCheckCode, { isFetching: isCheckingCode }] =
    useLazyCheckProductCodeQuery();
  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];
  const brandData = Array.isArray(brands) ? brands : [];
  const vendorData = Array.isArray(vendors) ? vendors : [];
  const brandParentCategoryData = Array.isArray(brandParentCategories)
    ? brandParentCategories
    : [];
  const productMetaData = Array.isArray(productMetas) ? productMetas : [];

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating, error }] =
    useUpdateProductMutation();
  // Generate Unique Product Code
  const generateUniqueCode = useCallback(
    async (brandId, companyCodeValue, attempt = 0) => {
      if (attempt > 15) {
        message.error("Couldn't generate unique code. Please enter manually.");
        setCodeStatus("error");
        return;
      }

      const brand = brands.find((b) => b.id === brandId);
      if (!brand) return;

      const brandPrefix = (brand.brandName || "XX").slice(0, 2).toUpperCase();

      // Extract last 4 digits from company code
      const cleanCode = (companyCodeValue || "").toString().trim();
      const digitsOnly = cleanCode.replace(/\D/g, ""); // remove non-digits
      const last4 = digitsOnly ? digitsOnly.slice(-4).padEnd(4, "0") : "0000";

      const random3 = String(Math.floor(Math.random() * 900) + 100); // 100–999

      const candidate = `E${brandPrefix}${brandPrefix}${last4}${random3}`;

      setAutoCode(candidate);
      form.setFieldsValue({ product_code: candidate });
      setCodeStatus("checking");

      try {
        const exists = await triggerCheckCode(candidate).unwrap();
        if (exists) {
          setCodeStatus("duplicate");
          generateUniqueCode(brandId, companyCodeValue, attempt + 1);
        } else {
          setCodeStatus("unique");
        }
      } catch (err) {
        setCodeStatus("error");
      }
    },
    [brands, form, triggerCheckCode]
  );
  // Auto Generate on Brand + Size Change
  useEffect(() => {
    if (isEditMode || isCodeDirty) return;

    const values = form.getFieldsValue();
    const brandId = values.brandId;
    const companyCode = metaData[COMPANY_CODE_META_ID];

    if (brandId && companyCode) {
      generateUniqueCode(brandId, companyCode);
    }
  }, [
    form.getFieldValue("brandId"),
    metaData[COMPANY_CODE_META_ID],
    isEditMode,
    isCodeDirty,
    generateUniqueCode,
  ]);
  useEffect(() => {
    if (existingProduct) {
      const formValues = {
        name: existingProduct.name || "",
        product_code: existingProduct.product_code || "",
        quantity: existingProduct.quantity || "",
        isFeatured: existingProduct.isFeatured?.toString() || "false",
        description: existingProduct.description || "",
        tax: existingProduct.tax || "",
        alert_quantity: existingProduct.alert_quantity || "",
        categoryId: existingProduct.categoryId || "",
        brandId: existingProduct.brandId || "",
        vendorId: existingProduct.vendorId || "",
        brand_parentcategoriesId:
          existingProduct.brand_parentcategoriesId || "",
      };
      form.setFieldsValue(formValues);

      // --- IMAGES ---
      let imagesArray = [];
      if (existingProduct.images) {
        try {
          imagesArray =
            typeof existingProduct.images === "string"
              ? JSON.parse(existingProduct.images)
              : Array.isArray(existingProduct.images)
              ? existingProduct.images
              : [];
        } catch (e) {
          imagesArray = [];
        }
      }
      setExistingImages(Array.isArray(imagesArray) ? imagesArray : []);

      // --- META DATA: ROBUST PARSING ---
      let metaObject = {};

      if (existingProduct.meta) {
        try {
          // Case 1: String (from formData)
          if (typeof existingProduct.meta === "string") {
            metaObject = JSON.parse(existingProduct.meta);
          }
          // Case 2: Already an object (Sequelize auto-parsed)
          else if (
            typeof existingProduct.meta === "object" &&
            existingProduct.meta !== null
          ) {
            metaObject = existingProduct.meta;
          }

          // Validate: must be object with string keys
          if (
            typeof metaObject !== "object" ||
            metaObject === null ||
            Array.isArray(metaObject)
          ) {
            metaObject = {};
          }

          // Optional: Validate keys exist in productMetas
          const validMeta = {};
          Object.entries(metaObject).forEach(([key, value]) => {
            const metaExists = productMetaData.some((m) => m.id === key);
            if (metaExists) {
              validMeta[key] = value;
            }
          });
          metaObject = validMeta;
        } catch (error) {
          message.error("Failed to load product specifications.");
          metaObject = {};
        }
      }

      setMetaData(metaObject);
    }
  }, [existingProduct, form, productMetaData]);
  // Clean up preview URLs
  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [newImages]);

  // Handle meta data changes
  const handleMetaChange = (metaId, value) => {
    setMetaData((prev) => ({
      ...prev,
      [metaId]: value,
    }));
  };

  // Handle image drop
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((file) => {
          if (file.errors.some((e) => e.code === "file-too-large")) {
            message.warning(`File "${file.file.name}" exceeds 5MB limit.`);
          } else if (file.errors.some((e) => e.code === "file-invalid-type")) {
            message.warning(`File "${file.file.name}" is not an image.`);
          }
        });
        return;
      }

      if (existingImages.length + newImages.length + acceptedFiles.length > 5) {
        message.warning("You can upload a maximum of 5 images.");
        return;
      }

      const newFiles = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setNewImages((prev) => [...prev, ...newFiles]);
    },
    [existingImages, newImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif"] },
    maxFiles: 5 - (existingImages.length + newImages.length),
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop,
  });

  // Handle image deletion
  const handleDeleteImage = (imageUrl) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
    setImagesToDelete((prev) => [...prev, imageUrl]);
  };

  const handleDeleteNewImage = (preview) => {
    setNewImages((prev) => {
      const updated = prev.filter((img) => img.preview !== preview);
      prev
        .filter((img) => img.preview === preview)
        .forEach((img) => URL.revokeObjectURL(img.preview));
      return updated;
    });
  };

  // Handle image click to open modal
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Close modal
  const closeModal = () => {
    setSelectedImage(null);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    const requiredFields = {
      name: values.name,
      product_code: values.product_code,
      quantity: values.quantity,
    };

    const emptyFields = Object.entries(requiredFields).filter(
      ([key, value]) => value === "" || value === null || value === undefined
    );

    if (emptyFields.length > 0) {
      message.warning(
        `Please fill all required fields: ${emptyFields
          .map(([key]) => key)
          .join(", ")}.`
      );
      return;
    }

    for (const metaId of Object.keys(metaData)) {
      const metaField = productMetaData.find((meta) => meta.id === metaId);
      if (!metaField) {
        message.error(`Invalid ProductMeta ID: ${metaId}`);
        return;
      }
      if (
        metaField.fieldType === "number" &&
        metaData[metaId] !== "" &&
        isNaN(metaData[metaId])
      ) {
        message.error(`Value for ${metaField.title} must be a number`);
        return;
      }
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", values.name);
    formDataToSend.append("product_code", values.product_code);
    formDataToSend.append("quantity", Number(values.quantity) || 0);
    formDataToSend.append("isFeatured", values.isFeatured === "true");
    formDataToSend.append("description", values.description);
    formDataToSend.append("tax", values.tax ? Number(values.tax) : "");
    formDataToSend.append("alert_quantity", Number(values.alert_quantity) || 0);

    if (values.categoryId)
      formDataToSend.append("categoryId", values.categoryId);
    if (values.brandId) formDataToSend.append("brandId", values.brandId);
    if (values.vendorId) formDataToSend.append("vendorId", values.vendorId);
    if (values.brand_parentcategoriesId)
      formDataToSend.append(
        "brand_parentcategoriesId",
        values.brand_parentcategoriesId
      );
    if (Object.keys(metaData).length > 0)
      formDataToSend.append("meta", JSON.stringify(metaData));

    newImages.forEach((image) => {
      formDataToSend.append("images", image.file);
    });

    if (isEditMode && imagesToDelete.length > 0) {
      formDataToSend.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    try {
      if (isEditMode) {
        await updateProduct({ productId, formData: formDataToSend }).unwrap();
        navigate("/category-selector");
      } else {
        await createProduct(formDataToSend).unwrap();
        form.resetFields();
        setNewImages([]);
        setMetaData({});
        navigate("/category-selector");
      }
    } catch (error) {
      const message =
        error.data?.message || "Something went wrong while saving the product.";
      message.error(`Error: ${message}`);
    }
  };

  if (
    isFetching ||
    isCategoryLoading ||
    isBrandLoading ||
    isVendorLoading ||
    isBrandParentCategoryLoading ||
    isProductMetaLoading ||
    isUserLoading
  ) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Spin tip="Loading product details..." />
        </div>
      </div>
    );
  }

  // Styles
  const dropzoneStyle = {
    border: "2px dashed #d9d9d9",
    borderRadius: 8,
    padding: 16,
    textAlign: "center",
    cursor: "pointer",
    transition: "0.2s",
    backgroundColor: isDragActive ? "#f5faff" : "transparent",
  };

  const thumbStyle = {
    width: 80,
    height: 80,
    objectFit: "cover",
    borderRadius: 6,
    cursor: "zoom-in",
    border: "1px solid #eee",
  };

  const deleteBtn = {
    position: "absolute",
    top: 4,
    right: 4,
    background: "rgba(0,0,0,0.6)",
    border: "none",
    color: "white",
    padding: 0,
    width: 20,
    height: 20,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Header */}
          <Row justify="space-between" align="middle">
            <Col>
              <h4 style={{ fontWeight: "bold", margin: 0 }}>
                {isEditMode ? "Edit Product" : "Create Product"}
              </h4>
            </Col>
            <Col>
              <Button
                icon={<FaArrowLeft style={{ marginRight: 8 }} />}
                onClick={() => navigate("/category-selector")}
              >
                Back
              </Button>
            </Col>
          </Row>

          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Collapse
              defaultActiveKey={["1", "2", "3", "4", "5"]}
              className="compact-accordion"
            >
              {/* 1. BASIC INFO */}
              <Panel
                header={
                  <span>
                    <GiFeatherWound
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    <strong>Basic Information</strong>
                  </span>
                }
                key="1"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="name"
                      label="Product Name"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Enter product name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="product_code"
                      label="Product Code"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="e.g. SKU123" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="categoryId" label="Category">
                      <Select placeholder="Select" allowClear>
                        {categories.map((c) => (
                          <Option key={c.categoryId} value={c.categoryId}>
                            {c.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="brandId" label="Brand">
                      <Select placeholder="Select" allowClear>
                        {brandData.map((b) => (
                          <Option key={b.id} value={b.id}>
                            {b.brandName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="vendorId" label="Vendor">
                      <Select placeholder="Select" allowClear>
                        {vendorData.map((v) => (
                          <Option key={v.id} value={v.id}>
                            {v.vendorName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="brand_parentcategoriesId"
                      label="Parent Category"
                    >
                      <Select placeholder="Optional" allowClear>
                        {brandParentCategoryData.map((b) => (
                          <Option key={b.id} value={b.id}>
                            {b.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="isFeatured"
                      label="Featured?"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Select>
                        <Option value="false">No</Option>
                        <Option value="true">Yes</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              {/* 2. STOCK & PRICING */}
              <Panel
                header={
                  <span>
                    <FiLifeBuoy style={{ marginRight: 8, color: "#1890ff" }} />
                    <strong>Stock & Tax</strong>
                  </span>
                }
                key="2"
              >
                <Row gutter={16}>
                  <Col xs={8}>
                    <Form.Item
                      name="quantity"
                      label="Quantity"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input type="number" min={0} />
                    </Form.Item>
                  </Col>
                  <Col xs={8}>
                    <Form.Item name="alert_quantity" label="Alert Qty">
                      <Input type="number" min={0} />
                    </Form.Item>
                  </Col>
                  <Col xs={8}>
                    <Form.Item name="tax" label="Tax (%)">
                      <Input type="number" step="0.01" min={0} max={100} />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              {/* 3. DESCRIPTION */}
              <Panel header={<strong>Description</strong>} key="3">
                <Form.Item name="description">
                  <TextArea
                    rows={2}
                    placeholder="Max 60 words..."
                    maxLength={300}
                    showCount
                  />
                </Form.Item>
              </Panel>

              {/* 4. IMAGES */}
              <Panel
                header={
                  <span>
                    <FiImage style={{ marginRight: 8, color: "#1890ff" }} />
                    <strong>
                      Images ({existingImages.length + newImages.length}/5)
                    </strong>
                  </span>
                }
                key="4"
              >
                <div {...getRootProps()} style={dropzoneStyle}>
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Drop images here...</p>
                  ) : (
                    <p>
                      <FiPlusCircle size={20} style={{ marginBottom: 8 }} />
                      <br />
                      Click or drag images
                    </p>
                  )}
                </div>
                <small
                  style={{ color: "#888", display: "block", marginTop: 8 }}
                >
                  Max 5 images, 5MB each (JPEG/PNG/GIF)
                </small>

                <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                  {existingImages.map((img, i) => (
                    <Col key={`e-${i}`}>
                      <div style={{ position: "relative" }}>
                        <img
                          src={img}
                          alt=""
                          style={thumbStyle}
                          onClick={() => handleImageClick(img)}
                        />
                        <Button
                          danger
                          size="small"
                          style={deleteBtn}
                          onClick={() => handleDeleteImage(img)}
                        >
                          ×
                        </Button>
                      </div>
                    </Col>
                  ))}
                  {newImages.map((img, i) => (
                    <Col key={`n-${i}`}>
                      <div style={{ position: "relative" }}>
                        <img
                          src={img.preview}
                          alt=""
                          style={thumbStyle}
                          onClick={() => handleImageClick(img.preview)}
                        />
                        <Button
                          danger
                          size="small"
                          style={deleteBtn}
                          onClick={() => handleDeleteNewImage(img.preview)}
                        >
                          ×
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Panel>

              {/* 5. META DATA */}
              <Panel
                header={
                  <span>
                    <FiLifeBuoy style={{ marginRight: 8, color: "#1890ff" }} />
                    <strong>
                      Meta Data{" "}
                      {Object.keys(metaData).length > 0 &&
                        `(${Object.keys(metaData).length})`}
                    </strong>
                  </span>
                }
                key="5"
              >
                {Object.entries(metaData).map(([id, val]) => {
                  const meta = productMetaData.find((m) => m.id === id);
                  if (!meta) return null;
                  return (
                    <div
                      key={id}
                      style={{
                        marginBottom: 8,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ width: 120, fontWeight: 500 }}>
                        {meta.title}:
                      </span>
                      <Input
                        type={meta.fieldType === "number" ? "number" : "text"}
                        value={val}
                        onChange={(e) => handleMetaChange(id, e.target.value)}
                        style={{ flex: 1 }}
                        placeholder={meta.unit ? `e.g. 500 ${meta.unit}` : ""}
                      />
                      <Button
                        danger
                        size="small"
                        onClick={() =>
                          setMetaData((prev) => {
                            const p = { ...prev };
                            delete p[id];
                            return p;
                          })
                        }
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}

                {productMetaData.filter((m) => !metaData[m.id]).length > 0 && (
                  <Select
                    showSearch
                    placeholder="Add meta field..."
                    style={{ width: "100%", marginTop: 8 }}
                    onChange={(id) =>
                      setMetaData((prev) => ({ ...prev, [id]: "" }))
                    }
                    optionFilterProp="children"
                  >
                    {productMetaData
                      .filter((m) => !metaData[m.id])
                      .map((m) => (
                        <Option key={m.id} value={m.id}>
                          {m.title} {m.unit && `(${m.unit})`}
                        </Option>
                      ))}
                  </Select>
                )}
              </Panel>
            </Collapse>

            {/* Submit */}
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isCreating || isUpdating}
              style={{ marginTop: 16 }}
            >
              {isEditMode ? "Update Product" : "Create Product"}
            </Button>
          </Form>
        </Space>

        {/* Image Modal */}
        <Modal
          open={!!selectedImage}
          footer={null}
          onCancel={closeModal}
          width="90%"
          centered
        >
          <img
            src={selectedImage}
            alt="Preview"
            style={{ width: "100%", borderRadius: 8, marginTop: 16 }}
          />
        </Modal>
      </div>

      <style jsx>{`
        .compact-accordion .ant-collapse-header {
          padding: 8px 16px !important;
          font-size: 14px;
        }
        .compact-accordion .ant-collapse-content-box {
          padding: 16px !important;
        }
        .dropzoneStyle:hover,
        .dropzoneStyle:focus {
          border-color: #1890ff;
          background: #f5faff;
        }
      `}</style>
    </div>
  );
};

export default CreateProduct;
