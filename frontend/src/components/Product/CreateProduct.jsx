import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
} from "../../api/productApi";
import { GiFeatherWound } from "react-icons/gi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { toast } from "sonner";

const CreateProduct = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [filteredCategories, setFilteredCategories] = useState([]);

  const { data: existingProduct, isLoading: isFetching } =
    useGetProductByIdQuery(id, {
      skip: !isEditMode,
    });
  const {
    data: categoryData = { categories: [] },
    isLoading: isCategoryLoading,
  } = useGetAllCategoriesQuery();
  const { data: parentCategories, isLoading: isParentCategoryLoading } =
    useGetAllParentCategoriesQuery();
  const { data: brands, isLoading: isBrandLoading } = useGetAllBrandsQuery();

  const parentCategoryData = Array.isArray(parentCategories?.data)
    ? parentCategories.data
    : [];
  const brandData = Array.isArray(brands) ? brands : [];

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
  };

  const [formData, setFormData] = useState(initialFormData);

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating, error }] =
    useUpdateProductMutation();

  // Pre-fill form and set filtered categories in edit mode
  useEffect(() => {
    if (existingProduct && categoryData?.categories) {
      const selectedCategory = categoryData.categories.find(
        (cat) => cat.categoryId === existingProduct.category
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
        productSegment: existingProduct.productSegment || "",
        productGroup: existingProduct.productGroup || "",
        product_code: existingProduct.product_code || "",
        company_code: existingProduct.company_code || "",
        sellingPrice: existingProduct.sellingPrice || "",
        purchasingPrice: existingProduct.purchasingPrice || "",
        category: existingProduct.category || "",
        parentCategory: parentCategoryId,
        brand: existingProduct.brand || "",
        isFeatured: existingProduct.isFeatured?.toString() || "",
        description: existingProduct.description || "",
        quantity: existingProduct.quantity || "",
        alertQuantity: existingProduct.alertQuantity || "",
        tax: existingProduct.tax || "",
      });
    }
  }, [existingProduct, categoryData, parentCategoryData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      name: formData.name,
      productSegment: formData.productSegment,
      productGroup: formData.productGroup,
      product_code: formData.product_code,
      company_code: formData.company_code,
      sellingPrice: formData.sellingPrice,
      purchasingPrice: formData.purchasingPrice,
      category: formData.category,
      brand: formData.brand,
      isFeatured: formData.isFeatured,
      description: formData.description,
      quantity: formData.quantity,
      alertQuantity: formData.alertQuantity,
      tax: formData.tax,
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

    const sanitizedData = {
      name: formData.name,
      productSegment: formData.productSegment,
      productGroup: formData.productGroup,
      product_code: formData.product_code,
      company_code: formData.company_code,
      sellingPrice: formData.sellingPrice.replace(/,/g, ""),
      purchasingPrice: formData.purchasingPrice.replace(/,/g, ""),
      categoryId: formData.category,
      brandId: formData.brand,
      isFeatured: formData.isFeatured === "true",
      description: formData.description,
      quantity: Number(formData.quantity) || 0,
      alertQuantity: Number(formData.alertQuantity) || 0,
      tax: formData.tax,
    };

    try {
      if (isEditMode) {
        await updateProduct({ id, ...sanitizedData }).unwrap();
        toast.success("Product updated successfully!");
      } else {
        await createProduct(sanitizedData).unwrap();
        toast.success("Product created successfully!");
        setFormData(initialFormData);
        setFilteredCategories([]);
      }
    } catch (error) {
      toast.error(
        `Error: ${
          error.data?.message ||
          "Something went wrong while saving the product."
        }`
      );
    }
  };

  if (
    isFetching ||
    isCategoryLoading ||
    isParentCategoryLoading ||
    isBrandLoading
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
            <a href="/inventory/list" className="btn btn-secondary">
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
                        Product Segment <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="productSegment"
                        value={formData.productSegment}
                        onChange={handleChange}
                        required
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
                  <div className="col-md-6 col-12">
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
                  <i data-feather="life-buoy" className="text-primary me-2"></i>
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
                      <label className="form-label">
                        Alert Quantity <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="alertQuantity"
                        value={formData.alertQuantity}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4 col-12">
                    <div className="form-group">
                      <label className="form-label">
                        Tax <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        name="tax"
                        value={formData.tax}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Tax</option>
                        <option value="IGST (8%)">IGST (8%)</option>
                        <option value="GST (5%)">GST (5%)</option>
                        <option value="SGST (4%)">SGST (4%)</option>
                        <option value="CGST (16%)">CGST (16%)</option>
                        <option value="GST (18%)">GST (18%)</option>
                      </select>
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
                  <i data-feather="image" className="text-primary me-2"></i>
                  Images
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Upload Images</label>
                      <div className="image-upload">
                        <input type="file" multiple className="form-control" />
                        <div className="image-preview text-center py-4">
                          <i
                            data-feather="plus-circle"
                            className="text-muted"
                          ></i>
                          <p className="mb-0">Add Images</p>
                        </div>
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
