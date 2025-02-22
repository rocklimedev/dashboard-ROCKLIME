import React from "react";

const DeleteModal = () => {
  return (
    <div class="modal custom-modal fade" id="delete_modal" role="dialog">
      <div class="modal-dialog modal-dialog-centered modal-md">
        <div class="modal-content">
          <div class="modal-body">
            <div class="form-header">
              <h3>Delete Category</h3>
              <p>Are you sure want to delete?</p>
            </div>
            <div class="modal-btn delete-action">
              <div class="row">
                <div class="col-6">
                  <button
                    type="reset"
                    data-bs-dismiss="modal"
                    class="w-100 btn btn-primary paid-continue-btn"
                  >
                    Delete
                  </button>
                </div>
                <div class="col-6">
                  <button
                    type="submit"
                    data-bs-dismiss="modal"
                    class="w-100 btn btn-primary paid-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
