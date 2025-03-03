import React from "react";

const POSFooter = () => {
  return (
    <div class="pos-footer bg-white p-3 border-top">
      <div class="d-flex align-items-center justify-content-center flex-wrap gap-2">
        <a
          href="javascript:void(0);"
          class="btn btn-orange d-inline-flex align-items-center justify-content-center"
          data-bs-toggle="modal"
          data-bs-target="#hold-order"
        >
          <i class="ti ti-player-pause me-2"></i>Hold
        </a>
        <a
          href="javascript:void(0);"
          class="btn btn-info d-inline-flex align-items-center justify-content-center"
        >
          <i class="ti ti-trash me-2"></i>Void
        </a>
        <a
          href="javascript:void(0);"
          class="btn btn-cyan d-flex align-items-center justify-content-center"
          data-bs-toggle="modal"
          data-bs-target="#payment-completed"
        >
          <i class="ti ti-cash-banknote me-2"></i>Payment
        </a>
        <a
          href="javascript:void(0);"
          class="btn btn-secondary d-inline-flex align-items-center justify-content-center"
          data-bs-toggle="modal"
          data-bs-target="#orders"
        >
          <i class="ti ti-shopping-cart me-2"></i>View Orders
        </a>
        <a
          href="javascript:void(0);"
          class="btn btn-indigo d-inline-flex align-items-center justify-content-center"
          data-bs-toggle="modal"
          data-bs-target="#reset"
        >
          <i class="ti ti-reload me-2"></i>Reset
        </a>
        <a
          href="javascript:void(0);"
          class="btn btn-danger d-inline-flex align-items-center justify-content-center"
          data-bs-toggle="modal"
          data-bs-target="#recents"
        >
          <i class="ti ti-refresh-dot me-2"></i>Transaction
        </a>
      </div>
    </div>
  );
};

export default POSFooter;
