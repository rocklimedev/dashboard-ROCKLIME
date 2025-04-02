import React from "react";

const AddNewOrder = ({ onClose, existingOrder }) => {
  return (
    <div class="modal fade show" style={{ display: "block" }}>
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="page-wrapper-new p-0">
            <div class="content">
              <div class="modal-header">
                <div class="page-title">
                  <h4>Add New Note</h4>
                </div>
                <button
                  type="button"
                  class="close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <form action="https://dreamspos.dreamstechnologies.com/html/template/notes.html">
                  <div class="row">
                    <div class="col-12">
                      <div class="mb-3">
                        <label class="form-label">Note Title</label>
                        <input type="text" class="form-control" />
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="mb-3">
                        <label class="form-label">User</label>
                        <select class="select">
                          <option>Select</option>
                          <option>Recent1</option>
                          <option>Recent2</option>
                        </select>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="mb-3">
                        <label class="form-label">Tag</label>
                        <select class="select">
                          <option>Select</option>
                          <option>Recent1</option>
                          <option>Recent2</option>
                        </select>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="mb-3">
                        <label class="form-label">Priority</label>
                        <select class="select">
                          <option>Select</option>
                          <option>Recent1</option>
                          <option>Recent2</option>
                        </select>
                      </div>
                    </div>
                    <div class="col-lg-12">
                      <div class="mb-3 summer-description-box notes-summernote">
                        <label class="form-label">Descriptions</label>
                        <div id="summernote"></div>
                        <p>Maximum 60 Characters</p>
                      </div>
                    </div>
                  </div>

                  <div class="modal-footer-btn">
                    <button
                      type="button"
                      class="btn btn-cancel me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button type="submit" class="btn btn-submit">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewOrder;
