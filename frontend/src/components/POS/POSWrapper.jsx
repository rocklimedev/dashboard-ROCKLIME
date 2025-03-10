import React from "react";
import POSCategories from "./POSCategories";
import POSProducts from "./POSProducts";
import POSFooter from "./POSFooter";
import OrderList from "./OrderList";
import { useGetProfileQuery } from "../../api/userApi"; // Import API Hook
import AddCustomer from "../Customers/AddCustomer";
const POSWrapper = () => {
  const { data: user, isLoading, isError } = useGetProfileQuery();

  // Extract user name and format date
  const userName = user?.user?.name || "User";
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page-wrapper pos-pg-wrapper ms-0">
      <div className="content pos-design p-0">
        <div className="row align-items-start pos-wrapper">
          <div className="col-md-12 col-lg-7 col-xl-8">
            <div className="pos-categories tabs_wrapper pb-0">
              <div className="mb-3">
                {isLoading ? (
                  <h5 className="mb-1">Loading...</h5>
                ) : isError ? (
                  <h5 className="mb-1 text-danger">Error fetching user</h5>
                ) : (
                  <>
                    <h5 className="mb-1">Welcome, {userName}</h5>
                    <p>{currentDate}</p>
                  </>
                )}
                <div className="d-flex align-items-center flex-wrap mb-2">
                  <div className="input-icon-start search-pos position-relative mb-2 me-3">
                    <span className="input-icon-addon">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Product"
                    />
                  </div>
                  <a href="#" className="btn btn-sm btn-dark mb-2 me-2">
                    <i className="ti ti-tag me-1"></i>View All Brands
                  </a>
                  <a href="#" className="btn btn-sm btn-primary mb-2">
                    <i className="ti ti-star me-1"></i>Featured
                  </a>
                </div>
              </div>

              <div class="d-flex align-items-center flex-wrap justify-content-between">
                <POSCategories />
              </div>

              <div className="content-wrap">
                <div className="tab-content-wrap">
                  <div className="d-flex align-items-center justify-content-between flex-wrap mb-2"></div>
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
