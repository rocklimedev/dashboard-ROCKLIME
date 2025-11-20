import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useBatchCreateProductsMutation,
} from "../../api/productApi";
import { GiFeatherWound } from "react-icons/gi";
import { FiImage, FiPlusCircle, FiLifeBuoy } from "react-icons/fi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetProfileQuery } from "../../api/userApi";
import { toast } from "sonner";
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
  Segmented,
  Table,
  Typography,
} from "antd";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const { Panel } = Collapse; // This is correct
const CreateProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);

  // MODE: single | batch
  const [mode, setMode] = useState(isEditMode ? "single" : "single");

  // ─────────────── SINGLE MODE STATE ───────────────
  const [form] = Form.useForm();
  const [newImages, setNewImages] = useState([]); // { file, preview }
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [metaData, setMetaData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // ─────────────── BATCH MODE STATE ───────────────
  const [batchData, setBatchData] = useState({
    categoryId: "",
    brandId: "",
    vendorId: "",
    brand_parentcategoriesId: "",
    products: Array.from({ length: 25 }, () => ({
      name: "",
      product_code: "",
      quantity: "",
      price: "",
      description: "",
    })),
  });

  // ─────────────── QUERIES ───────────────
  const { data: existingProduct, isLoading: isFetching } =
    useGetProductByIdQuery(productId, {
      skip: !isEditMode,
    });

  const { data: catData = { categories: [] }, isLoading: catLoading } =
    useGetAllCategoriesQuery();
  const { data: brands = [], isLoading: brandLoading } = useGetAllBrandsQuery();
  const { data: vendors = [], isLoading: vendorLoading } = useGetVendorsQuery();
  const { data: parentCats = [], isLoading: parentCatLoading } =
    useGetBrandParentCategoriesQuery();
  const { data: productMetas = [], isLoading: metaLoading } =
    useGetAllProductMetaQuery();
  const { data: user } = useGetProfileQuery();

  const categories = Array.isArray(catData.categories)
    ? catData.categories
    : [];
  const brandList = Array.isArray(brands) ? brands : [];
  const vendorList = Array.isArray(vendors) ? vendors : [];
  const parentCatList = Array.isArray(parentCats) ? parentCats : [];
  const metaList = Array.isArray(productMetas) ? productMetas : [];

  // ─────────────── MUTATIONS ───────────────
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [batchCreate, { isLoading: batchCreating }] =
    useBatchCreateProductsMutation();

  // ─────────────── SINGLE MODE: Load existing product ───────────────
  useEffect(() => {
    if (!isEditMode || !existingProduct) return;

    form.setFieldsValue({
      name: existingProduct.name || "",
      product_code: existingProduct.product_code || "",
      quantity: existingProduct.quantity || "",
      alert_quantity: existingProduct.alert_quantity || "",
      tax: existingProduct.tax || "",
      description: existingProduct.description || "",
      isFeatured: existingProduct.isFeatured ? "true" : "false",
      categoryId: existingProduct.categoryId || "",
      brandId: existingProduct.brandId || "",
      vendorId: existingProduct.vendorId || "",
      brand_parentcategoriesId: existingProduct.brand_parentcategoriesId || "",
    });

    // Images
    let imgs = [];
    try {
      imgs =
        typeof existingProduct.images === "string"
          ? JSON.parse(existingProduct.images)
          : existingProduct.images || [];
    } catch {}
    setExistingImages(Array.isArray(imgs) ? imgs : []);

    // Meta
    let metaObj = {};
    try {
      metaObj =
        typeof existingProduct.meta === "string"
          ? JSON.parse(existingProduct.meta)
          : existingProduct.meta || {};
    } catch {}
    setMetaData(metaObj || {});
  }, [existingProduct, form, isEditMode]);

  // ─────────────── IMAGE DROPZONE (Single Mode) ───────────────
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (existingImages.length + newImages.length + acceptedFiles.length > 5) {
        toast.warning("Maximum 5 images allowed");
        return;
      }
      const mapped = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setNewImages((prev) => [...prev, ...mapped]);
    },
    [existingImages.length, newImages.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxSize: 5 * 1024 * 1024,
    onDrop,
  });

  // ─────────────── IMAGE HANDLERS ───────────────
  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((i) => i !== url));
    setImagesToDelete((prev) => [...prev, url]);
  };

  const removeNewImage = (preview) => {
    setNewImages((prev) => {
      const filtered = prev.filter((i) => i.preview !== preview);
      prev
        .filter((i) => i.preview === preview)
        .forEach((i) => URL.revokeObjectURL(i.preview));
      return filtered;
    });
  };

  // ─────────────── SINGLE MODE SUBMIT ───────────────
  const handleSingleSubmit = async (values) => {
    const formData = new FormData();

    // Required
    formData.append("name", values.name.trim());
    formData.append("product_code", values.product_code.trim());
    formData.append("quantity", Number(values.quantity) || 0);
    formData.append("isFeatured", values.isFeatured === "true");

    // Optional
    if (values.description) formData.append("description", values.description);
    if (values.tax) formData.append("tax", Number(values.tax));
    if (values.alert_quantity)
      formData.append("alert_quantity", Number(values.alert_quantity));
    if (values.categoryId) formData.append("categoryId", values.categoryId);
    if (values.brandId) formData.append("brandId", values.brandId);
    if (values.vendorId) formData.append("vendorId", values.vendorId);
    if (values.brand_parentcategoriesId)
      formData.append(
        "brand_parentcategoriesId",
        values.brand_parentcategoriesId
      );
    if (Object.keys(metaData).length)
      formData.append("meta", JSON.stringify(metaData));

    newImages.forEach((img) => formData.append("images", img.file));
    if (isEditMode && imagesToDelete.length)
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));

    try {
      if (isEditMode) {
        await updateProduct({ productId, formData }).unwrap();
        toast.success("Product updated");
      } else {
        await createProduct(formData).unwrap();
        toast.success("Product created");
        form.resetFields();
        setNewImages([]);
        setMetaData({});
      }
      navigate("/category-selector");
    } catch (err) {
      toast.error(err.data?.message || "Failed to save product");
    }
  };
  // ─────────────── IMAGE & META HANDLERS (YOU WERE MISSING THESE) ───────────────
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleDeleteImage = (imageUrl) => {
    removeExistingImage(imageUrl);
  };

  const handleDeleteNewImage = (preview) => {
    removeNewImage(preview);
  };

  const handleMetaChange = (metaId, value) => {
    setMetaData((prev) => ({
      ...prev,
      [metaId]: value,
    }));
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };
  // ─────────────── BATCH MODE HANDLERS ───────────────
  const updateBatchRow = (index, field, value) => {
    setBatchData((prev) => {
      const products = [...prev.products];
      products[index] = { ...products[index], [field]: value };
      return { ...prev, products };
    });
  };

  const handleBatchSubmit = async () => {
    if (!batchData.categoryId || !batchData.brandId) {
      toast.error("Category and Brand are required");
      return;
    }

    const validRows = batchData.products
      .map((p, i) => ({ ...p, row: i + 1 }))
      .filter((p) => p.name?.trim() && p.product_code?.trim());

    if (validRows.length === 0) {
      toast.warning("Add at least one product with Name + Code");
      return;
    }

    try {
      await batchCreate({
        categoryId: batchData.categoryId,
        brandId: batchData.brandId,
        vendorId: batchData.vendorId || null,
        brand_parentcategoriesId: batchData.brand_parentcategoriesId || null,
        products: validRows.map((p) => ({
          name: p.name.trim(),
          product_code: p.product_code.trim(),
          quantity: parseInt(p.quantity) || 0,
          price: parseFloat(p.price) || 0,
          description: p.description?.trim() || null,
        })),
      }).unwrap();

      toast.success(`${validRows.length} products created successfully!`);
      navigate("/category-selector");
    } catch (err) {
      toast.error(err.data?.message || "Batch create failed");
    }
  };

  const batchColumns = [
    { title: "#", width: 50, render: (_, __, i) => i + 1 },
    {
      title: "Name",
      render: (_, __, i) => (
        <Input
          value={batchData.products[i]?.name || ""}
          onChange={(e) => updateBatchRow(i, "name", e.target.value)}
          placeholder="iPhone 15 Pro Max"
        />
      ),
    },
    {
      title: "Product Code",
      render: (_, __, i) => (
        <Input
          value={batchData.products[i]?.product_code || ""}
          onChange={(e) => updateBatchRow(i, "product_code", e.target.value)}
          placeholder="IPH15PM-001"
        />
      ),
    },
    {
      title: "Qty",
      width: 100,
      render: (_, __, i) => (
        <Input
          type="number"
          value={batchData.products[i]?.quantity || ""}
          onChange={(e) => updateBatchRow(i, "quantity", e.target.value)}
        />
      ),
    },
    {
      title: "Price",
      width: 120,
      render: (_, __, i) => (
        <Input
          type="number"
          value={batchData.products[i]?.price || ""}
          onChange={(e) => updateBatchRow(i, "price", e.target.value)}
        />
      ),
    },
    {
      title: "Description",
      render: (_, __, i) => (
        <Input.TextArea
          rows={1}
          value={batchData.products[i]?.description || ""}
          onChange={(e) => updateBatchRow(i, "description", e.target.value)}
        />
      ),
    },
  ];

  // ─────────────── LOADING STATE ───────────────
  if (
    isFetching ||
    catLoading ||
    brandLoading ||
    vendorLoading ||
    parentCatLoading ||
    metaLoading
  ) {
    return (
      <div className="page-wrapper">
        <div
          className="content"
          style={{ padding: "100px", textAlign: "center" }}
        >
          <Spin size="large" tip="Loading..." />
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
  // ─────────────── RENDER ───────────────
  return (
    <div className="page-wrapper">
      <div className="content">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header + Mode Switch */}
          <Row justify="space-between" align="middle">
            <Col>
              <h3 style={{ margin: 0, fontWeight: "bold" }}>
                {isEditMode ? "Edit Product" : "Add Products"}
              </h3>
            </Col>
            <Col>
              <Space>
                <Button icon={<FaArrowLeft />} onClick={() => navigate(-1)}>
                  Back
                </Button>

                {!isEditMode && (
                  <Segmented
                    options={[
                      { label: "Single Product", value: "single" },
                      { label: "Batch (25)", value: "batch" },
                    ]}
                    value={mode}
                    onChange={setMode}
                    size="large"
                  />
                )}
              </Space>
            </Col>
          </Row>

          {/* SINGLE MODE */}
          {mode === "single" && (
            <Card>
              <Form form={form} onFinish={handleSingleSubmit} layout="vertical">
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
                            {brandList.map((b) => (
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
                            {vendorList.map((v) => (
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
                            {parentCatList.map((b) => (
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
                        <FiLifeBuoy
                          style={{ marginRight: 8, color: "#1890ff" }}
                        />
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
                        <FiLifeBuoy
                          style={{ marginRight: 8, color: "#1890ff" }}
                        />
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
                      const meta = metaList.find((m) => m.id === id);
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
                            type={
                              meta.fieldType === "number" ? "number" : "text"
                            }
                            value={val}
                            onChange={(e) =>
                              handleMetaChange(id, e.target.value)
                            }
                            style={{ flex: 1 }}
                            placeholder={
                              meta.unit ? `e.g. 500 ${meta.unit}` : ""
                            }
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

                    {metaList.filter((m) => !metaData[m.id]).length > 0 && (
                      <Select
                        showSearch
                        placeholder="Add meta field..."
                        style={{ width: "100%", marginTop: 8 }}
                        onChange={(id) =>
                          setMetaData((prev) => ({ ...prev, [id]: "" }))
                        }
                        optionFilterProp="children"
                      >
                        {metaList
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

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={creating || updating}
                  style={{ marginTop: 24 }}
                >
                  {isEditMode ? "Update Product" : "Create Product"}
                </Button>
              </Form>
            </Card>
          )}

          {/* BATCH MODE */}
          {mode === "batch" && (
            <Card
              title="Rapid Batch Create — Same Category & Brand"
              bordered={false}
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Row gutter={16}>
                  <Col span={6}>
                    <Select
                      showSearch
                      placeholder="Category *"
                      value={batchData.categoryId}
                      onChange={(v) =>
                        setBatchData((p) => ({ ...p, categoryId: v }))
                      }
                    >
                      {categories.map((c) => (
                        <Option key={c.categoryId} value={c.categoryId}>
                          {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Select
                      showSearch
                      placeholder="Brand *"
                      value={batchData.brandId}
                      onChange={(v) =>
                        setBatchData((p) => ({ ...p, brandId: v }))
                      }
                    >
                      {brandList.map((b) => (
                        <Option key={b.id} value={b.id}>
                          {b.brandName}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Select
                      allowClear
                      placeholder="Vendor"
                      value={batchData.vendorId}
                      onChange={(v) =>
                        setBatchData((p) => ({ ...p, vendorId: v }))
                      }
                    >
                      {vendorList.map((v) => (
                        <Option key={v.id} value={v.id}>
                          {v.vendorName}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Select
                      allowClear
                      placeholder="Parent Category"
                      value={batchData.brand_parentcategoriesId}
                      onChange={(v) =>
                        setBatchData((p) => ({
                          ...p,
                          brand_parentcategoriesId: v,
                        }))
                      }
                    >
                      {parentCatList.map((c) => (
                        <Option key={c.id} value={c.id}>
                          {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                <Table
                  columns={batchColumns}
                  dataSource={batchData.products}
                  pagination={false}
                  scroll={{ y: 600 }}
                  bordered
                  size="small"
                />

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={batchCreating}
                  onClick={handleBatchSubmit}
                >
                  Create All Filled Rows (
                  {
                    batchData.products.filter((p) => p.name && p.product_code)
                      .length
                  }
                  )
                </Button>

                <Text type="secondary">
                  Only rows with <strong>Name</strong> + <strong>Code</strong>{" "}
                  will be created.
                </Text>
              </Space>
            </Card>
          )}
        </Space>

        {/* Image Zoom Modal */}
        <Modal
          open={!!selectedImage}
          footer={null}
          onCancel={() => setSelectedImage(null)}
          width={900}
        >
          <img
            src={selectedImage}
            alt="Full"
            style={{ width: "100%", marginTop: 16 }}
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
