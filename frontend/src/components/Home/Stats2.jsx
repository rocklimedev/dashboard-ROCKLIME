import React from "react";

const Stats2 = () => {
  return (
    <div class="row">
      <div class="col-xxl-4 col-md-6 d-flex">
        <div class="card flex-fill">
          <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="d-inline-flex align-items-center">
              <span class="title-icon bg-soft-orange fs-16 me-2">
                <i class="ti ti-users"></i>
              </span>
              <h5 class="card-title mb-0">Top Customers</h5>
            </div>
            <a
              href="customers.html"
              class="fs-13 fw-medium text-decoration-underline"
            >
              View All
            </a>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3 flex-wrap gap-2">
              <div class="d-flex align-items-center">
                <a
                  href="javascript:void(0);"
                  class="avatar avatar-lg flex-shrink-0"
                >
                  <img src="assets/img/customer/customer11.jpg" alt="img" />
                </a>
                <div class="ms-2">
                  <h6 class="fs-14 fw-bold mb-1">
                    <a href="javascript:void(0);">Carlos Curran</a>
                  </h6>
                  <div class="d-flex align-items-center item-list">
                    <p class="d-inline-flex align-items-center">
                      <i class="ti ti-map-pin me-1"></i>USA
                    </p>
                    <p>24 Orders</p>
                  </div>
                </div>
              </div>
              <div class="text-end">
                <h5>$8,9645</h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xxl-4 col-md-6 d-flex">
        <div class="card flex-fill">
          <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="d-inline-flex align-items-center">
              <span class="title-icon bg-soft-orange fs-16 me-2">
                <i class="ti ti-users"></i>
              </span>
              <h5 class="card-title mb-0">Top Categories</h5>
            </div>
            <div class="dropdown">
              <a
                href="javascript:void(0);"
                class="dropdown-toggle btn btn-sm btn-white d-flex align-items-center"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="ti ti-calendar me-1"></i>Weekly
              </a>
              <ul class="dropdown-menu p-3">
                <li>
                  <a href="javascript:void(0);" class="dropdown-item">
                    Today
                  </a>
                </li>
                <li>
                  <a href="javascript:void(0);" class="dropdown-item">
                    Weekly
                  </a>
                </li>
                <li>
                  <a href="javascript:void(0);" class="dropdown-item">
                    Monthly
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-4 mb-4">
              <div>
                <canvas id="top-category" height="230" width="200"></canvas>
              </div>
              <div>
                <div class="category-item category-primary">
                  <p class="fs-13 mb-1">Electronics</p>
                  <h2 class="d-flex align-items-center">
                    698
                    <span class="fs-13 fw-normal text-default ms-1">Sales</span>
                  </h2>
                </div>
                <div class="category-item category-orange">
                  <p class="fs-13 mb-1">Sports</p>
                  <h2 class="d-flex align-items-center">
                    545
                    <span class="fs-13 fw-normal text-default ms-1">Sales</span>
                  </h2>
                </div>
                <div class="category-item category-secondary">
                  <p class="fs-13 mb-1">Lifestyles</p>
                  <h2 class="d-flex align-items-center">
                    456
                    <span class="fs-13 fw-normal text-default ms-1">Sales</span>
                  </h2>
                </div>
              </div>
            </div>
            <h6 class="mb-2">Category Statistics</h6>
            <div class="border br-8">
              <div class="d-flex align-items-center justify-content-between border-bottom p-2">
                <p class="d-inline-flex align-items-center mb-0">
                  <i class="ti ti-square-rounded-filled text-indigo fs-8 me-2"></i>
                  Total Number Of Categories
                </p>
                <h5>698</h5>
              </div>
              <div class="d-flex align-items-center justify-content-between p-2">
                <p class="d-inline-flex align-items-center mb-0">
                  <i class="ti ti-square-rounded-filled text-orange fs-8 me-2"></i>
                  Total Number Of Products
                </p>
                <h5>7899</h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xxl-4 col-md-12 d-flex">
        <div class="card flex-fill">
          <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="d-inline-flex align-items-center">
              <span class="title-icon bg-soft-indigo fs-16 me-2">
                <i class="ti ti-package"></i>
              </span>
              <h5 class="card-title mb-0">Order Statistics</h5>
            </div>
            <div class="dropdown">
              <a
                href="javascript:void(0);"
                class="dropdown-toggle btn btn-sm btn-white"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="ti ti-calendar me-1"></i>Weekly
              </a>
              <ul class="dropdown-menu p-3">
                <li>
                  <a href="javascript:void(0);" class="dropdown-item">
                    Today
                  </a>
                </li>
                <li>
                  <a href="javascript:void(0);" class="dropdown-item">
                    Weekly
                  </a>
                </li>
                <li>
                  <a href="javascript:void(0);" class="dropdown-item">
                    Monthly
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div class="card-body pb-0">
            <div id="heat_chart"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats2;
