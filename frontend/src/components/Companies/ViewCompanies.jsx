import React from "react";

const ViewCompanies = () => {
  return (
    <div
      class="modal custom-modal custom-lg-modal fade p-20"
      id="view_companies"
      role="dialog"
    >
      <div class="modal-dialog modal-dialog-centered modal-md">
        <div class="modal-content">
          <div class="modal-header border-0">
            <div class="form-header modal-header-title text-start mb-0">
              <h4 class="mb-0">Company Details</h4>
            </div>
            <div class="d-flex details-edit-link">
              <a
                href="#"
                class="modal-edit-link d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#edit_companies"
              >
                <i class="fe fe-edit me-2"></i>Edit Company
              </a>
              <button
                type="button"
                class="btn-close ms-2"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
          </div>
          <div class="modal-body pb-0">
            <div class="row">
              <div class="col-md-12">
                <div class="form-field-item">
                  <div class="profile-picture company-detail-head">
                    <div class="upload-profile">
                      <div class="profile-img company-profile-img">
                        <img
                          id="view-company-img"
                          class="img-fluid me-0"
                          src="assets/img/companies/company-01.svg"
                          alt="profile-img"
                        />
                      </div>
                      <div class="add-profile">
                        <h5>Hermann Groups</h5>
                        <span>
                          <a
                            href="https://kanakku.dreamstechnologies.com/cdn-cgi/l/email-protection"
                            class="__cf_email__"
                            data-cfemail="3b735e49565757495258537b5e435a564b575e15585456"
                          >
                            [email&#160;protected]
                          </a>
                        </span>
                      </div>
                    </div>
                    <span class="badge bg-success-light d-inline-flex align-items-center">
                      <i class="fe fe-check me-1"></i>Active
                    </span>
                  </div>
                </div>
              </div>
              <div class="col-md-12">
                <div class="plane-basic-info">
                  <h5>Basic Info</h5>
                  <div class="row">
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Account URL</h6>
                        <p>hru.example.com</p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Phone Number</h6>
                        <p>+1 15541 54544</p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Website</h6>
                        <p>www.example.com</p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Company Address</h6>
                        <p>
                          22 Junior Avenue <br />
                          Duluth, GA 30097
                        </p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Currency</h6>
                        <p>United Stated Dollar (USD)</p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Language</h6>
                        <p>English</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-12">
                <div class="plane-basic-info plane-detail">
                  <h5>Plan Details</h5>
                  <div class="row">
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Plan Name</h6>
                        <p>Enterprise</p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Plan Type</h6>
                        <p>Yearly</p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Price</h6>
                        <p>$200</p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Register Date</h6>
                        <p>15 Jan 2024</p>
                      </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                      <div class="basic-info-detail">
                        <h6>Expiring On</h6>
                        <p>15 Jan 2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCompanies;
