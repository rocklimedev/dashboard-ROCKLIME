import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
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
  Card,
  Upload,
  Modal,
  Row,
  Col,
  Spin,
  Alert,
  Space,
} from "antd";

const { Option } = Select;
const { TextArea } = Input;

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

  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];
  const brandData = Array.isArray(brands) ? brands : [];
  const vendorData = Array.isArray(vendors) ? vendors : [];
  const brandParentCategoryData = Array.isArray(brandParentCategories)
    ? brandParentCategories
    : [];
  const productMetaData = Array.isArray(productMetas) ? productMetas : [];
  const userId = user?.user?.userId;

  const initialFormData = {
    name: "",
    product_code: "",
    quantity: "",
    productType: "",
    isFeatured: "false",
    description: "",
    tax: "",
    alert_quantity: "",
    categoryId: "",
    brandId: "",
    vendorId: "",
    brand_parentcategoriesId: "",
  };

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating, error }] =
    useUpdateProductMutation();

  useEffect(() => {
    if (existingProduct) {
      const formValues = {
        name: existingProduct.name || "",
        product_code: existingProduct.product_code || "",
        quantity: existingProduct.quantity || "",
        productType: existingProduct.productType || "",
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

      let imagesArray = [];
      if (existingProduct.images) {
        try {
          imagesArray =
            typeof existingProduct.images === "string"
              ? JSON.parse(existingProduct.images)
              : existingProduct.images;
        } catch (error) {
          imagesArray = [];
        }
      }
      setExistingImages(Array.isArray(imagesArray) ? imagesArray : []);

      let metaObject = {};
      if (existingProduct.meta) {
        try {
          if (typeof existingProduct.meta === "string") {
            metaObject = JSON.parse(existingProduct.meta);
          } else if (Array.isArray(existingProduct.meta)) {
            metaObject = existingProduct.meta.reduce((acc, meta) => {
              acc[meta.id] = meta.value;
              return acc;
            }, {});
          } else {
            metaObject = existingProduct.meta;
          }
        } catch (error) {
          toast.error("Failed to load meta data. Please try again.");
        }
      } else {
        console.warn("No meta field found in existingProduct");
      }
      setMetaData(metaObject);
    } else {
      console.log("No existingProduct data available");
    }
  }, [existingProduct, form]);

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
            toast.warning(`File "${file.file.name}" exceeds 5MB limit.`);
          } else if (file.errors.some((e) => e.code === "file-invalid-type")) {
            toast.warning(`File "${file.file.name}" is not an image.`);
          }
        });
        return;
      }

      if (existingImages.length + newImages.length + acceptedFiles.length > 5) {
        toast.warning("You can upload a maximum of 5 images.");
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
      productType: values.productType,
      userId: userId,
    };

    const emptyFields = Object.entries(requiredFields).filter(
      ([key, value]) => value === "" || value === null || value === undefined
    );

    if (emptyFields.length > 0) {
      toast.warning(
        `Please fill all required fields: ${emptyFields
          .map(([key]) => key)
          .join(", ")}.`
      );
      return;
    }

    for (const metaId of Object.keys(metaData)) {
      const metaField = productMetaData.find((meta) => meta.id === metaId);
      if (!metaField) {
        toast.error(`Invalid ProductMeta ID: ${metaId}`);
        return;
      }
      if (
        metaField.fieldType === "number" &&
        metaData[metaId] !== "" &&
        isNaN(metaData[metaId])
      ) {
        toast.error(`Value for ${metaField.title} must be a number`);
        return;
      }
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", values.name);
    formDataToSend.append("product_code", values.product_code);
    formDataToSend.append("quantity", Number(values.quantity) || 0);
    formDataToSend.append("productType", values.productType);
    formDataToSend.append("isFeatured", values.isFeatured === "true");
    formDataToSend.append("description", values.description);
    formDataToSend.append("tax", values.tax ? Number(values.tax) : "");
    formDataToSend.append("alert_quantity", Number(values.alert_quantity) || 0);
    formDataToSend.append("userId", userId || "");
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
        navigate("/inventory/products");
      } else {
        await createProduct(formDataToSend).unwrap();
        form.resetFields();
        setNewImages([]);
        setMetaData({});
        navigate("/inventory/products");
      }
    } catch (error) {
      const message =
        error.data?.message || "Something went wrong while saving the product.";
      toast.error(`Error: ${message}`);
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

  return (
    <div className="page-wrapper">
      <div className="content">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <h4 style={{ fontWeight: "bold" }}>
                {isEditMode ? "Edit Product" : "Create Product"}
              </h4>
              <p style={{ marginBottom: 0 }}>
                {isEditMode ? "Update product details" : "Create a new product"}
              </p>
            </Col>
            <Col>
              <Button
                href="/inventory/products"
                icon={<FaArrowLeft style={{ marginRight: 8 }} />}
              >
                Back to Products
              </Button>
            </Col>
          </Row>

          <Form
            form={form}
            onFinish={handleSubmit}
            initialValues={initialFormData}
            layout="vertical"
          >
            {error && <Alert message={error.message} type="error" showIcon />}

            {/* Product Information Section */}
            <Card
              title={
                <h5 style={{ display: "flex", alignItems: "center" }}>
                  <GiFeatherWound
                    style={{ color: "#1890ff", marginRight: 8 }}
                  />
                  Product Information
                </h5>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Product Name"
                    name="name"
                    rules={[
                      { required: true, message: "Please enter product name" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Product Code"
                    name="product_code"
                    rules={[
                      { required: true, message: "Please enter product code" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Product Type"
                    name="productType"
                    rules={[
                      { required: true, message: "Please select product type" },
                    ]}
                  >
                    <Select>
                      <Option value="">Select Product Type</Option>
                      <Option value="tiles">Tiles</Option>
                      <Option value="sanitary">Sanitary</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Category" name="categoryId">
                    <Select>
                      <Option value="">Select Category</Option>
                      {categories.map((cat) => (
                        <Option key={cat.categoryId} value={cat.categoryId}>
                          {cat.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Brand" name="brandId">
                    <Select>
                      <Option value="">Select Brand</Option>
                      {brandData.map((brand) => (
                        <Option key={brand.id} value={brand.id}>
                          {brand.brandName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Vendor" name="vendorId">
                    <Select>
                      <Option value="">Select Vendor</Option>
                      {vendorData.map((vendor) => (
                        <Option key={vendor.id} value={vendor.id}>
                          {vendor.vendorName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Brand Parent Category"
                    name="brand_parentcategoriesId"
                  >
                    <Select>
                      <Option value="">Select Brand Parent Category</Option>
                      {brandParentCategoryData.map((bpc) => (
                        <Option key={bpc.id} value={bpc.id}>
                          {bpc.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Is Featured?"
                    name="isFeatured"
                    rules={[
                      { required: true, message: "Please select if featured" },
                    ]}
                  >
                    <Select>
                      <Option value="">Select</Option>
                      <Option value="true">True</Option>
                      <Option value="false">False</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Description" name="description">
                    <TextArea rows={4} placeholder="Maximum 60 words" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Pricing & Stocks Section */}
            <Card
              title={
                <h5 style={{ display: "flex", alignItems: "center" }}>
                  <FiLifeBuoy style={{ color: "#1890ff", marginRight: 8 }} />
                  Pricing & Stocks
                </h5>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Quantity"
                    name="quantity"
                    rules={[
                      { required: true, message: "Please enter quantity" },
                    ]}
                  >
                    <Input type="number" min="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Alert Quantity" name="alert_quantity">
                    <Input type="number" min="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Tax (%)" name="tax">
                    <Input type="number" step="0.01" min="0" max="100" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Meta Data Section */}
            <Card
              title={
                <h5 style={{ display: "flex", alignItems: "center" }}>
                  <FiLifeBuoy style={{ color: "#1890ff", marginRight: 8 }} />
                  Meta Data
                </h5>
              }
            >
              {isProductMetaLoading ? (
                <div style={{ textAlign: "center" }}>
                  <Spin tip="Loading meta fields..." />
                </div>
              ) : productMetaData.length === 0 ? (
                <p style={{ color: "#8c8c8c" }}>No meta fields available.</p>
              ) : (
                <Row gutter={[16, 16]}>
                  {productMetaData.map((meta) => (
                    <Col key={meta.id} xs={24} md={12}>
                      <div>
                        <label style={{ display: "block", marginBottom: 8 }}>
                          {meta.title}{" "}
                          {meta.unit && <small>({meta.unit})</small>}
                        </label>
                        <Input
                          type={meta.fieldType === "number" ? "number" : "text"}
                          value={metaData[meta.id] || ""}
                          onChange={(e) =>
                            handleMetaChange(meta.id, e.target.value)
                          }
                          placeholder={`Enter ${meta.title}`}
                        />
                        {!metaData[meta.id] && metaData[meta.id] !== "" && (
                          <small style={{ color: "#8c8c8c" }}>
                            No value set for {meta.title}
                          </small>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>

            {/* Images Section */}
            <Card
              title={
                <h5 style={{ display: "flex", alignItems: "center" }}>
                  <FiImage style={{ color: "#1890ff", marginRight: 8 }} />
                  Images
                </h5>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8 }}>
                      Upload Images
                    </label>
                    <div
                      {...getRootProps()}
                      style={{
                        border: "1px solid #d9d9d9",
                        borderRadius: 4,
                        padding: 16,
                        textAlign: "center",
                        cursor: "pointer",
                        backgroundColor: isDragActive
                          ? "#fafafa"
                          : "transparent",
                      }}
                    >
                      <input {...getInputProps()} />
                      {isDragActive ? (
                        <p>Drop the images here...</p>
                      ) : (
                        <div>
                          <FiPlusCircle
                            style={{ color: "#8c8c8c", marginBottom: 8 }}
                            size={24}
                          />
                          <p style={{ marginBottom: 0 }}>
                            Drag & drop images or click to upload
                          </p>
                        </div>
                      )}
                    </div>
                    <small
                      style={{
                        color: "#8c8c8c",
                        display: "block",
                        marginTop: 8,
                      }}
                    >
                      Upload up to 5 images (JPEG, PNG, GIF, max 5MB each).
                    </small>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      {existingImages.map((image, index) => (
                        <Col key={`existing-${index}`} xs={12} md={6}>
                          <div style={{ position: "relative" }}>
                            <img
                              src={image}
                              alt="Existing product"
                              style={{
                                width: "100%",
                                height: "100px",
                                objectFit: "contain",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                              onClick={() => handleImageClick(image)}
                            />
                            <Button
                              danger
                              size="small"
                              style={{ position: "absolute", top: 5, right: 5 }}
                              onClick={() => handleDeleteImage(image)}
                            >
                              ×
                            </Button>
                          </div>
                        </Col>
                      ))}
                      {newImages.map((image, index) => (
                        <Col key={`new-${index}`} xs={12} md={6}>
                          <div style={{ position: "relative" }}>
                            <img
                              src={image.preview}
                              alt="New upload"
                              style={{
                                width: "100%",
                                height: "100px",
                                objectFit: "contain",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                              onClick={() => handleImageClick(image.preview)}
                            />
                            <Button
                              danger
                              size="small"
                              style={{ position: "absolute", top: 5, right: 5 }}
                              onClick={() =>
                                handleDeleteNewImage(image.preview)
                              }
                            >
                              ×
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Image Modal */}
            <Modal
              visible={!!selectedImage}
              title="Image Preview"
              onCancel={closeModal}
              footer={[
                <Button key="close" onClick={closeModal}>
                  Close
                </Button>,
              ]}
              width="80%"
            >
              <div style={{ textAlign: "center" }}>
                <img
                  src={selectedImage}
                  alt="Full-size preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              </div>
            </Modal>

            {/* Submit Button */}
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? "Saving..."
                : isEditMode
                ? "Update Product"
                : "Create Product"}
            </Button>
          </Form>
        </Space>
      </div>
    </div>
  );
};

export default CreateProduct;
