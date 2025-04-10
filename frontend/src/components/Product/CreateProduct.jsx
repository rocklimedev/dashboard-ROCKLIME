import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery, // Fetch product data for editing
} from "../../api/productApi";
import { GiFeatherWound } from "react-icons/gi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
const CreateProduct = () => {
  const { id } = useParams(); // Get product ID from URL
  const isEditMode = Boolean(id); // Check if we're editing
  const [filteredCategories, setFilteredCategories] = useState([]);

  const { data: existingProduct, isLoading: isFetching } =
    useGetProductByIdQuery(id, { skip: !isEditMode }); // Fetch product only if editing

  const [formData, setFormData] = useState({
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
    barcode: "",
    description: "",
  });

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating, error }] =
    useUpdateProductMutation();
  const { data: categoryData = [], isLoading: isCategoryLoading } =
    useGetAllCategoriesQuery();

  const { data: parentCategories, isLoading: isParentCategoryLoading } =
    useGetAllParentCategoriesQuery();
  const parentCategoryData = Array.isArray(parentCategories?.data)
    ? parentCategories.data
    : [];
  const { data: brands, isLoading: isBrandLoading } = useGetAllBrandsQuery();
  const brandData = Array.isArray(brands) ? brands : [];
  // Pre-fill form when editing
  useEffect(() => {
    if (existingProduct) {
      setFormData(existingProduct);
    }
  }, [existingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      const selectedCategory = categoryData?.categories?.find(
        (cat) => cat.id === value
      );

      if (selectedCategory) {
        const linkedParentCategoryId = selectedCategory.parentCategoryId;

        setFormData((prev) => ({
          ...prev,
          category: value,
          parentCategory: linkedParentCategoryId || "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          category: value,
          parentCategory: "",
        }));
      }

      return;
    }

    if (name === "parentCategory") {
      setFormData((prev) => ({
        ...prev,
        parentCategory: value,
        category: "", // Reset category so user picks fresh
      }));

      const matchingCategories = categoryData?.categories?.filter(
        (cat) => cat.parentCategoryId === value
      );

      setFilteredCategories(matchingCategories || []);
      return;
    }

    // Default handler
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any field is empty
    const emptyFields = Object.entries(formData).filter(
      ([key, value]) => value === "" || value === null || value === undefined
    );

    if (emptyFields.length > 0) {
      alert("All fields must be filled before submitting the form.");
      return;
    }

    const sanitizedData = {
      ...formData,
      sellingPrice: formData.sellingPrice.replace(/,/g, ""),
    };

    try {
      if (isEditMode) {
        await updateProduct({ id, ...sanitizedData });
        alert("Product updated successfully!");
      } else {
        await createProduct(sanitizedData);
        alert("Product created successfully!");
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      alert("Something went wrong while saving the product.");
    }
  };

  if (isFetching) return <p>Loading product details...</p>;

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
              {isEditMode ? "Update Product" : "Create Product"}
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
                            Selling price
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
                            Purchasing price
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
                              <option key={cat.id} value={cat.id}>
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
                            disabled={!!formData.category} // disables if category already selected
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
                            <option>select</option>
                            <option>true</option>
                            <option>false</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-lg-6 col-sm-6 col-12">
                        <div className="mb-3 list position-relative">
                          <label className="form-label">
                            Barcode<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="barcode"
                            value={formData.barcode}
                            onChange={handleChange}
                          />
                          <button type="submit" className="btn btn-primaryadd">
                            Generate
                          </button>
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
                                />
                              </div>
                            </div>

                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Tax<span className="text-danger ms-1">*</span>
                                </label>
                                <select
                                  className="select"
                                  name="tax"
                                  value={formData.tax}
                                  onChange={handleChange}
                                >
                                  <option>Select</option>
                                  <option>IGST (8%)</option>
                                  <option>GST (5%)</option>
                                  <option>SGST (4%)</option>
                                  <option>CGST (16%)</option>
                                  <option>Gst 18%</option>
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
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
