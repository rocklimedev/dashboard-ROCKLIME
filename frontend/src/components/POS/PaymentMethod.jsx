import React from "react";

const PaymentMethod = () => {
  return (
    <div class="card payment-method">
      <div class="card-body">
        <h5 class="mb-3">Select Payment</h5>
        <div class="row align-items-center methods g-2">
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#payment-cash"
            >
              <img
                src="assets/img/icons/cash-icon.svg"
                class="me-2"
                alt="img"
              />
              <p class="fs-14 fw-medium">Cash</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#payment-card"
            >
              <img src="assets/img/icons/card.svg" class="me-2" alt="img" />
              <p class="fs-14 fw-medium">Card</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#payment-points"
            >
              <img src="assets/img/icons/points.svg" class="me-2" alt="img" />
              <p class="fs-14 fw-medium">Points</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#payment-deposit"
            >
              <img src="assets/img/icons/deposit.svg" class="me-2" alt="img" />
              <p class="fs-14 fw-medium">Deposit</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#payment-cheque"
            >
              <img src="assets/img/icons/cheque.svg" class="me-2" alt="img" />
              <p class="fs-14 fw-medium">Cheque</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#gift-payment"
            >
              <img src="assets/img/icons/giftcard.svg" class="me-2" alt="img" />
              <p class="fs-14 fw-medium">Gift Card</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#scan-payment"
            >
              <img
                src="assets/img/icons/scan-icon.svg"
                class="me-2"
                alt="img"
              />
              <p class="fs-14 fw-medium">Scan</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
            >
              <img src="assets/img/icons/paylater.svg" class="me-2" alt="img" />
              <p class="fs-14 fw-medium">Pay Later</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
            >
              <img src="assets/img/icons/external.svg" class="me-2" alt="img" />
              <p class="fs-14 fw-medium">External</p>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#split-payment"
            >
              <img
                src="assets/img/icons/split-bill.svg"
                class="me-2"
                alt="img"
              />
              <p class="fs-14 fw-medium">Split Bill</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
