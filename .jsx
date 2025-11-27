import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useLazyCheckProductCodeQuery,
} from "../../api/productApi";
import { FiImage, FiPlusCircle, FiLifeBuoy, FiPackage } from "react-icons/fi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useGetAllProductMetaQuery } from "../../api/productMetaApi";
import { useGetBrandParentCategoriesQuery } from "../../api/brandParentCategoryApi";
import { message } from "antd";
import { useDropzone } from "react-dropzone";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Modal,
  Collapse,
  Tag,
  Spin,
  Space,
  Typography,
} from "antd";
import { useGetAllProductsQuery } from "../../api/productApi";
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Text } = Typography;

const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a";

const CreateProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);

  const [form] = Form.useForm();
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [metaData, setMetaData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [autoCode, setAutoCode] = useState("");
  const [isCodeDirty, setIsCodeDirty] = useState(false);
  const [codeStatus, setCodeStatus] = useState(""); // "checking", "unique", "duplicate"

  // RTK Queries
  const { data: existingProduct, isLoading: loadingProduct } =
    useGetProductByIdQuery(productId, {
      skip: !isEditMode,
    });

  const { data: categoryData = { categories: [] } } =
    useGetAllCategoriesQuery();
  const { data: brands = [] } = useGetAllBrandsQuery();
  const { data: vendors = [] } = useGetVendorsQuery();
  const { data: brandParentCategories = [] } =
    useGetBrandParentCategoriesQuery();
  const { data: productMetas = [] } = useGetAllProductMetaQuery();
  const { data: allProducts = [] } = useGetAllProductsQuery(undefined, {
    skip: !isEditMode,
  }); // for master product dropdown

  const [triggerCheckCode] = useLazyCheckProductCodeQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];
  const brandData = Array.isArray(brands) ? brands : [];
  const vendorData = Array.isArray(vendors) ? vendors : [];
  const brandParentCategoryData = Array.isArray(brandParentCategories)
    ? brandParentCategories
    : [];
  const productMetaData = Array.isArray(productMetas) ? productMetas : [];

  // Generate Unique Product Code
  const generateUniqueCode = useCallback(
    async (brandId, companyCodeValue, attempt = 0) => {
      if (attempt > 15) {
        message.error("Couldn't generate unique code. Please enter manually.");
        setCodeStatus("error");
        return;
      }

      const brand = brandData.find((b) => b.id === brandId);
      if (!brand) return;

      const brandPrefix = (brand.brandName || "XX").slice(0, 2).toUpperCase();
      const cleanCode = (companyCodeValue || "").toString().trim();
      const digitsOnly = cleanCode.replace(/\D/g, "");
      const last4 = digitsOnly ? digitsOnly.slice(-4).padEnd(4, "0") : "0000";
      const random3 = String(Math.floor(Math.random() * 900) + 100);

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
      } catch {
        setCodeStatus("error");
      }
    },
    [brandData, form, triggerCheckCode]
  );

  // Auto generate code when brand or company code changes
  useEffect(() => {
    if (isEditMode || isCodeDirty) return;

    const values = form.getFieldsValue();
    const brandId = values.brandId;
    const companyCode = metaData[COMPANY_CODE_META_ID];

    if (brandId && companyCode) {
      generateUniqueCode(brandId, companyCode);
    }
  }, [
    metaData[COMPANY_CODE_META_ID],
    isEditMode,
    isCodeDirty,
    generateUniqueCode,
  ]);

  // Load existing product
  useEffect(() => {
    if (!existingProduct) return;

    const formValues = {
      name: existingProduct.name || "",
      product_code: existingProduct.product_code || "",
      quantity: existingProduct.quantity || 0,
      isFeatured: existingProduct.isFeatured ? "true" : "false",
      description: existingProduct.description || "",
      tax: existingProduct.tax || null,
      alert_quantity: existingProduct.alert_quantity || null,
      status: existingProduct.status || "active",
      discountType: existingProduct.discountType || undefined,

      // Variant fields
      isMaster: existingProduct.isMaster ? "true" : "false",
      masterProductId: existingProduct.masterProductId || undefined,
      variantKey: existingProduct.variantKey || "",
      skuSuffix: existingProduct.skuSuffix || "",

      categoryId: existingProduct.categoryId || undefined,
      brandId: existingProduct.brandId || undefined,
      vendorId: existingProduct.vendorId || undefined,
      brand_parentcategoriesId:
        existingProduct.brand_parentcategoriesId || undefined,
    };

    form.setFieldsValue(formValues);

    // Images
    let imagesArray = [];
    try {
      imagesArray =
        typeof existingProduct.images === "string"
          ? JSON.parse(existingProduct.images)
          : Array.isArray(existingProduct.images)
          ? existingProduct.images
          : [];
    } catch (e) {
      console.error("Failed to parse images", e);
    }
    setExistingImages(Array.isArray(imagesArray) ? imagesArray : []);

    // Meta
    let metaObj = {};
    try {
      if (typeof existingProduct.meta === "string") {
        metaObj = JSON.parse(existingProduct.meta);
      } else if (
        existingProduct.meta &&
        typeof existingProduct.meta === "object"
      ) {
        metaObj = existingProduct.meta;
      }

      const valid = {};
      Object.entries(metaObj).forEach(([k, v]) => {
        if (productMetaData.some((m) => m.id === k)) valid[k] = v;
      });
      setMetaData(valid);
    } catch (e) {
      message.error("Failed to load specifications");
    }

    // Variant options (JSON)
    if (existingProduct.variantOptions) {
      try {
        const opts =
          typeof existingProduct.variantOptions === "string"
            ? JSON.parse(existingProduct.variantOptions)
            : existingProduct.variantOptions;
        form.setFieldsValue({ variantOptions: JSON.stringify(opts, null, 2) });
      } catch {}
    }
  }, [existingProduct, productMetaData, form]);

  // Cleanup previews
  useEffect(() => {
    return () => newImages.forEach((i) => URL.revokeObjectURL(i.preview));
  }, [newImages]);

  const handleMetaChange = (id, value) => {
    setMetaData((prev) => ({ ...prev, [id]: value }));
  };

  const onDrop = useCallback(
    (accepted, rejected) => {
      if (rejected.length > 0) {
        rejected.forEach(({ file, errors }) => {
          if (errors[0]?.code === "file-too-large")
            message.warning(`${file.name} > 5MB`);
          if (errors[0]?.code === "file-invalid-type")
            message.warning(`${file.name} not image`);
        });
        return;
      }

      if (existingImages.length + newImages.length + accepted.length > 5) {
        message.warning("Maximum 5 images allowed");
        return;
      }

      const mapped = accepted.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setNewImages((p) => [...p, ...mapped]);
    },
    [existingImages.length, newImages.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxSize: 5 * 1024 * 1024,
    onDrop,
  });

  const removeExistingImage = (url) => {
    setExistingImages((p) => p.filter((i) => i !== url));
    setImagesToDelete((p) => [...p, url]);
  };

  const removeNewImage = (preview) => {
    setNewImages((p) => {
      const filtered = p.filter((i) => i.preview !== preview);
      p.filter((i) => i.preview === preview).forEach((i) =>
        URL.revokeObjectURL(i.preview)
      );
      return filtered;
    });
  };

  const onFinish = async (values) => {
    const required = ["name", "product_code", "quantity"];
    if (required.some((f) => !values[f])) {
      message.warning("Please fill all required fields");
      return;
    }

    // Validate number metas
    for (const [id, val] of Object.entries(metaData)) {
      const m = productMetaData.find((x) => x.id === id);
      if (m?.fieldType === "number" && val !== "" && isNaN(val)) {
        message.error(`${m.title} must be a number`);
        return;
      }
    }

    const formData = new FormData();
    const fields = [
      "name",
      "product_code",
      "description",
      "status",
      "discountType",
      "isMaster",
      "masterProductId",
      "variantKey",
      "skuSuffix",
    ];
    fields.forEach((k) => {
      if (values[k] !== undefined && values[k] !== null) {
        formData.append(k, values[k]);
      }
    });

    formData.append("quantity", Number(values.quantity) || 0);
    formData.append("isFeatured", values.isFeatured === "true");
    if (values.tax !== undefined)
      formData.append("tax", Number(values.tax) || 0);
    if (values.alert_quantity !== undefined)
      formData.append("alert_quantity", Number(values.alert_quantity) || 0);

    ["categoryId", "brandId", "vendorId", "brand_parentcategoriesId"].forEach(
      (k) => {
        if (values[k]) formData.append(k, values[k]);
      }
    );

    if (values.variantOptions) {
      try {
        const json = JSON.parse(values.variantOptions);
        formData.append("variantOptions", JSON.stringify(json));
      } catch {
        message.error("Invalid JSON in Variant Options");
        return;
      }
    }

    if (Object.keys(metaData).length) {
      formData.append("meta", JSON.stringify(metaData));
    }

    newImages.forEach((i) => formData.append("images", i.file));
    if (isEditMode && imagesToDelete.length) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    try {
      if (isEditMode) {
        await updateProduct({ productId, formData }).unwrap();
        message.success("Product updated!");
      } else {
        await createProduct(formData).unwrap();
        message.success("Product created!");
        form.resetFields();
        setNewImages([]);
        setMetaData({});
      }
      navigate("/category-selector");
    } catch (err) {
      message.error(err.data?.message || "Save failed");
    }
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <h4 style={{ margin: 0, fontWeight: "bold" }}>
              {isEditMode ? "Edit Product" : "Create New Product"}
            </h4>
            <Button icon={<FaArrowLeft />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </Row>

          <Form form={form} onFinish={onFinish} layout="vertical">
            <Collapse
              defaultActiveKey={["1", "2", "3", "4", "5", "6", "7"]}
              className="compact-accordion"
            >
              {/* 1. Basic Info */}
              <Panel header={<strong>Basic Information</strong>} key="1">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="name"
                      label="Product Name"
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="product_code"
                      label="Product Code"
                      rules={[{ required: true }]}
                    >
                      <Input
                        addonAfter={
                          codeStatus === "checking" ? (
                            <Spin size="small" />
                          ) : codeStatus === "unique" ? (
                            <Tag color="green">Unique</Tag>
                          ) : codeStatus === "duplicate" ? (
                            <Tag color="red">Taken</Tag>
                          ) : null
                        }
                        onChange={() => {
                          setIsCodeDirty(true);
                          setCodeStatus("");
                        }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={8}>
                    <Form.Item name="categoryId" label="Category">
                      <Select allowClear placeholder="Select category">
                        {categories.map((c) => (
                          <Option key={c.categoryId} value={c.categoryId}>
                            {c.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="brandId" label="Brand">
                      <Select allowClear placeholder="Select brand">
                        {brandData.map((b) => (
                          <Option key={b.id} value={b.id}>
                            {b.brandName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="vendorId" label="Vendor">
                      <Select allowClear placeholder="Select vendor">
                        {vendorData.map((v) => (
                          <Option key={v.id} value={v.id}>
                            {v.vendorName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="brand_parentcategoriesId"
                      label="Parent Category"
                    >
                      <Select allowClear>
                        {brandParentCategoryData.map((b) => (
                          <Option key={b.id} value={b.id}>
                            {b.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="status"
                      label="Status"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="active">Active</Option>
                        <Option value="inactive">Inactive</Option>
                        <Option value="expired">Expired</Option>
                        <Option value="out_of_stock">Out of Stock</Option>
                        <Option value="bulk_stocked">Bulk Stocked</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item name="isFeatured" label="Featured Product">
                      <Select>
                        <Option value="false">No</Option>
                        <Option value="true">Yes</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              {/* 2. Variant Settings */}
              <Panel
                header={
                  <>
                    <FiPackage style={{ marginRight: 8 }} /> Variant Settings
                  </>
                }
                key="2"
              >
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="isMaster" label="Is Master Product?">
                      <Select>
                        <Option value="false">No (Variant)</Option>
                        <Option value="true">Yes (Master)</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.isMaster !== curr.isMaster
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("isMaster") === "false" && (
                        <Col xs={24} sm={16}>
                          <Form.Item
                            name="masterProductId"
                            label="Master Product"
                          >
                            <Select
                              allowClear
                              placeholder="Search master product..."
                            >
                              {allProducts
                                .filter((p) => p.isMaster)
                                .map((p) => (
                                  <Option key={p.productId} value={p.productId}>
                                    {p.name} ({p.product_code})
                                  </Option>
                                ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      )
                    }
                  </Form.Item>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="variantKey"
                      label="Variant Name (e.g. Red Matte)"
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="skuSuffix" label="SKU Suffix">
                      <Input placeholder="-RED, -60X60" />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      name="variantOptions"
                      label="Variant Options (JSON)"
                    >
                      <TextArea
                        rows={4}
                        placeholder='{"color": "Red", "size": "60x60", "finish": "Matte"}'
                      />
                      <Text type="secondary">
                        Enter valid JSON object for variant attributes
                      </Text>
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              {/* 3. Stock & Pricing */}
              <Panel header="Stock & Tax" key="3">
                <Row gutter={16}>
                  <Col xs={8}>
                    <Form.Item
                      name="quantity"
                      label="Quantity"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={8}>
                    <Form.Item name="alert_quantity" label="Low Stock Alert">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={8}>
                    <Form.Item name="tax" label="Tax (%)">
                      <InputNumber
                        min={0}
                        max={100}
                        step={0.01}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="discountType" label="Discount Type">
                      <Select allowClear>
                        <Option value="percent">Percent (%)</Option>
                        <Option value="fixed">Fixed Amount</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              {/* 4. Description */}
              <Panel header="Description" key="4">
                <Form.Item name="description">
                  <TextArea rows={4} maxLength={1000} showCount />
                </Form.Item>
              </Panel>

              {/* 5. Images */}
              <Panel header={<>Images ({totalImages}/5)</>} key="5">
                <div
                  {...getRootProps()}
                  style={{
                    border: "2px dashed #d9d9d9",
                    padding: 24,
                    textAlign: "center",
                    borderRadius: 8,
                    background: isDragActive ? "#f0f8ff" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Drop images...</p>
                  ) : (
                    <p>
                      <FiPlusCircle size={32} />
                      <br />
                      Click or drag (max 5)
                    </p>
                  )}
                </div>

                <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                  {existingImages.map((url) => (
                    <Col key={url}>
                      <div style={{ position: "relative" }}>
                        <img
                          src={url}
                          alt=""
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                          onClick={() => setSelectedImage(url)}
                        />
                        <Button
                          danger
                          size="small"
                          style={{ position: "absolute", top: 4, right: 4 }}
                          onClick={() => removeExistingImage(url)}
                        >
                          ×
                        </Button>
                      </div>
                    </Col>
                  ))}
                  {newImages.map((img) => (
                    <Col key={img.preview}>
                      <div style={{ position: "relative" }}>
                        <img
                          src={img.preview}
                          alt=""
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                          onClick={() => setSelectedImage(img.preview)}
                        />
                        <Button
                          danger
                          size="small"
                          style={{ position: "absolute", top: 4, right: 4 }}
                          onClick={() => removeNewImage(img.preview)}
                        >
                          ×
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Panel>

              {/* 6. Specifications */}
              <Panel
                header={
                  <>Product Specifications ({Object.keys(metaData).length})</>
                }
                key="6"
              >
                {/* existing meta rows */}
                {Object.entries(metaData).map(([id, val]) => {
                  const m = productMetaData.find((x) => x.id === id);
                  if (!m) return null;
                  return (
                    <Row
                      key={id}
                      gutter={8}
                      align="middle"
                      style={{ marginBottom: 8 }}
                    >
                      <Col flex="120px">
                        <strong>{m.title}:</strong>
                      </Col>
                      <Col flex="1">
                        <Input
                          type={m.fieldType === "number" ? "number" : "text"}
                          value={val}
                          onChange={(e) => handleMetaChange(id, e.target.value)}
                        />
                      </Col>
                      <Col>
                        <Button
                          danger
                          size="small"
                          onClick={() =>
                            setMetaData((p) => {
                              const { [id]: _, ...rest } = p;
                              return rest;
                            })
                          }
                        >
                          Remove
                        </Button>
                      </Col>
                    </Row>
                  );
                })}

                {/* Add new spec */}
                {productMetaData.filter((m) => !(m.id in metaData)).length >
                  0 && (
                  <Select
                    placeholder="Add specification..."
                    style={{ width: "100%", marginTop: 12 }}
                    onChange={(id) => setMetaData((p) => ({ ...p, [id]: "" }))}
                    allowClear
                  >
                    {productMetaData
                      .filter((m) => !(m.id in metaData))
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
              loading={isCreating || isUpdating}
              style={{ marginTop: 24 }}
            >
              {isEditMode ? "Update Product" : "Create Product"}
            </Button>
          </Form>

          <Modal
            open={!!selectedImage}
            footer={null}
            onCancel={() => setSelectedImage(null)}
            width={800}
          >
            <img
              src={selectedImage}
              alt="Zoom"
              style={{ width: "100%", marginTop: 16, borderRadius: 8 }}
            />
          </Modal>
        </div>

        <style jsx>{`
          .compact-accordion .ant-collapse-header {
            padding: 8px 16px !important;
          }
          .compact-accordion .ant-collapse-content-box {
            padding: 16px !important;
          }
        `}</style>
      </div>
    </>
  );
};

export default CreateProduct;
