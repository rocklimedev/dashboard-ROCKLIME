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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateProduct = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [filteredCategories, setFilteredCategories] = useState([]);

  const { data: existingProduct, isLoading: isFetching } =
    useGetProductByIdQuery(id, { skip: !isEditMode });
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
    parentCategory: "", // Used only for UI filtering, not sent to backend
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
      console.log("Existing product:", existingProduct);
      console.log("Category data:", categoryData.categories);
      console.log("Parent categories:", parentCategoryData);

      // Find the category to get its parentCategoryId for UI filtering
      const selectedCategory = categoryData.categories.find(
        (cat) => cat.categoryId === existingProduct.category
      );
      const parentCategoryId = selectedCategory?.parentCategoryId || "";

      // Log if parentCategoryId is missing
      if (!parentCategoryId && selectedCategory) {
        console.warn(
          `Category '${selectedCategory.name}' (ID: ${selectedCategory.categoryId}) has no valid parentCategoryId.`
        );
      }

      // Update filtered categories based on parentCategory
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
        parentCategory: parentCategoryId, // For UI only
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
    console.log(`Handle change: ${name} = ${value}`);

    if (name === "category") {
      // Find the selected category to get its parentCategoryId
      const selectedCategory = categoryData?.categories?.find(
        (cat) => cat.categoryId === value
      );
      const parentCategoryId = selectedCategory?.parentCategoryId || "";

      console.log("Selected category:", selectedCategory);
      console.log("Setting parentCategory to:", parentCategoryId);

      // Log if parentCategoryId is missing
      if (!parentCategoryId && selectedCategory) {
        console.warn(
          `Category '${selectedCategory.name}' (ID: ${selectedCategory.categoryId}) has no valid parentCategoryId.`
        );
      }

      // Update filtered categories based on parentCategoryId
      const matchingCategories = categoryData?.categories?.filter(
        (cat) => cat.parentCategoryId === parentCategoryId
      );
      setFilteredCategories(matchingCategories || []);

      // Update formData with category and parentCategory (parentCategory for UI only)
      setFormData((prev) => ({
        ...prev,
        category: value,
        parentCategory: parentCategoryId,
      }));
      return;
    }

    if (name === "parentCategory") {
      // Filter categories based on selected parentCategory
      const matchingCategories = categoryData?.categories?.filter(
        (cat) => cat.parentCategoryId === value
      );
      console.log(
        "Filtered categories for parentCategory:",
        matchingCategories
      );

      setFilteredCategories(matchingCategories || []);
      setFormData((prev) => ({
        ...prev,
        parentCategory: value,
        category: "", // Reset category when parentCategory changes
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
    console.log("Submitting formData:", formData);

    // Exclude parentCategory and barcode from required fields and payload
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
      console.log("Empty fields:", emptyFields);
      toast.warning(
        "All required fields must be filled before submitting the form."
      );
      return;
    }

    // Validate category (relaxed to warn instead of block)
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
        // Proceed with submission
      }
    }

    // Prepare payload, excluding parentCategory and barcode
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
        // Clear formData after successful creation
        setFormData(initialFormData);
        setFilteredCategories([]);
      }
    } catch (error) {
      console.error("Error submitting product:", error);
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
    return <p>Loading product details...</p>;
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">
                {isEditMode ? "Edit Product" : "Create Product"}
              </h4>
              <h6>
                {isEditMode ? "Update product details" : "Create a new product"}
              </h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Refresh"
              >
                <i className="ti ti-refresh"></i>
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Collapse"
                id="collapse-header"
              >
                <i className="ti ti-chevron-up"></i>
              </a>
            </li>
          </ul>
          <div className="page-btn mt-0">
            <a href="/inventory/list" className="btn btn-secondary">
              <FaArrowLeft className="me-2" /> Back to Product
            </a>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="add-product-form">
          {error && <p className="text-danger">Error: {error.message}</p>}
          <div className="col-lg-12">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? "Saving..."
                : isEditMode
                ? "Update Product"
                : "Create Product"}
            </button>
          </div>
          <div className="add-product">
            <div
              className="accordions-items-seperate"
              id="accordionSpacingExample"
            >
              <div className="accordion-item border mb-4">
                <h2 className="accordion-header" id="headingSpacingOne">
                  <div
                    className="accordion-button collapsed bg-white"
                    data-bs-toggle="collapse"
                    data-bs-target="#SpacingOne"
                    aria-expanded="true"
                    aria-controls="SpacingOne"
                  >
                    <div className="d-flex align-items-center justify-content-between flex-fill">
                      <h5 className="d-flex align-items-center">
                        <GiFeatherWound className="text-primary me-2" />
                        <span>Product Information</span>
                      </h5>
                    </div>
                  </div>
                </h2>
                <div
                  id="SpacingOne"
                  className="accordion-collapse collapse show"
                  aria-labelledby="headingSpacingOne"
                >
                  <div className="accordion-body border-top">
                    <div className="row">
                      <div className="col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Product Name
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Product Segment
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="productSegment"
                            value={formData.productSegment}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Product Group
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="productGroup"
                            value={formData.productGroup}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Product Code
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="product_code"
                            value={formData.product_code}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-sm-6 col-12">
                        <div className="mb-3 list position-relative">
                          <label className="form-label">
                            Company Code{" "}
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="company_code"
                            value={formData.company_code}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Selling Price
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="sellingPrice"
                            value={formData.sellingPrice}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Purchasing Price
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="purchasingPrice"
                            value={formData.purchasingPrice}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-lg-6 col-sm-6 col-12">
                        <div className="mb-3 list position-relative">
                          <label className="form-label">
                            Category
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <select
                            className="form-control"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            {(formData.parentCategory
                              ? filteredCategories
                              : categoryData?.categories
                            )?.map((cat) => (
                              <option
                                key={cat.categoryId}
                                value={cat.categoryId}
                              >
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-lg-6 col-sm-6 col-12">
                        <div className="mb-3 list position-relative">
                          <label className="form-label">
                            Parent Category
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <select
                            className="form-control"
                            name="parentCategory"
                            value={formData.parentCategory}
                            onChange={handleChange}
                            disabled={!!formData.category}
                          >
                            <option value="">Select</option>
                            {parentCategoryData.map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                {parent.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-lg-6 col-sm-6 col-12">
                        <div className="mb-3 list position-relative">
                          <div className="add-newplus">
                            <label className="form-label">
                              Brand<span className="text-danger ms-1">*</span>
                            </label>
                          </div>
                          <select
                            className="form-control"
                            name="brand"
                            value={formData.brand}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            {brandData?.map((brand) => (
                              <option key={brand.id} value={brand.id}>
                                {brand.brandName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-lg-6 col-sm-6 col-12">
                        <div className="mb-3 list position-relative">
                          <div className="add-newplus">
                            <label className="form-label">
                              Is Featured?
                              <span className="text-danger ms-1">*</span>
                            </label>
                          </div>
                          <select
                            className="form-control"
                            name="isFeatured"
                            value={formData.isFeatured}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="summer-description-box">
                        <label className="form-label">Description</label>
                        <div id="summernote"></div>
                        <p className="fs-14 mt-1">Maximum 60 Words</p>
                        <input
                          type="text"
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="accordion-item border mb-4">
                <h2 className="accordion-header" id="headingSpacingTwo">
                  <div
                    className="accordion-button collapsed bg-white"
                    data-bs-toggle="collapse"
                    data-bs-target="#SpacingTwo"
                    aria-expanded="true"
                    aria-controls="SpacingTwo"
                  >
                    <div className="d-flex align-items-center justify-content-between flex-fill">
                      <h5 className="d-flex align-items-center">
                        <i
                          data-feather="life-buoy"
                          className="text-primary me-2"
                        ></i>
                        <span>Pricing & Stocks</span>
                      </h5>
                    </div>
                  </div>
                </h2>
                <div
                  id="SpacingTwo"
                  className="accordion-collapse collapse show"
                  aria-labelledby="headingSpacingTwo"
                >
                  <div className="accordion-body border-top">
                    <div className="tab-content" id="pills-tabContent">
                      <div
                        className="tab-pane fade show active"
                        id="pills-home"
                        role="tabpanel"
                        aria-labelledby="pills-home-tab"
                      >
                        <div className="single-product">
                          <div className="row">
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Quantity
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  name="quantity"
                                  value={formData.quantity}
                                  onChange={handleChange}
                                  min="0"
                                />
                              </div>
                            </div>
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Alert Quantity
                                  <span className="text-danger ms-1">*</span>
                                </label>
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
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Tax<span className="text-danger ms-1">*</span>
                                </label>
                                <select
                                  className="form-control"
                                  name="tax"
                                  value={formData.tax}
                                  onChange={handleChange}
                                >
                                  <option value="">Select</option>
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
                  </div>
                </div>
              </div>
              <div className="accordion-item border mb-4">
                <h2 className="accordion-header" id="headingSpacingThree">
                  <div
                    className="accordion-button collapsed bg-white"
                    data-bs-toggle="collapse"
                    data-bs-target="#SpacingThree"
                    aria-expanded="true"
                    aria-controls="SpacingThree"
                  >
                    <div className="d-flex align-items-center justify-content-between flex-fill">
                      <h5 className="d-flex align-items-center">
                        <i
                          data-feather="image"
                          className="text-primary me-2"
                        ></i>
                        <span>Images</span>
                      </h5>
                    </div>
                  </div>
                </h2>
                <div
                  id="SpacingThree"
                  className="accordion-collapse collapse show"
                  aria-labelledby="headingSpacingThree"
                >
                  <div className="accordion-body border-top">
                    <div className="text-editor add-list add">
                      <div className="col-lg-12">
                        <div className="add-choosen">
                          <div className="mb-3">
                            <div className="image-upload image-upload-two">
                              <input type="file" />
                              <div className="image-uploads">
                                <i
                                  data-feather="plus-circle"
                                  className="plus-down-add me-0"
                                ></i>
                                <h4>Add Images</h4>
                              </div>
                            </div>
                          </div>
                          <div className="phone-img">
                            <img
                              src="assets/img/products/phone-add-2.png"
                              alt="image"
                            />
                            <a href="javascript:void(0);">
                              <i
                                data-feather="x"
                                className="x-square-add remove-product"
                              ></i>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ToastContainer />
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
