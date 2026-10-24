import ModalShell from '../../components/Common/ModalShell';
import './CreateProduct.styles.css';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useReplaceAllKeywordsForProductMutation,
} from '../../api/productApi';

import {
  ArrowLeftOutlined,
  PictureOutlined,
  PlusCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';

import { useGetAllCategoriesQuery } from '../../api/categoryApi';
import { useGetAllBrandsQuery } from '../../api/brandsApi';
import { useGetVendorsQuery } from '../../api/vendorApi';
import { useGetAllProductMetaQuery } from '../../api/productMetaApi';
import { useGetBrandParentCategoriesQuery } from '../../api/brandParentCategoryApi';
import { useGetAllKeywordsQuery, useCreateKeywordMutation } from '../../api/keywordApi';

import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Collapse,
  Tag,
  Space,
  Typography,
} from 'antd';

import { useGetAllProductsQuery } from '../../api/productApi';

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Text } = Typography;

// Meta Field IDs
const COMPANY_CODE_META_ID = 'd11da9f9-3f2e-4536-8236-9671200cca4a';
const SELLING_PRICE_META_ID = '9ba862ef-f993-4873-95ef-1fef10036aa5';

const CreateProduct = ({ initialData, isBulkMode = false, onUpdate }) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(productId) && !isBulkMode;

  const [form] = Form.useForm();
  const categoryId = Form.useWatch('categoryId', form);

  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [metaData, setMetaData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // RTK Queries
  const { data: existingProduct } = useGetProductByIdQuery(productId, {
    skip: !isEditMode,
  });

  const [replaceAllKeywordsForProduct] = useReplaceAllKeywordsForProductMutation();

  const { data: categoryData = { categories: [] } } = useGetAllCategoriesQuery();
  const { data: brands = [] } = useGetAllBrandsQuery();
  const { data: vendors = [] } = useGetVendorsQuery();
  const { data: brandParentCategories = [] } = useGetBrandParentCategoriesQuery();
  const { data: productMetas = [] } = useGetAllProductMetaQuery();

  const { data: allProductsResponse } = useGetAllProductsQuery(
    { limit: 5000 },
    { skip: !isEditMode || isBulkMode },
  );

  const allProducts = useMemo(
    () => (Array.isArray(allProductsResponse?.data) ? allProductsResponse.data : []),
    [allProductsResponse?.data],
  );

  const { data: keywordList = [] } = useGetAllKeywordsQuery();
  const allKeywords = Array.isArray(keywordList) ? keywordList : [];

  const [createKeyword] = useCreateKeywordMutation();

  const categories = categoryData.categories || [];
  const brandData = Array.isArray(brands) ? brands : [];
  const vendorData = Array.isArray(vendors) ? vendors : [];
  const productMetaData = Array.isArray(productMetas) ? productMetas : [];
  const brandParentCategoryData = Array.isArray(brandParentCategories) ? brandParentCategories : [];

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  // Default values for NEW product
  useEffect(() => {
    if (isEditMode || isBulkMode) return;

    form.setFieldsValue({
      isMaster: 'true',
      isFeatured: 'false',
      status: 'active',
    });
  }, [form, isEditMode, isBulkMode]);

  // BULK MODE: Pre-fill from CSV
  useEffect(() => {
    if (!initialData || isEditMode) return;

    form.setFieldsValue({
      name: initialData.name || '',
      product_code: initialData.product_code || '',
      description: initialData.description || '',
      quantity: initialData.quantity || 0,
      tax: initialData.tax ?? null,
      alert_quantity: initialData.alert_quantity ?? null,
      status: initialData.status || 'active',
      discountType: initialData.discountType,
      isFeatured: initialData.isFeatured ? 'true' : 'false',
      isMaster: initialData.isMaster ? 'true' : 'false',
      categoryId: initialData.categoryId,
      brandId: initialData.brandId,
      vendorId: initialData.vendorId,
      brand_parentcategoriesId: initialData.brand_parentcategoriesId,
    });

    if (Array.isArray(initialData.images) && initialData.images.length > 0) {
      setExistingImages(initialData.images.slice(0, 5));
    }

    if (initialData.meta && typeof initialData.meta === 'object') {
      const resolved = {};
      Object.entries(initialData.meta).forEach(([key, value]) => {
        const metaDef = productMetaData.find(
          (m) => m.slug === key || m.title.toLowerCase().replace(/\s+/g, '') === key.toLowerCase(),
        );
        if (metaDef) resolved[metaDef.id] = value;
      });
      setMetaData(resolved);
    }

    if (Array.isArray(initialData.keywords)) {
      const fakeKeywords = initialData.keywords.map((kw, i) => ({
        id: `bulk-${i}`,
        keyword: kw,
        categories: { name: 'Imported' },
      }));
      setSelectedKeywords(fakeKeywords);
    }

    if (initialData.variantOptions && typeof initialData.variantOptions === 'object') {
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

  // EDIT MODE: Load existing product
  useEffect(() => {
    if (!existingProduct || !isEditMode) return;

    const formValues = {
      name: existingProduct.name || '',
      product_code: existingProduct.product_code || '',
      quantity: existingProduct.quantity || 0,
      isFeatured: existingProduct.isFeatured ? 'true' : 'false',
      description: existingProduct.description || '',
      tax: existingProduct.tax || null,
      alert_quantity: existingProduct.alert_quantity || null,
      status: existingProduct.status || 'active',
      discountType: existingProduct.discountType || undefined,
      isMaster: existingProduct.isMaster ? 'true' : 'false',
      masterProductId: existingProduct.masterProductId || undefined,
      variantKey: existingProduct.variantKey || '',
      skuSuffix: existingProduct.skuSuffix || '',
      categoryId: existingProduct.categoryId || undefined,
      brandId: existingProduct.brandId || undefined,
      vendorId: existingProduct.vendorId || undefined,
      brand_parentcategoriesId: existingProduct.brand_parentcategoriesId || undefined,
    };

    form.setFieldsValue(formValues);

    // Load Images
    let imagesArray = [];
    try {
      imagesArray =
        typeof existingProduct.images === 'string'
          ? JSON.parse(existingProduct.images)
          : Array.isArray(existingProduct.images)
            ? existingProduct.images
            : [];
    } catch (e) {}
    setExistingImages(Array.isArray(imagesArray) ? imagesArray : []);

    // Load Meta Data (including Selling Price)
    let metaObj = {};
    try {
      if (typeof existingProduct.meta === 'string') {
        metaObj = JSON.parse(existingProduct.meta);
      } else if (existingProduct.meta && typeof existingProduct.meta === 'object') {
        metaObj = existingProduct.meta;
      }
      setMetaData(metaObj);
    } catch (e) {
      toast.error('Failed to load specifications');
    }

    // Load Keywords
    if (existingProduct.keywords) {
      try {
        const keywords =
          typeof existingProduct.keywords === 'string'
            ? JSON.parse(existingProduct.keywords)
            : existingProduct.keywords;

        const normalized = (Array.isArray(keywords) ? keywords : []).map((kw) => ({
          id: kw.id,
          keyword: kw.keyword,
          categories: kw.categories || kw.category || null,
        }));
        setSelectedKeywords(normalized);
      } catch (e) {}
    }

    // Load Variant Options
    if (existingProduct.variantOptions) {
      try {
        const opts =
          typeof existingProduct.variantOptions === 'string'
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
  }, [existingProduct, form, isEditMode]);

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
      toast.warning('Please select a category first');
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
          name: categories.find((c) => c.categoryId === categoryId)?.name || 'Unknown',
        },
      };

      setSelectedKeywords((prev) => [...prev, newKeyword]);
      setSearchKeyword('');
      toast.success(`"${trimmed}" created and added!`);

      if (isEditMode && productId) {
        try {
          await replaceAllKeywordsForProduct({
            productId,
            keywordIds: [...selectedKeywords.map((k) => k.id), newKeyword.id],
          }).unwrap();
        } catch (err) {}
      }
    } catch (err) {
      toast.error('Failed to create keyword');
    }
  };

  const updateVariantOptionsFromList = useCallback(() => {
    const attributes = form.getFieldValue('variantAttributes') || [];
    const jsonObj = {};

    attributes.forEach((attr) => {
      const cleanKey = String(attr?.key ?? '').trim();
      const cleanValue = String(attr?.value ?? '').trim();
      if (cleanKey && cleanValue) jsonObj[cleanKey] = cleanValue;
    });

    form.setFieldsValue({
      variantOptions: Object.keys(jsonObj).length > 0 ? JSON.stringify(jsonObj, null, 2) : '',
    });
  }, [form]);

  useEffect(() => {
    const timer = setTimeout(updateVariantOptionsFromList, 300);
    return () => clearTimeout(timer);
  }, [form.getFieldValue('variantAttributes'), updateVariantOptionsFromList]);

  const handleMetaChange = (id, value) => {
    setMetaData((prev) => ({ ...prev, [id]: value }));
  };

  const onDrop = useCallback(
    (accepted, rejected) => {
      if (rejected.length > 0) {
        rejected.forEach(({ file, errors }) => {
          if (errors[0]?.code === 'file-too-large') toast.warning(`${file.name} > 5MB`);
          if (errors[0]?.code === 'file-invalid-type') toast.warning(`${file.name} not image`);
        });
        return;
      }

      if (existingImages.length + newImages.length + accepted.length > 5) {
        toast.warning('Maximum 5 images allowed');
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
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024,
    onDrop,
  });

  // Paste image support
  useEffect(() => {
    const handlePaste = async (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file && file.size <= 5 * 1024 * 1024) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        if (existingImages.length + newImages.length + pastedFiles.length > 5) {
          toast.warning('Maximum 5 images allowed');
          return;
        }

        const mapped = pastedFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));

        setNewImages((prev) => [...prev, ...mapped]);
        toast.success(`${pastedFiles.length} image(s) pasted successfully!`);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [existingImages.length, newImages.length]);

  const removeExistingImage = (url) => {
    setExistingImages((p) => p.filter((i) => i !== url));
    setImagesToDelete((p) => [...p, url]);
  };

  const removeNewImage = (preview) => {
    setNewImages((p) => {
      const filtered = p.filter((i) => i.preview !== preview);
      p.filter((i) => i.preview === preview).forEach((i) => URL.revokeObjectURL(i.preview));
      return filtered;
    });
  };

  const onFinish = async (values) => {
    const required = ['name', 'quantity'];
    if (required.some((f) => !values[f])) {
      toast.warning('Please fill all required fields');
      return;
    }

    // Validate number meta fields
    for (const [id, val] of Object.entries(metaData)) {
      const m = productMetaData.find((x) => x.id === id);
      if (m?.fieldType === 'number' && val !== '' && isNaN(val)) {
        toast.error(`${m.title} must be a number`);
        return;
      }
    }

    const formData = new FormData();

    const fields = [
      'name',
      'product_code',
      'description',
      'status',
      'discountType',
      'isMaster',
      'masterProductId',
      'variantKey',
      'skuSuffix',
    ];

    fields.forEach((k) => {
      if (values[k] !== undefined && values[k] !== null && values[k] !== '') {
        formData.append(k, values[k]);
      }
    });

    formData.append('quantity', Number(values.quantity) || 0);
    formData.append('isFeatured', values.isFeatured === 'true');

    if (values.tax !== undefined) formData.append('tax', Number(values.tax) || 0);
    if (values.alert_quantity !== undefined)
      formData.append('alert_quantity', Number(values.alert_quantity) || 0);

    ['categoryId', 'brandId', 'vendorId', 'brand_parentcategoriesId'].forEach((k) => {
      if (values[k]) formData.append(k, values[k]);
    });

    // Handle Variant Options
    if (values.variantOptions) {
      try {
        const json = JSON.parse(values.variantOptions);
        formData.append('variantOptions', JSON.stringify(json));
      } catch (e) {
        toast.error('Invalid JSON in Variant Options');
        return;
      }
    }

    // Attach all meta data (including Selling Price)
    if (Object.keys(metaData).length > 0) {
      formData.append('meta', JSON.stringify(metaData));
    }

    // Images
    newImages.forEach((img) => formData.append('images', img.file));

    if (isEditMode && imagesToDelete.length > 0) {
      formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
    }

    try {
      let finalProductId;

      if (isEditMode) {
        await updateProduct({ productId, formData }).unwrap();
        finalProductId = productId;
      } else {
        const result = await createProduct(formData).unwrap();
        finalProductId = result.product?.productId || result.productId || result.id;
        if (!finalProductId) throw new Error('No product ID returned');
      }

      // Update Keywords
      const keywordIds = selectedKeywords.map((k) => k.id).filter(Boolean);
      if (keywordIds.length > 0) {
        await replaceAllKeywordsForProduct({
          productId: finalProductId,
          keywordIds,
        }).unwrap();
      }

      toast.success(
        isEditMode ? 'Product updated successfully!' : 'Product created successfully!',
      );

      if (!isEditMode && !isBulkMode) {
        navigate(-1);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save product');
    }
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="page-wrapper">
      <div className="content">
        {!isBulkMode && (
          <Row className="fv2-createproduct-873b095436" justify="space-between" align="middle">
            <h4 className="fv2-createproduct-736702a362">
              {isEditMode ? 'Edit Product' : 'Create New Product'}
            </h4>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </Row>
        )}

        <Form form={form} onFinish={onFinish} layout="vertical" onValuesChange={handleValuesChange}>
          <Collapse
            defaultActiveKey={['1', '2', '3', '4', '5', '6', '7']}
            className="compact-accordion"
          >
            <Panel header={<strong>Basic Information</strong>} key="1">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>

                {/* Selling Price - Now properly saved in meta */}
                <Col xs={24} md={12}>
                  <Form.Item label="Selling Price" required>
                    <InputNumber
                      className="fv2-createproduct-c00fea3153"
                      min={0}
                      step={0.01}

                      value={metaData[SELLING_PRICE_META_ID] ?? ''}
                      onChange={(val) => handleMetaChange(SELLING_PRICE_META_ID, val)}
                      addonAfter="₹"
                      placeholder="Enter selling price"
                    />
                  </Form.Item>
                </Col>

                {/* Company / Batch Code */}
                {productMetaData.some((m) => m.id === COMPANY_CODE_META_ID) && (
                  <Col xs={24} md={12}>
                    <Form.Item label="Company / Batch Code">
                      <Input
                        placeholder="e.g. 2024, ABC123, Q1-26"
                        value={metaData[COMPANY_CODE_META_ID] ?? ''}
                        onChange={(e) => handleMetaChange(COMPANY_CODE_META_ID, e.target.value)}
                      />
                      <div className="fv2-createproduct-7bc4b05752">
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
                  <Form.Item name="brand_parentcategoriesId" label="Parent Category">
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
                  <Form.Item name="status" label="Status" rules={[{ required: true }]}>
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
                  <InboxOutlined className="fv2-createproduct-87f070343e" /> Variant Settings
                </>
              }
              key="2"
            >
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item name="isMaster" label="Product Type" initialValue="false">
                    <Select>
                      <Option value="true">Master Product (has variants)</Option>
                      <Option value="false">Variant (belongs to master)</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.isMaster !== curr.isMaster}>
                  {({ getFieldValue }) => {
                    const isMaster = getFieldValue('isMaster') === 'true';
                    if (isMaster) return null;

                    return (
                      <Col xs={24} sm={16}>
                        <Form.Item
                          name="masterProductId"
                          label="Select Master Product"
                          rules={[
                            {
                              required: true,
                              message: 'Please select master product',
                            },
                          ]}
                        >
                          <Select
                            showSearch
                            placeholder="Search master products..."
                            optionFilterProp="children"
                          >
                            {allProducts
                              .filter((p) => p.isVariant === false || p.isVariant === null)
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

                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.isMaster !== curr.isMaster}>
                  {({ getFieldValue }) => {
                    const isMaster = getFieldValue('isMaster') === 'true';
                    if (isMaster) return null;

                    return (
                      <Col xs={24} md={12}>
                        <Form.Item label="Variant Attributes (Dynamic)">
                          <Form.List name="variantAttributes">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...restField }) => (
                                  <Space
                                    className="fv2-createproduct-f28800b7d4"
                                    key={key}

                                    align="baseline"
                                  >
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'key']}
                                      rules={[
                                        {
                                          required: true,
                                          message: 'Attribute name required',
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input placeholder="Attribute (e.g. Color, Size, Material)" />
                                    </Form.Item>

                                    <Form.Item
                                      {...restField}
                                      name={[name, 'value']}
                                      rules={[
                                        {
                                          required: true,
                                          message: 'Value required',
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
                                  className="fv2-createproduct-cf58f3a45e"
                                  type="dashed"
                                  onClick={() => add()}
                                  block
                                  icon={<PlusCircleOutlined />}
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
                  <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
                    <InputNumber className="fv2-createproduct-c00fea3153" min={0} />
                  </Form.Item>
                </Col>
                <Col xs={8}>
                  <Form.Item name="alert_quantity" label="Low Stock Alert">
                    <InputNumber className="fv2-createproduct-c00fea3153" min={0} />
                  </Form.Item>
                </Col>
                <Col xs={8}>
                  <Form.Item name="tax" label="Tax (%)">
                    <InputNumber
                      className="fv2-createproduct-c00fea3153"
                      min={0}
                      max={100}
                      step={0.01}
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
                  border: '2px dashed #d9d9d9',
                  padding: 32,
                  textAlign: 'center',
                  borderRadius: 8,
                  background: isDragActive ? '#e6f7ff' : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input {...getInputProps()} />
                <PictureOutlined className="fv2-createproduct-873b095436" size={48} color="#999" />
                <p className="fv2-createproduct-9e51b98a84">
                  <strong>Click to upload</strong> or drag & drop
                </p>
                <p className="fv2-createproduct-4ef63ef74c">
                  You can also <strong>paste images</strong> from clipboard (Ctrl+V)
                </p>
                <p className="fv2-createproduct-6ecc7c3c2a">
                  Max 5 images • Up to 5MB each • JPG, PNG, WEBP
                </p>
              </div>

              <Row className="fv2-createproduct-8cb224dbf6" gutter={[12, 12]}>
                {existingImages.map((url) => (
                  <Col key={url}>
                    <div className="fv2-createproduct-7810b5012a">
                      <img
                        className="fv2-createproduct-4b07984eac"
                        src={url}
                        alt=""

                        onClick={() => setSelectedImage(url)}
                      />
                      <Button
                        className="fv2-createproduct-345a3215c6"
                        danger
                        size="small"

                        onClick={() => removeExistingImage(url)}
                      >
                        ×
                      </Button>
                    </div>
                  </Col>
                ))}

                {newImages.map((img) => (
                  <Col key={img.preview}>
                    <div className="fv2-createproduct-7810b5012a">
                      <img
                        className="fv2-createproduct-4b07984eac"
                        src={img.preview}
                        alt=""

                        onClick={() => setSelectedImage(img.preview)}
                      />
                      <Button
                        className="fv2-createproduct-345a3215c6"
                        danger
                        size="small"

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
            <Panel header={<>Keywords & Tags ({selectedKeywords.length})</>} key="7">
              <Space className="fv2-createproduct-c00fea3153" direction="vertical">
                <Select
                  className="fv2-createproduct-c00fea3153"
                  mode="multiple"
                  allowClear
                  showSearch
                  filterOption={false} // ← THIS IS THE KEY FIX

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
                      ...selectedKeywords.filter((k) => selectedIds.includes(k.id)),
                      ...newlySelected,
                    ];
                    setSelectedKeywords(updated);
                  }}
                  optionLabelProp="label"
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {searchKeyword?.trim() &&
                        !allKeywords.some(
                          (kw) => kw.keyword.toLowerCase() === searchKeyword.trim().toLowerCase(),
                        ) && (
                          <div className="fv2-createproduct-145290582a">
                            <Button
                              className="fv2-createproduct-02f2bdbda4"
                              type="text"
                              size="small"
                              icon={<PlusCircleOutlined />}
                              onMouseDown={(e) => e.preventDefault()} // Important!
                              onClick={() => handleCreateKeyword(searchKeyword.trim())}
                            >
                              <div>
                                <strong>Add new:</strong> "{searchKeyword.trim()}"
                                <div className="fv2-createproduct-1c8fd882c5">
                                  Category:{' '}
                                  <strong>
                                    {categoryId
                                      ? categories.find((c) => c.categoryId === categoryId)?.name ||
                                        'Selected Category'
                                      : 'Select a category first'}
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
                    .filter((kw) => kw.keyword.toLowerCase().includes(searchKeyword.toLowerCase()))
                    .map((kw) => (
                      <Option key={kw.id} value={kw.id} label={kw.keyword}>
                        <Space>
                          <span>{kw.keyword}</span>
                          {kw.categories && (
                            <Tag className="fv2-createproduct-f6367538d2" color="blue">
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
                        setSelectedKeywords((prev) => prev.filter((k) => k.id !== kw.id))
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
            <Panel header={<>Product Specifications ({Object.keys(metaData).length})</>} key="6">
              <Space className="fv2-createproduct-c00fea3153" direction="vertical" size="middle">
                {Object.entries(metaData)
                  .filter(([id]) => id !== COMPANY_CODE_META_ID)
                  .map(([id, value]) => {
                    const meta = productMetaData.find((m) => m.id === id);
                    if (!meta) return null;

                    const isNumber = meta.fieldType === 'number';

                    return (
                      <Row key={id} gutter={16} align="middle">
                        <Col flex="200px">
                          <Text strong>
                            {meta.title}{' '}
                            {meta.unit && (
                              <span className="fv2-createproduct-3212741c8f">({meta.unit})</span>
                            )}
                          </Text>
                        </Col>
                        <Col flex="1">
                          {isNumber ? (
                            <InputNumber
                              className="fv2-createproduct-c00fea3153"

                              value={value || null}
                              onChange={(val) => handleMetaChange(id, val)}
                              placeholder={`Enter ${meta.title.toLowerCase()}`}
                              min={meta.min || undefined}
                              max={meta.max || undefined}
                              step={meta.step || 1}
                            />
                          ) : (
                            <Input
                              value={value || ''}
                              onChange={(e) => handleMetaChange(id, e.target.value)}
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

                {productMetaData.filter((m) => m.id !== COMPANY_CODE_META_ID && !(m.id in metaData))
                  .length > 0 && (
                  <Select
                    className="fv2-createproduct-a8d103ee42"
                    placeholder="Add another specification..."

                    onChange={(id) => setMetaData((prev) => ({ ...prev, [id]: '' }))}
                    allowClear
                    dropdownMatchSelectWidth={false}
                  >
                    {productMetaData
                      .filter((m) => m.id !== COMPANY_CODE_META_ID && !(m.id in metaData))
                      .map((m) => (
                        <Option key={m.id} value={m.id}>
                          {m.title} {m.unit && `(${m.unit})`}
                        </Option>
                      ))}
                  </Select>
                )}

                {Object.keys(metaData).length === 1 && metaData[COMPANY_CODE_META_ID] && (
                  <Text type="secondary">No additional specifications available to add.</Text>
                )}
              </Space>
            </Panel>
          </Collapse>

          {!isBulkMode && (
            <Button
              className="fv2-createproduct-6b010f626b"
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isCreating || isUpdating}
            >
              {isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          )}
        </Form>

        <ModalShell
          open={!!selectedImage}
          footer={null}
          onCancel={() => setSelectedImage(null)}
          width={800}
        >
          <img className="fv2-createproduct-e1f3595ecc" src={selectedImage} alt="Zoom" />
        </ModalShell>
      </div>
    </div>
  );
};

export default CreateProduct;
