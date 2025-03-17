import React from "react";

const AddCompany = () => {
  return (
    <div class="modal fade" id="add_company">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">Add New Company</h4>
            <button
              type="button"
              class="btn-close custom-btn-close p-0"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i class="ti ti-x"></i>
            </button>
          </div>
          <form action="https://dreamspos.dreamstechnologies.com/html/template/companies.html">
            <div class="modal-body pb-0">
              <div class="row">
                <div class="col-md-12">
                  <div class="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                    <div class="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                      <i class="ti ti-photo"></i>
                    </div>
                    <div class="profile-upload">
                      <div class="mb-2">
                        <h6 class="mb-1">Upload Profile Image</h6>
                        <p class="fs-12">Image should be below 4 mb</p>
                      </div>
                      <div class="profile-uploader d-flex align-items-center">
                        <div class="drag-upload-btn btn btn-sm btn-primary me-2">
                          Upload
                          <input
                            type="file"
                            class="form-control image-sign"
                            multiple=""
                          />
                        </div>
                        <a
                          href="javascript:void(0);"
                          class="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">
                      Name <span class="text-danger"> *</span>
                    </label>
                    <input type="text" class="form-control" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control" />
                  </div>
                </div>
                <div class="col-md-12">
                  <div class="mb-3">
                    <label class="form-label">Account URL</label>
                    <input type="text" class="form-control" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">
                      Phone Number <span class="text-danger"> *</span>
                    </label>
                    <input type="text" class="form-control" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Website</label>
                    <input type="text" class="form-control" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3 ">
                    <label class="form-label">
                      Password <span class="text-danger"> *</span>
                    </label>
                    <div class="pass-group">
                      <input type="password" class="pass-input form-control" />
                      <span class="ti toggle-password ti-eye-off"></span>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3 ">
                    <label class="form-label">
                      Confirm Password <span class="text-danger"> *</span>
                    </label>
                    <div class="pass-group">
                      <input type="password" class="pass-inputs form-control" />
                      <span class="ti toggle-passwords ti-eye-off"></span>
                    </div>
                  </div>
                </div>
                <div class="col-md-12">
                  <div class="mb-3">
                    <label class="form-label">Address</label>
                    <input type="text" class="form-control" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3 ">
                    <label class="form-label">
                      Plan Name <span class="text-danger"> *</span>
                    </label>
                    <select class="select">
                      <option>Select</option>
                      <option>Advanced</option>
                      <option>Basic</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3 ">
                    <label class="form-label">
                      Plan Type <span class="text-danger"> *</span>
                    </label>
                    <select class="select">
                      <option>Select</option>
                      <option>Monthly</option>
                      <option>Yearly</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3 ">
                    <label class="form-label">
                      Currency <span class="text-danger"> *</span>
                    </label>
                    <select class="select">
                      <option>Select</option>
                      <option>USD</option>
                      <option>Euro</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3 ">
                    <label class="form-label">
                      Language <span class="text-danger"> *</span>
                    </label>
                    <select class="select">
                      <option>Select</option>
                      <option>English</option>
                      <option>Arabic</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3 ">
                    <label class="form-label">Status</label>
                    <select class="select">
                      <option>Select</option>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary me-2"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                Add Company
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCompany;
