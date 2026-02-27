import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useReplaceAllKeywordsForProductMutation,
} from "../../api/productApi";

import {
  ArrowLeftOutlined,
  PictureOutlined,
  PlusCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";

import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useGetAllProductMetaQuery } from "../../api/productMetaApi";
import { useGetBrandParentCategoriesQuery } from "../../api/brandParentCategoryApi";
import {
  useGetAllKeywordsQuery,
  useCreateKeywordMutation,
} from "../../api/keywordApi";

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
  Space,
  Typography,
} from "antd";

import { useGetAllProductsQuery } from "../../api/productApi";

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Text } = Typography;

const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a";

const CreateProduct = ({
  initialData, // From bulk import
  isBulkMode = false,
  onUpdate, // Callback to notify BulkProductImport of changes
}) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(productId) && !isBulkMode;

  const [form] = Form.useForm();
  const categoryId = Form.useWatch("categoryId", form);

  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [metaData, setMetaData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  // RTK Queries
  const { data: existingProduct } = useGetProductByIdQuery(productId, {
    skip: !isEditMode,
  });

  const [replaceAllKeywordsForProduct] =
    useReplaceAllKeywordsForProductMutation();

  const { data: categoryData = { categories: [] } } =
    useGetAllCategoriesQuery();
  const { data: brands = [] } = useGetAllBrandsQuery();
  const { data: vendors = [] } = useGetVendorsQuery();
  const { data: brandParentCategories = [] } =
    useGetBrandParentCategoriesQuery();
  const { data: productMetas = [] } = useGetAllProductMetaQuery();

  const { data: allProductsResponse, isLoading: isAllProductsLoading } =
    useGetAllProductsQuery(
      { limit: 5000 },
      { skip: !isEditMode || isBulkMode },
    );

  const allProducts = useMemo(
    () =>
      Array.isArray(allProductsResponse?.data) ? allProductsResponse.data : [],
    [allProductsResponse?.data],
  );

  const { data: keywordList = [] } = useGetAllKeywordsQuery();
  const allKeywords = Array.isArray(keywordList) ? keywordList : [];

  const [createKeyword] = useCreateKeywordMutation();

  const categories = categoryData.categories || [];
  const brandData = Array.isArray(brands) ? brands : [];
  const vendorData = Array.isArray(vendors) ? vendors : [];
  const productMetaData = Array.isArray(productMetas) ? productMetas : [];
  const brandParentCategoryData = Array.isArray(brandParentCategories)
    ? brandParentCategories
    : [];

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  // ────────────────────────────────────────────────
  // BULK MODE: Pre-fill from CSV/initialData
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData || isEditMode) return;

    form.setFieldsValue({
      name: initialData.name || "",
      product_code: initialData.product_code || "",
      description: initialData.description || "",
      quantity: initialData.quantity || 0,
      tax: initialData.tax ?? null,
      alert_quantity: initialData.alert_quantity ?? null,
      status: initialData.status || "active",
      discountType: initialData.discountType,
      isFeatured: initialData.isFeatured ? "true" : "false",
      isMaster: initialData.isMaster ? "true" : "false",
      categoryId: initialData.categoryId,
      brandId: initialData.brandId,
      vendorId: initialData.vendorId,
      brand_parentcategoriesId: initialData.brand_parentcategoriesId,
    });

    if (Array.isArray(initialData.images) && initialData.images.length > 0) {
      setExistingImages(initialData.images.slice(0, 5));
    }

    if (initialData.meta && typeof initialData.meta === "object") {
      const resolved = {};
      Object.entries(initialData.meta).forEach(([key, value]) => {
        const metaDef = productMetaData.find(
          (m) =>
            m.slug === key ||
            m.title.toLowerCase().replace(/\s+/g, "") === key.toLowerCase(),
        );
        if (metaDef) resolved[metaDef.id] = value;
      });
      setMetaData(resolved);
    }

    if (Array.isArray(initialData.keywords)) {
      const fakeKeywords = initialData.keywords.map((kw, i) => ({
        id: `bulk-${i}`,
        keyword: kw,
        categories: { name: "Imported" },
      }));
      setSelectedKeywords(fakeKeywords);
    }

    if (
      initialData.variantOptions &&
      typeof initialData.variantOptions === "object"
    ) {
      const list = Object.entries(initialData.variantOptions).map(([k, v]) => ({
        key: k,
        value: v,
      }));
      form.setFieldsValue({
        variantOptions: JSON.stringify(initialData.variantOptions, null, 2),
        variantAttributes: list,
      });
    }
  }, [initialData, isEditMode, form, productMetaData]);

  // ────────────────────────────────────────────────
  // EDIT MODE: Load existing product data
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!existingProduct || !isEditMode) return;

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

    let imagesArray = [];
    try {
      imagesArray =
        typeof existingProduct.images === "string"
          ? JSON.parse(existingProduct.images)
          : Array.isArray(existingProduct.images)
            ? existingProduct.images
            : [];
    } catch (e) {}
    setExistingImages(Array.isArray(imagesArray) ? imagesArray : []);

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

    if (existingProduct.keywords) {
      try {
        const keywords =
          typeof existingProduct.keywords === "string"
            ? JSON.parse(existingProduct.keywords)
            : existingProduct.keywords;

        const normalized = (Array.isArray(keywords) ? keywords : []).map(
          (kw) => ({
            id: kw.id,
            keyword: kw.keyword,
            categories: kw.categories || kw.category || null,
          }),
        );
        setSelectedKeywords(normalized);
      } catch (e) {}
    }

    if (existingProduct.variantOptions) {
      try {
        const opts =
          typeof existingProduct.variantOptions === "string"
            ? JSON.parse(existingProduct.variantOptions)
            : existingProduct.variantOptions;

        const listFormat = Object.entries(opts || {}).map(([key, value]) => ({
          key,
          value,
        }));

        form.setFieldsValue({
          variantOptions: JSON.stringify(opts, null, 2),
          variantAttributes: listFormat,
        });
      } catch (e) {}
    }
  }, [existingProduct, productMetaData, form, isEditMode]);

  const handleValuesChange = () => {
    if (isBulkMode && onUpdate) {
      const values = form.getFieldsValue();
      onUpdate({
        ...values,
        meta: metaData,
        images: existingImages,
        keywords: selectedKeywords.map((k) => k.keyword),
      });
    }
  };

  const handleCreateKeyword = async (keywordName) => {
    const trimmed = keywordName.trim();
    if (!trimmed || !categoryId) {
      message.warning("Please select a category first");
      return;
    }

    try {
      const result = await createKeyword({
        keyword: trimmed,
        categoryId,
      }).unwrap();

      const newKeyword = {
        id: result.id || result.keyword?.id || result.keywordId,
        keyword: result.keyword || trimmed,
        categories: result.categories || {
          categoryId,
          name:
            categories.find((c) => c.categoryId === categoryId)?.name ||
            "Unknown",
          slug: categories.find((c) => c.categoryId === categoryId)?.slug,
        },
      };

      setSelectedKeywords((prev) => [...prev, newKeyword]);
      setSearchKeyword("");
      message.success(`"${trimmed}" created and added!`);

      if (isEditMode && productId) {
        try {
          await replaceAllKeywordsForProduct({
            productId,
            keywordIds: [...selectedKeywords.map((k) => k.id), newKeyword.id],
          }).unwrap();
        } catch (err) {
          // silent – fixed on full save
        }
      }
    } catch (err) {
      message.error("Failed to create keyword");
    }
  };

  const updateVariantOptionsFromList = useCallback(() => {
    const attributes = form.getFieldValue("variantAttributes") || [];
    const jsonObj = {};

    attributes.forEach((attr) => {
      const cleanKey = String(attr?.key ?? "").trim();
      const cleanValue = String(attr?.value ?? "").trim();
      if (cleanKey && cleanValue) jsonObj[cleanKey] = cleanValue;
    });

    const jsonString =
      Object.keys(jsonObj).length > 0 ? JSON.stringify(jsonObj, null, 2) : "";
    form.setFieldsValue({ variantOptions: jsonString });
  }, [form]);

  useEffect(() => {
    const timer = setTimeout(updateVariantOptionsFromList, 300);
    return () => clearTimeout(timer);
  }, [form.getFieldValue("variantAttributes"), updateVariantOptionsFromList]);

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
    [existingImages.length, newImages.length],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxSize: 5 * 1024 * 1024,
    onDrop,
  });

  useEffect(() => {
    const handlePaste = async (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              message.warning(`${file.name || "Image"} is larger than 5MB`);
              continue;
            }
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        if (existingImages.length + newImages.length + pastedFiles.length > 5) {
          message.warning("Maximum 5 images allowed");
          return;
        }

        const mapped = pastedFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));

        setNewImages((prev) => [...prev, ...mapped]);
        message.success(`${pastedFiles.length} image(s) pasted successfully!`);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [existingImages.length, newImages.length]);

  const removeExistingImage = (url) => {
    setExistingImages((p) => p.filter((i) => i !== url));
    setImagesToDelete((p) => [...p, url]);
  };

  const removeNewImage = (preview) => {
    setNewImages((p) => {
      const filtered = p.filter((i) => i.preview !== preview);
      p.filter((i) => i.preview === preview).forEach((i) =>
        URL.revokeObjectURL(i.preview),
      );
      return filtered;
    });
  };

  const onFinish = async (values) => {
    const required = ["name", "quantity"];
    if (required.some((f) => !values[f])) {
      message.warning("Please fill all required fields");
      return;
    }

    // Validate number meta fields
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
      if (values[k] !== undefined && values[k] !== null && values[k] !== "") {
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
      },
    );

    if (values.variantOptions) {
      try {
        const json = JSON.parse(values.variantOptions);
        formData.append("variantOptions", JSON.stringify(json));
      } catch (e) {
        message.error("Invalid JSON in Variant Options");
        return;
      }
    }

    if (Object.keys(metaData).length > 0) {
      formData.append("meta", JSON.stringify(metaData));
    }

    newImages.forEach((img) => formData.append("images", img.file));

    if (isEditMode && imagesToDelete.length > 0) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    try {
      let finalProductId;

      if (isEditMode) {
        await updateProduct({ productId, formData }).unwrap();
        finalProductId = productId;
      } else {
        const result = await createProduct(formData).unwrap();
        finalProductId =
          result.product?.productId || result.productId || result.id;
        if (!finalProductId) throw new Error("No product ID returned");
      }

      const keywordIds = selectedKeywords.map((k) => k.id).filter(Boolean);

      if (keywordIds.length > 0) {
        await replaceAllKeywordsForProduct({
          productId: finalProductId,
          keywordIds,
        }).unwrap();
        message.success("Keywords updated successfully");
      }

      message.success(isEditMode ? "Product updated!" : "Product created!");
      if (!isBulkMode) navigate(-1);
    } catch (err) {
      message.error(err?.data?.message || "Failed to save product");
    }
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="page-wrapper">
      <div className="content">
        {!isBulkMode && (
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <h4 style={{ margin: 0, fontWeight: "bold" }}>
              {isEditMode ? "Edit Product" : "Create New Product"}
            </h4>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </Row>
        )}

        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          onValuesChange={handleValuesChange}
        >
          <Collapse
            defaultActiveKey={["1", "2", "3", "4", "5", "6", "7"]}
            className="compact-accordion"
          >
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

                {productMetaData.some((m) => m.id === COMPANY_CODE_META_ID) && (
                  <Col xs={24} md={12}>
                    <Form.Item label="Company / Batch Code">
                      <Input
                        placeholder="e.g. 2024, ABC123, Q1-26"
                        value={metaData[COMPANY_CODE_META_ID] ?? ""}
                        onChange={(e) =>
                          handleMetaChange(COMPANY_CODE_META_ID, e.target.value)
                        }
                      />
                      <div
                        style={{ fontSize: 12, color: "#888", marginTop: 4 }}
                      >
                        Internal reference / batch identifier
                      </div>
                    </Form.Item>
                  </Col>
                )}

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

            {/* Variant Settings */}
            <Panel
              header={
                <>
                  <InboxOutlined style={{ marginRight: 8 }} /> Variant Settings
                </>
              }
              key="2"
            >
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="isMaster"
                    label="Product Type"
                    initialValue="false"
                  >
                    <Select>
                      <Option value="true">
                        Master Product (has variants)
                      </Option>
                      <Option value="false">Variant (belongs to master)</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) => prev.isMaster !== curr.isMaster}
                >
                  {({ getFieldValue }) => {
                    const isMaster = getFieldValue("isMaster") === "true";
                    if (isMaster) return null;

                    return (
                      <Col xs={24} sm={16}>
                        <Form.Item
                          name="masterProductId"
                          label="Select Master Product"
                          rules={[
                            {
                              required: true,
                              message: "Please select master product",
                            },
                          ]}
                        >
                          <Select
                            showSearch
                            placeholder="Search master products..."
                            optionFilterProp="children"
                          >
                            {allProducts
                              .filter(
                                (p) =>
                                  p.isVariant === false || p.isVariant === null,
                              )
                              .map((p) => (
                                <Option key={p.productId} value={p.productId}>
                                  {p.name} ({p.product_code})
                                </Option>
                              ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    );
                  }}
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) => prev.isMaster !== curr.isMaster}
                >
                  {({ getFieldValue }) => {
                    const isMaster = getFieldValue("isMaster") === "true";
                    if (isMaster) return null;

                    return (
                      <Col xs={24} md={12}>
                        <Form.Item label="Variant Attributes (Dynamic)">
                          <Form.List name="variantAttributes">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...restField }) => (
                                  <Space
                                    key={key}
                                    style={{ display: "flex", marginBottom: 8 }}
                                    align="baseline"
                                  >
                                    <Form.Item
                                      {...restField}
                                      name={[name, "key"]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "Attribute name required",
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input placeholder="Attribute (e.g. Color, Size, Material)" />
                                    </Form.Item>

                                    <Form.Item
                                      {...restField}
                                      name={[name, "value"]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "Value required",
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input placeholder="Value (e.g. Red, 60x60, Matte)" />
                                    </Form.Item>

                                    <Button
                                      danger
                                      size="small"
                                      onClick={() => remove(name)}
                                      icon="×"
                                    />
                                  </Space>
                                ))}

                                <Button
                                  type="dashed"
                                  onClick={() => add()}
                                  block
                                  icon={<PlusCircleOutlined />}
                                  style={{ marginTop: 8 }}
                                >
                                  Add Variant Attribute
                                </Button>
                              </>
                            )}
                          </Form.List>

                          <Form.Item name="variantOptions" noStyle>
                            <Input type="hidden" />
                          </Form.Item>
                        </Form.Item>
                      </Col>
                    );
                  }}
                </Form.Item>
              </Row>
            </Panel>

            {/* Stock & Tax */}
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

            {/* Description */}
            <Panel header="Description" key="4">
              <Form.Item name="description">
                <TextArea rows={4} maxLength={1000} showCount />
              </Form.Item>
            </Panel>

            {/* Images */}
            <Panel header={<>Images ({totalImages}/5)</>} key="5">
              <div
                {...getRootProps()}
                style={{
                  border: "2px dashed #d9d9d9",
                  padding: 32,
                  textAlign: "center",
                  borderRadius: 8,
                  background: isDragActive ? "#e6f7ff" : "#fafafa",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <input {...getInputProps()} />
                <PictureOutlined
                  size={48}
                  color="#999"
                  style={{ marginBottom: 16 }}
                />
                <p style={{ margin: 0, color: "#666", fontSize: 16 }}>
                  <strong>Click to upload</strong> or drag & drop
                </p>
                <p style={{ margin: "8px 0 0", color: "#999", fontSize: 14 }}>
                  You can also <strong>paste images</strong> from clipboard
                  (Ctrl+V)
                </p>
                <p style={{ marginTop: 8, color: "#aaa", fontSize: 12 }}>
                  Max 5 images • Up to 5MB each • JPG, PNG, WEBP
                </p>
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

            {/* Keywords */}
            <Panel
              header={<>Keywords & Tags ({selectedKeywords.length})</>}
              key="7"
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  style={{ width: "100%" }}
                  placeholder="Search or add new keywords..."
                  value={selectedKeywords.map((k) => k.id)}
                  onSearch={setSearchKeyword}
                  onChange={(selectedIds) => {
                    const newlySelected = allKeywords.filter(
                      (kw) =>
                        selectedIds.includes(kw.id) &&
                        !selectedKeywords.some((s) => s.id === kw.id),
                    );
                    const updated = [
                      ...selectedKeywords.filter((k) =>
                        selectedIds.includes(k.id),
                      ),
                      ...newlySelected,
                    ];
                    setSelectedKeywords(updated);
                  }}
                  optionLabelProp="label"
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {searchKeyword &&
                        !allKeywords.some(
                          (kw) =>
                            kw.keyword.toLowerCase() ===
                            searchKeyword.trim().toLowerCase(),
                        ) && (
                          <div
                            style={{
                              padding: "10px 12px",
                              borderTop: "1px solid #f0f0f0",
                              background: "#fafafa",
                            }}
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<PlusCircleOutlined />}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() =>
                                handleCreateKeyword(searchKeyword.trim())
                              }
                              style={{ width: "100%", textAlign: "left" }}
                            >
                              <div>
                                <div>
                                  <strong>Add new:</strong> "
                                  {searchKeyword.trim()}"
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#888",
                                    marginTop: 2,
                                  }}
                                >
                                  Category:{" "}
                                  <strong>
                                    {categoryId
                                      ? categories.find(
                                          (c) => c.categoryId === categoryId,
                                        )?.name || "Loading..."
                                      : "Select a category first"}
                                  </strong>
                                </div>
                              </div>
                            </Button>
                          </div>
                        )}
                    </>
                  )}
                >
                  {allKeywords
                    .filter((kw) =>
                      kw.keyword
                        .toLowerCase()
                        .includes(searchKeyword.toLowerCase()),
                    )
                    .map((kw) => (
                      <Option key={kw.id} value={kw.id} label={kw.keyword}>
                        <Space>
                          <span>{kw.keyword}</span>
                          {kw.categories && (
                            <Tag
                              color="blue"
                              style={{ marginLeft: 8, fontSize: 10 }}
                            >
                              {kw.categories.name}
                            </Tag>
                          )}
                        </Space>
                      </Option>
                    ))}
                </Select>

                <Space wrap>
                  {selectedKeywords.map((kw) => (
                    <Tag
                      key={kw.id}
                      closable
                      onClose={() =>
                        setSelectedKeywords((prev) =>
                          prev.filter((k) => k.id !== kw.id),
                        )
                      }
                      color="geekblue"
                    >
                      {kw.keyword}
                      {kw.categories && ` • ${kw.categories.name}`}
                    </Tag>
                  ))}
                </Space>
              </Space>
            </Panel>

            {/* Specifications */}
            <Panel
              header={
                <>Product Specifications ({Object.keys(metaData).length})</>
              }
              key="6"
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                {Object.entries(metaData)
                  .filter(([id]) => id !== COMPANY_CODE_META_ID)
                  .map(([id, value]) => {
                    const meta = productMetaData.find((m) => m.id === id);
                    if (!meta) return null;

                    const isNumber = meta.fieldType === "number";

                    return (
                      <Row key={id} gutter={16} align="middle">
                        <Col flex="200px">
                          <Text strong>
                            {meta.title}{" "}
                            {meta.unit && (
                              <span style={{ fontWeight: "normal" }}>
                                ({meta.unit})
                              </span>
                            )}
                          </Text>
                        </Col>
                        <Col flex="1">
                          {isNumber ? (
                            <InputNumber
                              style={{ width: "100%" }}
                              value={value || null}
                              onChange={(val) => handleMetaChange(id, val)}
                              placeholder={`Enter ${meta.title.toLowerCase()}`}
                              min={meta.min || undefined}
                              max={meta.max || undefined}
                              step={meta.step || 1}
                            />
                          ) : (
                            <Input
                              value={value || ""}
                              onChange={(e) =>
                                handleMetaChange(id, e.target.value)
                              }
                              placeholder={`Enter ${meta.title.toLowerCase()}`}
                            />
                          )}
                        </Col>
                        <Col>
                          <Button
                            danger
                            size="small"
                            onClick={() =>
                              setMetaData((prev) => {
                                const newMeta = { ...prev };
                                delete newMeta[id];
                                return newMeta;
                              })
                            }
                          >
                            Remove
                          </Button>
                        </Col>
                      </Row>
                    );
                  })}

                {productMetaData.filter(
                  (m) => m.id !== COMPANY_CODE_META_ID && !(m.id in metaData),
                ).length > 0 && (
                  <Select
                    placeholder="Add another specification..."
                    style={{ width: "100%", marginTop: 16 }}
                    onChange={(id) =>
                      setMetaData((prev) => ({ ...prev, [id]: "" }))
                    }
                    allowClear
                    dropdownMatchSelectWidth={false}
                  >
                    {productMetaData
                      .filter(
                        (m) =>
                          m.id !== COMPANY_CODE_META_ID && !(m.id in metaData),
                      )
                      .map((m) => (
                        <Option key={m.id} value={m.id}>
                          {m.title} {m.unit && `(${m.unit})`}
                        </Option>
                      ))}
                  </Select>
                )}

                {Object.keys(metaData).length === 1 &&
                  metaData[COMPANY_CODE_META_ID] && (
                    <Text type="secondary">
                      No additional specifications available to add.
                    </Text>
                  )}
              </Space>
            </Panel>
          </Collapse>

          {!isBulkMode && (
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
          )}
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
  );
};

export default CreateProduct;
