import React from "react";

const ProductDetailModal = () => {
  return (
    <div class="modal fade" id="company_detail">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">Company Detail</h4>
            <button
              type="button"
              class="btn-close custom-btn-close p-0"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i class="ti ti-x"></i>
            </button>
          </div>
          <div class="moday-body">
            <div class="p-3">
              <div class="d-flex justify-content-between align-items-center rounded bg-light p-3">
                <div class="file-name-icon d-flex align-items-center">
                  <a
                    href="#"
                    class="avatar avatar-md border rounded-circle flex-shrink-0 me-2"
                  >
                    <img
                      src="assets/img/company/company-01.svg"
                      class="img-fluid"
                      alt="img"
                    />
                  </a>
                  <div>
                    <p class="text-gray-9 fw-medium mb-0">
                      BrightWave Innovations
                    </p>
                    <p>
                      <a
                        href="https://dreamspos.dreamstechnologies.com/cdn-cgi/l/email-protection"
                        class="__cf_email__"
                        data-cfemail="a3cecac0cbc2c6cfe3c6dbc2ced3cfc68dc0ccce"
                      >
                        [email&#160;protected]
                      </a>
                    </p>
                  </div>
                </div>
                <span class="badge badge-success">
                  <i class="ti ti-point-filled"></i>Active
                </span>
              </div>
            </div>
            <div class="p-3">
              <p class="text-gray-9 fw-medium">Basic Info</p>
              <div class="pb-1 border-bottom mb-4">
                <div class="row align-items-center">
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Account URL</p>
                      <p class="text-gray-9">bwi.example.com</p>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Phone Number</p>
                      <p class="text-gray-9">(163) 2459 315</p>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Website</p>
                      <p class="text-gray-9">www.exmple.com</p>
                    </div>
                  </div>
                </div>
                <div class="row align-items-center">
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Currency</p>
                      <p class="text-gray-9">United Stated Dollar (USD)</p>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Language</p>
                      <p class="text-gray-9">English</p>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Addresss</p>
                      <p class="text-gray-9">
                        3705 Lynn Avenue, Phelps, WI 54554
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-gray-9 fw-medium">Plan Details</p>
              <div>
                <div class="row align-items-center">
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Plan Name</p>
                      <p class="text-gray-9">Advanced</p>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Plan Type</p>
                      <p class="text-gray-9">Monthly</p>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Price</p>
                      <p class="text-gray-9">$200</p>
                    </div>
                  </div>
                </div>
                <div class="row align-items-center">
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Register Date</p>
                      <p class="text-gray-9">12 Sep 2024</p>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="mb-3">
                      <p class="fs-12 mb-0">Expiring On</p>
                      <p class="text-gray-9">11 Oct 2024</p>
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

export default ProductDetailModal;
