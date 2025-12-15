import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useReplaceAllKeywordsForProductMutation,
  useLazyCheckProductCodeQuery,
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
  useCreateKeywordMutation, // Add this!
} from "../../api/keywordApi";
import { useAddKeywordsToProductMutation } from "../../api/productApi";
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
  const categoryId = Form.useWatch("categoryId", form);
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [metaData, setMetaData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [autoCode, setAutoCode] = useState("");
  const [isCodeDirty, setIsCodeDirty] = useState(false);
  const [codeStatus, setCodeStatus] = useState(""); // "checking", "unique", "duplicate"
  const [selectedKeywords, setSelectedKeywords] = useState([]); // array of keyword objects
  const [searchKeyword, setSearchKeyword] = useState("");
  // RTK Queries
  const { data: existingProduct, isLoading: loadingProduct } =
    useGetProductByIdQuery(productId, {
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
  const { data: allProducts = [] } = useGetAllProductsQuery(undefined, {
    skip: !isEditMode,
  }); // for master product dropdown
  const { data: keywordList = [] } = useGetAllKeywordsQuery();
  const allKeywords = Array.isArray(keywordList) ? keywordList : [];
  const [addKeywordsToProduct] = useAddKeywordsToProductMutation();
  const [triggerCheckCode] = useLazyCheckProductCodeQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [createKeyword] = useCreateKeywordMutation(); // Make sure this is imported!
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

      const candidate = `E${brandPrefix}${last4}${random3}`;

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
  const handleCreateKeyword = async (keywordName) => {
    const trimmed = keywordName.trim();
    if (!trimmed || !categoryId) {
      message.warning("Please select a category first");
      return;
    }

    try {
      const result = await createKeyword({
        keyword: trimmed,
        categoryId: categoryId,
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

      // ADD TO UI IMMEDIATELY
      setSelectedKeywords((prev) => [...prev, newKeyword]);
      setSearchKeyword("");
      message.success(`"${trimmed}" created and added!`);

      // IF WE ARE IN EDIT MODE → attach it immediately to avoid race
      if (isEditMode && productId) {
        try {
          await replaceAllKeywordsForProduct({
            productId,
            keywordIds: [...selectedKeywords.map((k) => k.id), newKeyword.id],
          }).unwrap();
          message.success("Keyword attached instantly");
        } catch (err) {
          // Silent — will be fixed on save
        }
      }
    } catch (err) {
      console.error("Failed to create keyword", err);
      message.error("Failed to create keyword");
    }
  };
  // Convert Form.List → JSON for variantOptions
  const updateVariantOptionsFromList = useCallback(() => {
    const attributes = form.getFieldValue("variantAttributes") || [];
    const jsonObj = {};

    attributes.forEach((attr) => {
      if (attr?.key && attr?.value) {
        const cleanKey = attr.key.trim();
        const cleanValue = attr.value.trim();
        if (cleanKey && cleanValue) {
          jsonObj[cleanKey] = cleanValue;
        }
      }
    });

    const jsonString =
      Object.keys(jsonObj).length > 0 ? JSON.stringify(jsonObj, null, 2) : "";
    form.setFieldsValue({ variantOptions: jsonString });
  }, [form]);

  // Auto update when variantAttributes change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateVariantOptionsFromList();
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [form.getFieldValue("variantAttributes"), updateVariantOptionsFromList]);

  // Generate readable name: "Red Matte 60x60"
  const getVariantDisplayName = () => {
    try {
      const json = form.getFieldValue("variantOptions");
      if (!json) return "";
      const obj = JSON.parse(json);
      return Object.values(obj).filter(Boolean).join(" ");
    } catch {
      return "";
    }
  };

  // Generate SKU suffix: "-RED-MATTE-60X60"
  const getVariantSkuSuffix = () => {
    try {
      const json = form.getFieldValue("variantOptions");
      if (!json) return "";
      const obj = JSON.parse(json);
      const parts = Object.values(obj).filter(Boolean);
      return parts.length
        ? `-${parts.join("-").toUpperCase().replace(/\s+/g, "-")}`
        : "";
    } catch {
      return "";
    }
  };
  // Auto-add Company Code field when in create mode and it's not already there
  useEffect(() => {
    if (isEditMode) return;

    const companyCodeMeta = productMetaData.find(
      (m) => m.id === COMPANY_CODE_META_ID
    );
    if (companyCodeMeta && !(COMPANY_CODE_META_ID in metaData)) {
      setMetaData((prev) => ({
        ...prev,
        [COMPANY_CODE_META_ID]: "", // or default value like "0000"
      }));
    }
  }, [isEditMode, productMetaData, metaData]);
  // Auto generate code when brand or company code changes
  const brandId = Form.useWatch("brandId", form);

  useEffect(() => {
    if (isEditMode || isCodeDirty) return;

    const companyCode = metaData[COMPANY_CODE_META_ID];

    if (
      brandId &&
      companyCode !== undefined &&
      companyCode !== null &&
      String(companyCode).trim() !== ""
    ) {
      generateUniqueCode(brandId, companyCode);
    }
  }, [brandId, metaData, isEditMode, isCodeDirty, generateUniqueCode]);
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
    if (existingProduct.keywords) {
      try {
        const keywords =
          typeof existingProduct.keywords === "string"
            ? JSON.parse(existingProduct.keywords)
            : existingProduct.keywords;

        // NORMALIZE: ensure every keyword has { id, keyword, categories: { ... } }
        const normalized = (Array.isArray(keywords) ? keywords : []).map(
          (kw) => ({
            id: kw.id,
            keyword: kw.keyword,
            categories: kw.categories || kw.category || null, // ← fix both possible names
          })
        );

        setSelectedKeywords(normalized);
      } catch (e) {
        console.error("Failed to parse keywords", e);
      }
    }
    // Variant options (JSON)
    // Variant options (JSON)
    if (existingProduct.variantOptions) {
      try {
        const opts =
          typeof existingProduct.variantOptions === "string"
            ? JSON.parse(existingProduct.variantOptions)
            : existingProduct.variantOptions;

        // Convert { color: "Red", size: "60x60" } → Form.List format
        const listFormat = Object.entries(opts || {}).map(([key, value]) => ({
          key,
          value,
        }));

        form.setFieldsValue({
          variantOptions: JSON.stringify(opts, null, 2),
          variantAttributes: listFormat,
        });
      } catch (e) {
        console.error("Failed to parse variantOptions", e);
      }
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
  // Clipboard Paste Support for Images
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
            // Optional: Limit size
            if (file.size > 5 * 1024 * 1024) {
              message.warning(`${file.name || "Image"} is larger than 5MB`);
              continue;
            }
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        // Check total image limit
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

    // Only attach if we're on the page with the dropzone
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

    // Validate number meta fields
    for (const [id, val] of Object.entries(metaData)) {
      const m = productMetaData.find((x) => x.id === id);
      if (m?.fieldType === "number" && val !== "" && isNaN(val)) {
        message.error(`${m.title} must be a number`);
        return;
      }
    }

    const formData = new FormData();

    // Basic fields
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
      }
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

    // Images
    newImages.forEach((img) => formData.append("images", img.file));
    if (isEditMode && imagesToDelete.length > 0) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    // DO NOT SEND selectedKeywords HERE ANYMORE

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

      // === NOW SAFELY REPLACE KEYWORDS ===
      const keywordIds = selectedKeywords.map((k) => k.id).filter(Boolean);

      if (keywordIds.length > 0) {
        await replaceAllKeywordsForProduct({
          productId: finalProductId,
          keywordIds, // ← pure array of strings
        }).unwrap();

        message.success("Keywords updated successfully");
      }

      message.success(isEditMode ? "Product updated!" : "Product created!");
      navigate("/products");
    } catch (err) {
      console.error("Save failed:", err);
      message.error(err?.data?.message || "Failed to save product or keywords");
    }
  };
  const totalImages = existingImages.length + newImages.length;

  return (
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
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

                    if (!isMaster) {
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
                                .filter((p) => p.isMaster)
                                .map((p) => (
                                  <Option key={p.productId} value={p.productId}>
                                    {p.name} ({p.product_code})
                                  </Option>
                                ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      );
                    }
                    return null;
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
                      <>
                        {/* DYNAMIC VARIANT ATTRIBUTES EDITOR */}
                        <Col xs={24} md={12}>
                          <Form.Item label="Variant Attributes (Dynamic)">
                            <Form.List name="variantAttributes">
                              {(fields, { add, remove }) => (
                                <>
                                  {fields.map(({ key, name, ...restField }) => (
                                    <Space
                                      key={key}
                                      style={{
                                        display: "flex",
                                        marginBottom: 8,
                                      }}
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

                            {/* Hidden field to store final JSON */}
                            <Form.Item name="variantOptions" noStyle>
                              <Input type="hidden" />
                            </Form.Item>
                          </Form.Item>
                        </Col>

                        {/* AUTO-GENERATED PREVIEW */}
                        <Col xs={24} md={24}>
                          <Form.Item label="Auto-generated Preview">
                            <Space
                              direction="vertical"
                              style={{ width: "100%" }}
                            >
                              <Input
                                addonBefore="Variant Name"
                                readOnly
                                style={{ background: "#f9f9f9" }}
                                value={getVariantDisplayName()}
                              />
                              <Input
                                addonBefore="SKU Suffix"
                                readOnly
                                style={{ background: "#f9f9f9" }}
                                value={getVariantSkuSuffix()}
                              />
                            </Space>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item label="Auto-generated Preview">
                            <Space
                              direction="vertical"
                              style={{ width: "100%" }}
                            >
                              <Input
                                addonBefore="Variant Name"
                                readOnly
                                style={{ background: "#f9f9f9" }}
                                value={(() => {
                                  try {
                                    const opts =
                                      form.getFieldValue("variantOptions");
                                    if (!opts) return "";
                                    const json = JSON.parse(opts);
                                    return Object.values(json)
                                      .filter(Boolean)
                                      .join(" ")
                                      .trim();
                                  } catch {
                                    return "";
                                  }
                                })()}
                              />
                              <Input
                                addonBefore="SKU Suffix"
                                readOnly
                                style={{ background: "#f9f9f9" }}
                                value={(() => {
                                  try {
                                    const opts =
                                      form.getFieldValue("variantOptions");
                                    if (!opts) return "";
                                    const json = JSON.parse(opts);
                                    const parts =
                                      Object.values(json).filter(Boolean);
                                    return parts.length > 0
                                      ? `-${parts
                                          .join("-")
                                          .toUpperCase()
                                          .replace(/\s+/g, "-")}`
                                      : "";
                                  } catch {
                                    return "";
                                  }
                                })()}
                              />
                            </Space>
                          </Form.Item>
                        </Col>
                      </>
                    );
                  }}
                </Form.Item>
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
            {/* 7. Keywords & Tags */}
            {/* 7. Keywords & Tags */}
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
                        !selectedKeywords.some((s) => s.id === kw.id)
                    );
                    const updated = [
                      ...selectedKeywords.filter((k) =>
                        selectedIds.includes(k.id)
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
                            searchKeyword.trim().toLowerCase()
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
                                          (c) => c.categoryId === categoryId
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
                        .includes(searchKeyword.toLowerCase())
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
                          prev.filter((k) => k.id !== kw.id)
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
            {/* 6. Specifications */}
            {/* 6. Specifications */}
            <Panel
              header={
                <>Product Specifications ({Object.keys(metaData).length})</>
              }
              key="6"
            >
              {/* Always show Company Code if it exists in meta list */}
              {productMetaData
                .filter(
                  (m) => m.id === COMPANY_CODE_META_ID || m.id in metaData
                )
                .map((m) => {
                  const value = metaData[m.id] || "";
                  const isCompanyCode = m.id === COMPANY_CODE_META_ID;

                  return (
                    <Row
                      key={m.id}
                      gutter={16}
                      align="middle"
                      style={{ marginBottom: 16 }}
                    >
                      <Col flex="150px">
                        <strong>
                          {m.title}
                          {isCompanyCode && (
                            <Tag color="volcano" style={{ marginLeft: 8 }}>
                              Auto-SKU
                            </Tag>
                          )}
                          :
                        </strong>
                      </Col>
                      <Col flex="1">
                        <Input
                          placeholder={
                            isCompanyCode
                              ? "Required for auto Product Code (e.g. 2024, ABC123)"
                              : ""
                          }
                          value={value}
                          onChange={(e) =>
                            handleMetaChange(m.id, e.target.value)
                          }
                          status={isCompanyCode && !value.trim() ? "error" : ""}
                        />
                      </Col>
                      {!isCompanyCode && (
                        <Col>
                          <Button
                            danger
                            size="small"
                            onClick={() =>
                              setMetaData((prev) => {
                                const { [m.id]: _, ...rest } = prev;
                                return rest;
                              })
                            }
                          >
                            Remove
                          </Button>
                        </Col>
                      )}
                    </Row>
                  );
                })}

              {/* Add other specifications */}
              {productMetaData.filter(
                (m) => m.id !== COMPANY_CODE_META_ID && !(m.id in metaData)
              ).length > 0 && (
                <Select
                  placeholder="Add another specification..."
                  style={{ width: "100%", marginTop: 16 }}
                  onChange={(id) =>
                    setMetaData((prev) => ({ ...prev, [id]: "" }))
                  }
                  allowClear
                >
                  {productMetaData
                    .filter(
                      (m) =>
                        m.id !== COMPANY_CODE_META_ID && !(m.id in metaData)
                    )
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
  );
};

export default CreateProduct;
