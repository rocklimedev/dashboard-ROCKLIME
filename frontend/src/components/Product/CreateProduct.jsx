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

const CreateProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [newImages, setNewImages] = useState([]); // { file, preview }
  const [existingImages, setExistingImages] = useState([]); // Image URLs
  const [imagesToDelete, setImagesToDelete] = useState([]); // Images to delete

  // Fetch product, categories, parent categories, brands, and user
  const { data: existingProduct, isLoading: isFetching } =
    useGetProductByIdQuery(productId, { skip: !isEditMode });
  const {
    data: categoryData = { categories: [] },
    isLoading: isCategoryLoading,
  } = useGetAllCategoriesQuery();
  const { data: parentCategories, isLoading: isParentCategoryLoading } =
    useGetAllParentCategoriesQuery();
  const { data: brands, isLoading: isBrandLoading } = useGetAllBrandsQuery();
  const { data: user, isLoading: isUserLoading } = useGetProfileQuery(); // Fetch user for user_id

  const parentCategoryData = Array.isArray(parentCategories?.data)
    ? parentCategories.data
    : [];
  const brandData = Array.isArray(brands) ? brands : [];
  const userId = user?.user?.userId; // Get user_id from profile

  const initialFormData = {
    name: "",
    productSegment: "",
    productGroup: "",
    product_code: "",
    company_code: "",
    sellingPrice: "",
    purchasingPrice: "",
    category: "",
    parentCategory: "",
    brand: "",
    isFeatured: "",
    description: "",
    quantity: "",
    alertQuantity: "",
    tax: "",
    discountType: "", // Added for schema
    barcode: "", // Added for schema
  };

  const [formData, setFormData] = useState(initialFormData);

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating, error }] =
    useUpdateProductMutation();

  // Pre-fill form and images in edit mode
  useEffect(() => {
    if (existingProduct && categoryData?.categories) {
      const selectedCategory = categoryData.categories.find(
        (cat) => cat.categoryId === existingProduct.categoryId
      );
      const parentCategoryId = selectedCategory?.parentCategoryId || "";

      if (!parentCategoryId && selectedCategory) {
        console.warn(
          `Category '${selectedCategory.name}' (ID: ${selectedCategory.categoryId}) has no valid parentCategoryId.`
        );
      }

      const matchingCategories = categoryData.categories.filter(
        (cat) => cat.parentCategoryId === parentCategoryId
      );
      setFilteredCategories(matchingCategories);

      setFormData({
        name: existingProduct.name || "",
        productSegment: existingProduct.product_segment || "",
        productGroup: existingProduct.productGroup || "",
        product_code: existingProduct.product_code || "",
        company_code: existingProduct.company_code || "",
        sellingPrice: existingProduct.sellingPrice || "",
        purchasingPrice: existingProduct.purchasingPrice || "",
        category: existingProduct.categoryId || "",
        parentCategory: parentCategoryId,
        brand: existingProduct.brandId || "",
        isFeatured: existingProduct.isFeatured?.toString() || "false",
        description: existingProduct.description || "",
        quantity: existingProduct.quantity || "",
        alertQuantity: existingProduct.alert_quantity || "",
        tax: existingProduct.tax || "",
        discountType: existingProduct.discountType || "", // Added
        barcode: existingProduct.barcode || "", // Added
      });

      setExistingImages(existingProduct.images || []);
    }
  }, [existingProduct, categoryData, parentCategoryData]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      const selectedCategory = categoryData?.categories?.find(
        (cat) => cat.categoryId === value
      );
      const parentCategoryId = selectedCategory?.parentCategoryId || "";

      if (!parentCategoryId && selectedCategory) {
        console.warn(
          `Category '${selectedCategory.name}' (ID: ${selectedCategory.categoryId}) has no valid parentCategoryId.`
        );
      }

      const matchingCategories = categoryData?.categories?.filter(
        (cat) => cat.parentCategoryId === parentCategoryId
      );
      setFilteredCategories(matchingCategories || []);

      setFormData((prev) => ({
        ...prev,
        category: value,
        parentCategory: parentCategoryId,
      }));
      return;
    }

    if (name === "parentCategory") {
      const matchingCategories = categoryData?.categories?.filter(
        (cat) => cat.parentCategoryId === value
      );
      setFilteredCategories(matchingCategories || []);

      setFormData((prev) => ({
        ...prev,
        parentCategory: value,
        category: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [newImages]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      name: formData.name,
      productGroup: formData.productGroup,
      product_code: formData.product_code,
      company_code: formData.company_code,
      sellingPrice: formData.sellingPrice,
      purchasingPrice: formData.purchasingPrice,
      category: formData.category,
      brand: formData.brand,
      isFeatured: formData.isFeatured,
      quantity: formData.quantity,
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

    if (formData.category) {
      const selectedCategory = categoryData?.categories?.find(
        (cat) => cat.categoryId === formData.category
      );
      if (!selectedCategory) {
        toast.error("Selected category is invalid.");
        return;
      }
      if (!selectedCategory?.parentCategoryId) {
        console.warn(
          `Submitting with category '${selectedCategory.name}' (ID: ${selectedCategory.categoryId}) that has no valid parentCategoryId.`
        );
      }
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("product_segment", formData.productSegment);
    formDataToSend.append("productGroup", formData.productGroup);
    formDataToSend.append("product_code", formData.product_code);
    formDataToSend.append("company_code", formData.company_code);
    formDataToSend.append(
      "sellingPrice",
      formData.sellingPrice.replace(/,/g, "")
    );
    formDataToSend.append(
      "purchasingPrice",
      formData.purchasingPrice.replace(/,/g, "")
    );
    formDataToSend.append("categoryId", formData.category);
    formDataToSend.append("brandId", formData.brand);
    formDataToSend.append("isFeatured", formData.isFeatured === "true");
    formDataToSend.append("description", formData.description);
    formDataToSend.append("quantity", Number(formData.quantity) || 0);
    formDataToSend.append(
      "alert_quantity",
      Number(formData.alertQuantity) || 0
    );
    formDataToSend.append("tax", formData.tax ? Number(formData.tax) : "");
    formDataToSend.append("discountType", formData.discountType || "");
    formDataToSend.append("barcode", formData.barcode || "");
    formDataToSend.append("user_id", userId || "");

    newImages.forEach((image) => {
      formDataToSend.append("images", image.file);
    });

    if (isEditMode && imagesToDelete.length > 0) {
      formDataToSend.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    try {
      if (isEditMode) {
        await updateProduct({ productId, formData: formDataToSend }).unwrap();
        toast.success("Product updated successfully!");
        navigate("/inventory/products");
      } else {
        await createProduct(formDataToSend).unwrap();
        toast.success("Product created successfully!");
        setFormData(initialFormData);
        setFilteredCategories([]);
        setNewImages([]);
        navigate("/inventory/products");
      }
    } catch (error) {
      const message =
        error.data?.message || "Something went wrong while saving the product.";
      if (
        message.includes("product_code") ||
        message.includes("company_code") ||
        message.includes("barcode")
      ) {
        toast.error(`Error: ${message} (must be unique)`);
      } else {
        toast.error(`Error: ${message}`);
      }
    }
  };

  if (
    isFetching ||
    isCategoryLoading ||
    isParentCategoryLoading ||
    isBrandLoading ||
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
                      <label className="form-label">Product Segment</label>
                      <input
                        type="text"
                        className="form-control"
                        name="productSegment"
                        value={formData.productSegment}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Product Group <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="productGroup"
                        value={formData.productGroup}
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
                        Company Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="company_code"
                        value={formData.company_code}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">Barcode</label>
                      <input
                        type="text"
                        className="form-control"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">Discount Type</label>
                      <select
                        className="form-control"
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleChange}
                      >
                        <option value="">Select Discount Type</option>
                        <option value="percent">Percent</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Category</option>
                        {(formData.parentCategory
                          ? filteredCategories
                          : categoryData?.categories
                        )?.map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Parent Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        name="parentCategory"
                        value={formData.parentCategory}
                        onChange={handleChange}
                        disabled={!!formData.category}
                        required
                      >
                        <option value="">Select Parent Category</option>
                        {parentCategoryData.map((parent) => (
                          <option key={parent.id} value={parent.id}>
                            {parent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Brand <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        required
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
                        Selling Price <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Purchasing Price <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="purchasingPrice"
                        value={formData.purchasingPrice}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
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
                        name="alertQuantity"
                        value={formData.alertQuantity}
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
