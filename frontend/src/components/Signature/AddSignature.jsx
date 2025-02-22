import React from "react";

const AddSignature = () => {
  return (
    <div
      class="modal custom-modal signature-add-modal fade"
      id="add_modal"
      role="dialog"
    >
      <div class="modal-dialog modal-dialog-centered modal-md">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <div class="form-header modal-header-title text-start mb-0">
              <h4 class="mb-0">Add Signature</h4>
            </div>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <form action="#">
            <div class="modal-body">
              <div class="row">
                <div class="col-lg-12 col-md-12">
                  <div class="input-block mb-3">
                    <label>Signature Name</label>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Signature Name"
                    />
                  </div>
                </div>
                <div class="col-lg-12 col-md-12">
                  <div class="input-block mb-3">
                    <label>Upload</label>
                    <div class="input-block service-upload service-upload-info mb-0">
                      <span>
                        <i class="fe fe-upload-cloud me-1"></i>Upload Signature
                      </span>
                      <input type="file" multiple="" />
                      <div id="frames"></div>
                    </div>
                    <p>Image format should be png and jpg</p>
                  </div>
                </div>
                <div class="col-lg-12 col-md-12">
                  <label class="custom_check">
                    <input type="checkbox" name="invoice" />
                    <span class="checkmark"></span>
                    Mark as default
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                data-bs-dismiss="modal"
                class="btn btn-back me-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-bs-dismiss="modal"
                class="btn btn-primary"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSignature;
