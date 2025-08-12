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
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetProfileQuery } from "../../api/userApi"; // Added to fetch user_id
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useGetAllProductMetaQuery } from "../../api/productMetaApi";
import { useGetBrandParentCategoriesQuery } from "../../api/brandParentCategoryApi";
const CreateProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);
  const [newImages, setNewImages] = useState([]); // { file, preview }
  const [existingImages, setExistingImages] = useState([]); // Image URLs
  const [imagesToDelete, setImagesToDelete] = useState([]); // Images to delete
  const [metaData, setMetaData] = useState({}); // Meta key-value pairs

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

  const [formData, setFormData] = useState(initialFormData);

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating, error }] =
    useUpdateProductMutation();

  // Pre-fill form and images in edit mode
  useEffect(() => {
    if (existingProduct) {
      setFormData({
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
      });
      setExistingImages(existingProduct.images || []);
      setMetaData(existingProduct.meta || {});
    }
  }, [existingProduct]);

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [newImages]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      name: formData.name,
      product_code: formData.product_code,
      quantity: formData.quantity,
      productType: formData.productType,
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

    // Validate meta data
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
    formDataToSend.append("name", formData.name);
    formDataToSend.append("product_code", formData.product_code);
    formDataToSend.append("quantity", Number(formData.quantity) || 0);
    formDataToSend.append("productType", formData.productType);
    formDataToSend.append("isFeatured", formData.isFeatured === "true");
    formDataToSend.append("description", formData.description);
    formDataToSend.append("tax", formData.tax ? Number(formData.tax) : "");
    formDataToSend.append(
      "alert_quantity",
      Number(formData.alert_quantity) || 0
    );
    formDataToSend.append("userId", userId || "");
    if (formData.categoryId)
      formDataToSend.append("categoryId", formData.categoryId);
    if (formData.brandId) formDataToSend.append("brandId", formData.brandId);
    if (formData.vendorId) formDataToSend.append("vendorId", formData.vendorId);
    if (formData.brand_parentcategoriesId)
      formDataToSend.append(
        "brand_parentcategoriesId",
        formData.brand_parentcategoriesId
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
        toast.success("Product updated successfully");
        navigate("/inventory/products");
      } else {
        await createProduct(formDataToSend).unwrap();
        toast.success("Product created successfully");
        setFormData(initialFormData);
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
    return <p className="text-center">Loading product details...</p>;
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex align-items-center">
            <div className="page-title">
              <h4 className="fw-bold">
                {isEditMode ? "Edit Product" : "Create Product"}
              </h4>
              <p className="mb-0">
                {isEditMode ? "Update product details" : "Create a new product"}
              </p>
            </div>
          </div>
          <div className="page-btn">
            <a href="/inventory/products" className="btn btn-secondary">
              <FaArrowLeft className="me-2" /> Back to Products
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form row g-4">
          {error && <div className="alert alert-danger">{error.message}</div>}

          {/* Product Information Section */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title d-flex align-items-center">
                  <GiFeatherWound className="text-primary me-2" />
                  Product Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Product Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Product Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="product_code"
                        value={formData.product_code}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Product Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        name="productType"
                        value={formData.productType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Product Type</option>
                        <option value="tiles">Tiles</option>
                        <option value="sanitary">Sanitary</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-control"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">Brand</label>
                      <select
                        className="form-control"
                        name="brandId"
                        value={formData.brandId}
                        onChange={handleChange}
                      >
                        <option value="">Select Brand</option>
                        {brandData.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.brandName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">Vendor</label>
                      <select
                        className="form-control"
                        name="vendorId"
                        value={formData.vendorId}
                        onChange={handleChange}
                      >
                        <option value="">Select Vendor</option>
                        {vendorData.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.vendorName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Brand Parent Category
                      </label>
                      <select
                        className="form-control"
                        name="brand_parentcategoriesId"
                        value={formData.brand_parentcategoriesId}
                        onChange={handleChange}
                      >
                        <option value="">Select Brand Parent Category</option>
                        {brandParentCategoryData.map((bpc) => (
                          <option key={bpc.id} value={bpc.id}>
                            {bpc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Is Featured? <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        name="isFeatured"
                        value={formData.isFeatured}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Maximum 60 words"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Stocks Section */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title d-flex align-items-center">
                  <FiLifeBuoy className="text-primary me-2" />
                  Pricing & Stocks
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Quantity <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label className="form-label">Alert Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        name="alert_quantity"
                        value={formData.alert_quantity}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label className="form-label">Tax (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="tax"
                        value={formData.tax}
                        onChange={handleChange}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meta Data Section */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title d-flex align-items-center">
                  <FiLifeBuoy className="text-primary me-2" />
                  Meta Data
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {productMetaData.map((meta) => (
                    <div key={meta.id} className="col-md-6 col-12">
                      <div className="form-group">
                        <label className="form-label">
                          {meta.title}{" "}
                          {meta.unit && <small>({meta.unit})</small>}
                        </label>
                        <input
                          type={meta.fieldType === "number" ? "number" : "text"}
                          className="form-control"
                          value={metaData[meta.id] || ""}
                          onChange={(e) =>
                            handleMetaChange(meta.id, e.target.value)
                          }
                          placeholder={`Enter ${meta.title}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title d-flex align-items-center">
                  <FiImage className="text-primary me-2" />
                  Images
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Upload Images</label>
                      <div
                        {...getRootProps()}
                        className={`image-upload border rounded p-4 text-center ${
                          isDragActive ? "bg-light" : ""
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <input {...getInputProps()} />
                        {isDragActive ? (
                          <p>Drop the images here...</p>
                        ) : (
                          <div>
                            <FiPlusCircle
                              className="text-muted mb-2"
                              size={24}
                            />
                            <p className="mb-0">
                              Drag & drop images or click to upload
                            </p>
                          </div>
                        )}
                      </div>
                      <small className="form-text text-muted">
                        Upload up to 5 images (JPEG, PNG, GIF, max 5MB each).
                      </small>
                      <div className="image-preview-container row g-2 mt-2">
                        {existingImages.map((image, index) => (
                          <div
                            key={`existing-${index}`}
                            className="col-md-3 col-6 position-relative"
                          >
                            <img
                              src={image}
                              alt="Existing product"
                              className="img-fluid rounded"
                              style={{
                                width: "100%",
                                height: "100px",
                                objectFit: "cover",
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm position-absolute"
                              style={{ top: "5px", right: "5px" }}
                              onClick={() => handleDeleteImage(image)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {newImages.map((image, index) => (
                          <div
                            key={`new-${index}`}
                            className="col-md-3 col-6 position-relative"
                          >
                            <img
                              src={image.preview}
                              alt="New upload"
                              className="img-fluid rounded"
                              style={{
                                width: "100%",
                                height: "100px",
                                objectFit: "cover",
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm position-absolute"
                              style={{ top: "5px", right: "5px" }}
                              onClick={() =>
                                handleDeleteNewImage(image.preview)
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="col-12">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? "Saving..."
                : isEditMode
                ? "Update Product"
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
