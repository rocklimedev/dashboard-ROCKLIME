import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useState } from "react";
import { useCreateProductMutation } from "../../api/productApi";
import { GiFeatherWound } from "react-icons/gi";
const CreateProduct = () => {
  const [formData, setFormData] = useState({
    productName: "",
    productSegment: "",
    productGroup: "",
    productCode: "",
    companyCode: "",
    sellingPrice: "",
    category: "",
    parentCategory: "",
    brand: "",
    isFeatured: "",
    barcode: "",
    description: "",
  });

  const [createProduct, { isLoading, error }] = useCreateProductMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct(formData).unwrap();
      alert("Product created successfully");
    } catch (err) {
      console.error("Failed to create product:", err);
    }
  };
  return (
    <div class="page-wrapper">
      <div class="content">
        <div class="page-header">
          <div class="add-item d-flex">
            <div class="page-title">
              <h4 class="fw-bold">Create Product</h4>
              <h6>Create new product</h6>
            </div>
          </div>
          <ul class="table-top-head">
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Refresh"
              >
                <i class="ti ti-refresh"></i>
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Collapse"
                id="collapse-header"
              >
                <i class="ti ti-chevron-up"></i>
              </a>
            </li>
          </ul>
          <div class="page-btn mt-0">
            <a href="/inventory/list" class="btn btn-secondary">
              <FaArrowLeft class="me-2" /> Back to Product
            </a>
          </div>
        </div>
        <form onSubmit={handleSubmit} class="add-product-form">
          <div class="add-product">
            <div class="accordions-items-seperate" id="accordionSpacingExample">
              <div class="accordion-item border mb-4">
                <h2 class="accordion-header" id="headingSpacingOne">
                  <div
                    class="accordion-button collapsed bg-white"
                    data-bs-toggle="collapse"
                    data-bs-target="#SpacingOne"
                    aria-expanded="true"
                    aria-controls="SpacingOne"
                  >
                    <div class="d-flex align-items-center justify-content-between flex-fill">
                      <h5 class="d-flex align-items-center">
                        <GiFeatherWound lass="text-primary me-2" />
                        <span>Product Information</span>
                      </h5>
                    </div>
                  </div>
                </h2>
                <div
                  id="SpacingOne"
                  class="accordion-collapse collapse show"
                  aria-labelledby="headingSpacingOne"
                >
                  <div class="accordion-body border-top">
                    <div class="row">
                      <div class="col-sm-6 col-12">
                        <div class="mb-3">
                          <label class="form-label">
                            Product Name<span class="text-danger ms-1">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                      <div class="col-sm-6 col-12">
                        <div class="mb-3">
                          <label class="form-label">
                            Product Segment
                            <span class="text-danger ms-1">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                      <div class="col-sm-6 col-12">
                        <div class="mb-3">
                          <label class="form-label">
                            Product Group<span class="text-danger ms-1">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                      <div class="col-sm-6 col-12">
                        <div class="mb-3">
                          <label class="form-label">
                            Product Code<span class="text-danger ms-1">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-sm-6 col-12">
                        <div class="mb-3 list position-relative">
                          <label class="form-label">
                            Company Code <span class="text-danger ms-1">*</span>
                          </label>
                          <input type="text" class="form-control list" />
                        </div>
                      </div>
                      <div class="col-sm-6 col-12">
                        <div class="mb-3">
                          <label class="form-label">
                            Selling price<span class="text-danger ms-1">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                    </div>
                    <div class="addservice-info">
                      <div class="row">
                        <div class="col-sm-6 col-12">
                          <div class="mb-3">
                            <div class="add-newplus">
                              <label class="form-label">
                                Category<span class="text-danger ms-1">*</span>
                              </label>
                              <a
                                href="javascript:void(0);"
                                data-bs-toggle="modal"
                                data-bs-target="#add-product-category"
                              >
                                <i
                                  data-feather="plus-circle"
                                  class="plus-down-add"
                                ></i>
                                <span>Add New</span>
                              </a>
                            </div>
                            <select class="select">
                              <option>Select</option>
                              <option>Computers</option>
                              <option>Electronics</option>
                              <option>Shoe</option>
                              <option>Cosmetics</option>
                              <option>Groceries</option>
                              <option>Furniture</option>
                              <option>Bags</option>
                              <option>Phone</option>
                            </select>
                          </div>
                        </div>
                        <div class="col-sm-6 col-12">
                          <div class="mb-3">
                            <label class="form-label">
                              Parent Category
                              <span class="text-danger ms-1">*</span>
                            </label>
                            <select class="select">
                              <option>Select</option>
                              <option>Laptop</option>
                              <option>Desktop</option>
                              <option>Sneakers</option>
                              <option>Formals</option>
                              <option>Wearables</option>
                              <option>Speakers</option>
                              <option>Handbags</option>
                              <option>Travel</option>
                              <option>Sofa</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="add-product-new">
                      <div class="row">
                        <div class="col-sm-6 col-12">
                          <div class="mb-3">
                            <div class="add-newplus">
                              <label class="form-label">
                                Brand<span class="text-danger ms-1">*</span>
                              </label>
                            </div>
                            <select class="select">
                              <option>Select</option>
                              <option>Lenevo</option>
                              <option>Beats</option>
                              <option>Nike</option>
                              <option>Apple</option>
                              <option>Amazon</option>
                              <option>Woodmart</option>
                            </select>
                          </div>
                        </div>
                        <div class="col-sm-6 col-12">
                          <div class="mb-3">
                            <div class="add-newplus">
                              <label class="form-label">
                                Is Featured?
                                <span class="text-danger ms-1">*</span>
                              </label>
                            </div>
                            <select class="select">
                              <option>select</option>
                              <option>true</option>
                              <option>false</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-lg-6 col-sm-6 col-12">
                        <div class="mb-3 list position-relative">
                          <label class="form-label">
                            Barcode<span class="text-danger ms-1">*</span>
                          </label>
                          <input type="text" class="form-control list" />
                          <button type="submit" class="btn btn-primaryadd">
                            Generate
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="col-lg-12">
                      <div class="summer-description-box">
                        <label class="form-label">Description</label>
                        <div id="summernote"></div>
                        <p class="fs-14 mt-1">Maximum 60 Words</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item border mb-4">
                <h2 class="accordion-header" id="headingSpacingTwo">
                  <div
                    class="accordion-button collapsed bg-white"
                    data-bs-toggle="collapse"
                    data-bs-target="#SpacingTwo"
                    aria-expanded="true"
                    aria-controls="SpacingTwo"
                  >
                    <div class="d-flex align-items-center justify-content-between flex-fill">
                      <h5 class="d-flex align-items-center">
                        <i
                          data-feather="life-buoy"
                          class="text-primary me-2"
                        ></i>
                        <span>Pricing & Stocks</span>
                      </h5>
                    </div>
                  </div>
                </h2>
                <div
                  id="SpacingTwo"
                  class="accordion-collapse collapse show"
                  aria-labelledby="headingSpacingTwo"
                >
                  <div class="accordion-body border-top">
                    <div class="tab-content" id="pills-tabContent">
                      <div
                        class="tab-pane fade show active"
                        id="pills-home"
                        role="tabpanel"
                        aria-labelledby="pills-home-tab"
                      >
                        <div class="single-product">
                          <div class="row">
                            <div class="col-lg-4 col-sm-6 col-12">
                              <div class="mb-3">
                                <label class="form-label">
                                  Quantity
                                  <span class="text-danger ms-1">*</span>
                                </label>
                                <input type="text" class="form-control" />
                              </div>
                            </div>
                            <div class="col-lg-4 col-sm-6 col-12">
                              <div class="mb-3">
                                <label class="form-label">
                                  Alert Quantity
                                  <span class="text-danger ms-1">*</span>
                                </label>
                                <input type="text" class="form-control" />
                              </div>
                            </div>

                            <div class="col-lg-4 col-sm-6 col-12">
                              <div class="mb-3">
                                <label class="form-label">
                                  Tax<span class="text-danger ms-1">*</span>
                                </label>
                                <select class="select">
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
              <div class="accordion-item border mb-4">
                <h2 class="accordion-header" id="headingSpacingThree">
                  <div
                    class="accordion-button collapsed bg-white"
                    data-bs-toggle="collapse"
                    data-bs-target="#SpacingThree"
                    aria-expanded="true"
                    aria-controls="SpacingThree"
                  >
                    <div class="d-flex align-items-center justify-content-between flex-fill">
                      <h5 class="d-flex align-items-center">
                        <i data-feather="image" class="text-primary me-2"></i>
                        <span>Images</span>
                      </h5>
                    </div>
                  </div>
                </h2>
                <div
                  id="SpacingThree"
                  class="accordion-collapse collapse show"
                  aria-labelledby="headingSpacingThree"
                >
                  <div class="accordion-body border-top">
                    <div class="text-editor add-list add">
                      <div class="col-lg-12">
                        <div class="add-choosen">
                          <div class="mb-3">
                            <div class="image-upload image-upload-two">
                              <input type="file" />
                              <div class="image-uploads">
                                <i
                                  data-feather="plus-circle"
                                  class="plus-down-add me-0"
                                ></i>
                                <h4>Add Images</h4>
                              </div>
                            </div>
                          </div>
                          <div class="phone-img">
                            <img
                              src="assets/img/products/phone-add-2.png"
                              alt="image"
                            />
                            <a href="javascript:void(0);">
                              <i
                                data-feather="x"
                                class="x-square-add remove-product"
                              ></i>
                            </a>
                          </div>

                          <div class="phone-img">
                            <img
                              src="assets/img/products/phone-add-1.png"
                              alt="image"
                            />
                            <a href="javascript:void(0);">
                              <i
                                data-feather="x"
                                class="x-square-add remove-product"
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
          <div class="col-lg-12">
            <div class="d-flex align-items-center justify-content-end mb-4">
              <button type="button" class="btn btn-secondary me-2">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                Add Product
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
