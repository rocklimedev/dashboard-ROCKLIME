import React from "react";

const QuotaionDetails = () => {
  return (
    <div class="page-wrapper">
      <div class="content">
        <div class="page-header">
          <div class="add-item d-flex">
            <div class="page-title">
              <h4>Invoice Details</h4>
            </div>
          </div>
          <ul class="table-top-head">
            <li>
              <a data-bs-toggle="tooltip" data-bs-placement="top" title="Pdf">
                <img src="assets/img/icons/pdf.svg" alt="img" />
              </a>
            </li>
            <li>
              <a data-bs-toggle="tooltip" data-bs-placement="top" title="Print">
                <i data-feather="printer" class="feather-rotate-ccw"></i>
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
          <div class="page-btn">
            <a href="invoice.html" class="btn btn-primary">
              <i data-feather="arrow-left" class="me-2"></i>Back to Invoices
            </a>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="row justify-content-between align-items-center border-bottom mb-3">
              <div class="col-md-6">
                <div class="mb-2">
                  <img
                    src="assets/img/logo.svg"
                    width="130"
                    class="img-fluid"
                    alt="logo"
                  />
                </div>
                <p>3099 Kennedy Court Framingham, MA 01702</p>
              </div>
              <div class="col-md-6">
                <div class=" text-end mb-3">
                  <h5 class="text-gray mb-1">
                    Invoice No <span class="text-primary">#INV0001</span>
                  </h5>
                  <p class="mb-1 fw-medium">
                    Created Date : <span class="text-dark">Sep 24, 2024</span>{" "}
                  </p>
                  <p class="fw-medium">
                    Due Date : <span class="text-dark">Sep 30, 2024</span>{" "}
                  </p>
                </div>
              </div>
            </div>
            <div class="row border-bottom mb-3">
              <div class="col-md-5">
                <p class="text-dark mb-2 fw-semibold">From</p>
                <div>
                  <h4 class="mb-1">Thomas Lawler</h4>
                  <p class="mb-1">2077 Chicago Avenue Orosi, CA 93647</p>
                  <p class="mb-1">
                    Email :{" "}
                    <span class="text-dark">
                      <a
                        href="https://dreamspos.dreamstechnologies.com/cdn-cgi/l/email-protection"
                        class="__cf_email__"
                        data-cfemail="6c380d1e0d000d5e5858592c09140d011c0009420f0301"
                      >
                        [email&#160;protected]
                      </a>
                    </span>
                  </p>
                  <p>
                    Phone : <span class="text-dark">+1 987 654 3210</span>
                  </p>
                </div>
              </div>
              <div class="col-md-5">
                <p class="text-dark mb-2 fw-semibold">To</p>
                <div>
                  <h4 class="mb-1">Carl Evans</h4>
                  <p class="mb-1">3103 Trainer Avenue Peoria, IL 61602</p>
                  <p class="mb-1">
                    Email :{" "}
                    <span class="text-dark">
                      <a
                        href="https://dreamspos.dreamstechnologies.com/cdn-cgi/l/email-protection"
                        class="__cf_email__"
                        data-cfemail="db88baa9ba84b2b5b8e8ef9bbea3bab6abb7bef5b8b4b6"
                      >
                        [email&#160;protected]
                      </a>
                    </span>
                  </p>
                  <p>
                    Phone : <span class="text-dark">+1 987 471 6589</span>
                  </p>
                </div>
              </div>
              <div class="col-md-2">
                <div class="mb-3">
                  <p class="text-title mb-2 fw-medium">Payment Status </p>
                  <span class="bg-success text-white fs-10 px-1 rounded">
                    <i class="ti ti-point-filled "></i>Paid
                  </span>
                  <div class="mt-3">
                    <img src="assets/img/qr.svg" class="img-fluid" alt="QR" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p class="fw-medium">
                Invoice For :{" "}
                <span class="text-dark fw-medium">
                  Design & development of Website
                </span>
              </p>
              <div class="table-responsive mb-3">
                <table class="table">
                  <thead class="thead-light">
                    <tr>
                      <th>Job Description</th>
                      <th class="text-end">Qty</th>
                      <th class="text-end">Cost</th>
                      <th class="text-end">Discount</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <h6>UX Strategy</h6>
                      </td>
                      <td class="text-gray-9 fw-medium text-end">1</td>
                      <td class="text-gray-9 fw-medium text-end">$500</td>
                      <td class="text-gray-9 fw-medium text-end">$100</td>
                      <td class="text-gray-9 fw-medium text-end">$500</td>
                    </tr>
                    <tr>
                      <td>
                        <h6>Design System</h6>
                      </td>
                      <td class="text-gray-9 fw-medium text-end">1</td>
                      <td class="text-gray-9 fw-medium text-end">$5000</td>
                      <td class="text-gray-9 fw-medium text-end">$100</td>
                      <td class="text-gray-9 fw-medium text-end">$5000</td>
                    </tr>
                    <tr>
                      <td>
                        <h6>Brand Guidellines</h6>
                      </td>
                      <td class="text-gray-9 fw-medium text-end">1</td>
                      <td class="text-gray-9 fw-medium text-end">$5000</td>
                      <td class="text-gray-9 fw-medium text-end">$100</td>
                      <td class="text-gray-9 fw-medium text-end">$5000</td>
                    </tr>
                    <tr>
                      <td>
                        <h6>Social Media Template</h6>
                      </td>
                      <td class="text-gray-9 fw-medium text-end">1</td>
                      <td class="text-gray-9 fw-medium text-end">$5000</td>
                      <td class="text-gray-9 fw-medium text-end">$100</td>
                      <td class="text-gray-9 fw-medium text-end">$5000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="row border-bottom mb-3">
              <div class="col-md-5 ms-auto mb-3">
                <div class="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                  <p class="mb-0">Sub Total</p>
                  <p class="text-dark fw-medium mb-2">$5500</p>
                </div>
                <div class="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                  <p class="mb-0">Discount (0%)</p>
                  <p class="text-dark fw-medium mb-2">$400</p>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2 pe-3">
                  <p class="mb-0">VAT (5%)</p>
                  <p class="text-dark fw-medium mb-2">$54</p>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2 pe-3">
                  <h5>Total Amount</h5>
                  <h5>$5775</h5>
                </div>
                <p class="fs-12">
                  Amount in Words : Dollar Five thousand Seven Seventy Five
                </p>
              </div>
            </div>
            <div class="row align-items-center border-bottom mb-3">
              <div class="col-md-7">
                <div>
                  <div class="mb-3">
                    <h6 class="mb-1">Terms and Conditions</h6>
                    <p>
                      Please pay within 15 days from the date of invoice,
                      overdue interest @ 14% will be charged on delayed
                      payments.
                    </p>
                  </div>
                  <div class="mb-3">
                    <h6 class="mb-1">Notes</h6>
                    <p>Please quote invoice number when remitting funds.</p>
                  </div>
                </div>
              </div>
              <div class="col-md-5">
                <div class="text-end">
                  <img src="assets/img/sign.svg" class="img-fluid" alt="sign" />
                </div>
                <div class="text-end mb-3">
                  <h6 class="fs-14 fw-medium pe-3">Ted M. Davis</h6>
                  <p>Assistant Manager</p>
                </div>
              </div>
            </div>
            <div class="text-center">
              <div class="mb-3">
                <img
                  src="assets/img/logo.svg"
                  width="130"
                  class="img-fluid"
                  alt="logo"
                />
              </div>
              <p class="text-dark mb-1">
                Payment Made Via bank transfer / Cheque in the name of Thomas
                Lawler
              </p>
              <div class="d-flex justify-content-center align-items-center">
                <p class="fs-12 mb-0 me-3">
                  Bank Name : <span class="text-dark">HDFC Bank</span>
                </p>
                <p class="fs-12 mb-0 me-3">
                  Account Number : <span class="text-dark">45366287987</span>
                </p>
                <p class="fs-12">
                  IFSC : <span class="text-dark">HDFC0018159</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-center align-items-center mb-4">
          <a
            href="#"
            class="btn btn-primary d-flex justify-content-center align-items-center me-2"
          >
            <i class="ti ti-printer me-2"></i>Print Invoice
          </a>
          <a
            href="#"
            class="btn btn-secondary d-flex justify-content-center align-items-center border"
          >
            <i class="ti ti-copy me-2"></i>Clone Invoice
          </a>
        </div>
      </div>
    </div>
  );
};

export default QuotaionDetails;
