import React from "react";
import POSCategories from "./POSCategories";
import POSProducts from "./POSProducts";
import POSFooter from "./POSFooter";
import OrderList from "./OrderList";

const POSWrapper = () => {
  return (
    <div class="page-wrapper pos-pg-wrapper ms-0">
      <div class="content pos-design p-0">
        <div class="row pos-wrapper">
          <div class="col-md-12 col-lg-7 col-xl-8 d-flex">
            <div class="pos-categories tabs_wrapper p-0 flex-fill">
              <div class="content-wrap">
                <POSCategories />
                <div class="tab-content-wrap">
                  <div class="d-flex align-items-center justify-content-between flex-wrap mb-2">
                    <div class="mb-3">
                      <h5 class="mb-1">Welcome, Wesley Adrian</h5>
                      <p>December 24, 2024</p>
                    </div>
                    <div class="d-flex align-items-center flex-wrap mb-2">
                      <div class="input-icon-start search-pos position-relative mb-2 me-3">
                        <span class="input-icon-addon">
                          <i class="ti ti-search"></i>
                        </span>
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Search Product"
                        />
                      </div>
                      <a href="#" class="btn btn-sm btn-dark mb-2 me-2">
                        <i class="ti ti-tag me-1"></i>View All Brands
                      </a>
                      <a href="#" class="btn btn-sm btn-primary mb-2">
                        <i class="ti ti-star me-1"></i>Featured
                      </a>
                    </div>
                  </div>
                  <POSProducts />
                </div>
              </div>
            </div>
          </div>

          <OrderList />
        </div>

        <POSFooter />
      </div>
    </div>
  );
};

export default POSWrapper;
