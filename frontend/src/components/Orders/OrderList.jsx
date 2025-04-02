import React, { useState } from "react";
import OrderItem from "./Orderitem";
import { useRecentOrdersQuery } from "../../api/orderApi";
const OrderList = () => {
  const { data, error, isLoading } = useRecentOrdersQuery();
  const [selectedTab, setSelectedTab] = useState(0);

  if (isLoading) return <p>Loading...</p>;
  // if (error) return <p>Error loading orders!</p>;
  return (
    <div class="tab-content" id="v-pills-tabContent2">
      <div
        class="tab-pane fade active show"
        id="v-pills-profile"
        role="tabpanel"
        aria-labelledby="v-pills-profile-tab"
      >
        <div class="border-bottom mb-4 pb-4">
          <div class="row">
            <div class="col-md-12">
              <div class="d-flex align-items-center justify-content-between flex-wrap mb-2">
                <div class="d-flex align-items-center mb-3">
                  <h4>Important </h4>
                  <div class="owl-nav slide-nav5 text-end nav-control ms-3"></div>
                </div>
                <div class="notes-close mb-3">
                  <a href="javascript:void(0);" class="text-danger fs-15">
                    <i class="fas fa-times me-1"></i> Close{" "}
                  </a>
                </div>
              </div>
            </div>
            <div class="col-md-12">
              <div class="notes-slider owl-carousel">
                <div class="card rounded-3 mb-0">
                  <OrderItem />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-4 d-flex">
            <div class="card rounded-3 mb-4 flex-fill">
              <OrderItem />
            </div>
          </div>
        </div>
      </div>
      <div
        class="tab-pane fade"
        id="v-pills-messages"
        role="tabpanel"
        aria-labelledby="v-pills-messages-tab"
      >
        <div class="row">
          <div class="col-md-4 d-flex">
            <div class="card rounded-3 mb-4 flex-fill">
              <OrderItem />
            </div>
          </div>
        </div>
      </div>
      <div
        class="tab-pane fade"
        id="v-pills-settings"
        role="tabpanel"
        aria-labelledby="v-pills-settings-tab"
      >
        <div class="row">
          <div class="col-12 d-flex align-items-center justify-content-end">
            <a href="#" class="btn btn-danger mb-4">
              <span>
                {" "}
                <i class="ti ti-trash f-20 me-2"></i>{" "}
              </span>
              Restore all
            </a>
          </div>
        </div>
        <div class="row">
          <div class="col-md-4 d-flex">
            <div class="card rounded-3 mb-4 flex-fill">
              <OrderItem />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
