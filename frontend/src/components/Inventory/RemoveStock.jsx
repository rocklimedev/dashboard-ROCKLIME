import React from "react";

const RemoveStock = () => {
  return (
    <div class="modal custom-modal fade" id="stock_out" role="dialog">
      <div class="modal-dialog modal-dialog-centered modal-md">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <div class="form-header modal-header-title text-start mb-0">
              <h4 class="mb-0">Remove Stock</h4>
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
                    <label>Name</label>
                    <input
                      type="text"
                      class="bg-white-smoke form-control"
                      placeholder="SEO Service"
                    />
                  </div>
                </div>
                <div class="col-lg-6 col-md-12">
                  <div class="input-block mb-3">
                    <label>Quantity</label>
                    <input type="number" class="form-control" placeholder="0" />
                  </div>
                </div>
                <div class="col-lg-6 col-md-12">
                  <div class="input-block mb-0">
                    <label>Units</label>
                    <select class="select">
                      <option>Pieces</option>
                      <option>Inches</option>
                      <option>Kilograms</option>
                      <option>Inches</option>
                      <option>Box</option>
                    </select>
                  </div>
                </div>
                <div class="col-lg-12">
                  <div class="input-block mb-0">
                    <label>Notes</label>
                    <textarea
                      rows="3"
                      cols="3"
                      class="form-control"
                      placeholder="Enter Notes"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                data-bs-dismiss="modal"
                class="btn btn-back cancel-btn me-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-bs-dismiss="modal"
                class="btn btn-primary paid-continue-btn"
              >
                Remove Quantity
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RemoveStock;
