import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import POSCategories from "./POSCategories";
import POSProducts from "./POSProducts";
import POSFooter from "./POSFooter";
import OrderList from "./OrderList";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useSearchProductsQuery } from "../../api/productApi";
import { useGetCartQuery, useConvertToCartMutation } from "../../api/cartApi"; // Import mutation
import ShowQuotations from "./ShowQuotations";

const POSWrapper = () => {
  const dispatch = useDispatch();
  const { data: user, isLoading, isError } = useGetProfileQuery();
  const { data: quotations, isLoading: isQuotationsLoading } =
    useGetAllQuotationsQuery();

  const [showQuotations, setShowQuotations] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults, isLoading: isSearchLoading } =
    useSearchProductsQuery(searchTerm, {
      skip: searchTerm.length < 2,
    });

  const { data: cartData, refetch } = useGetCartQuery();

  const [convertToCart] = useConvertToCartMutation();
  useEffect(() => {
    refetch();
  }, [cartData, refetch]);

  const handleConvertToCart = async (quotationId) => {
    console.log("Converting quotation to cart:", quotationId);
    if (!quotationId) {
      console.error("Invalid quotation ID");
      return;
    }
    try {
      const response = await convertToCart(quotationId);
      console.log("Cart converted:", response.data);
    } catch (error) {
      console.error("Error converting quotation:", error);
    }
  };

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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <a href="#" className="btn btn-sm btn-dark mb-2 me-2">
                    <i className="ti ti-tag me-1"></i>View All Brands
                  </a>
                  <button
                    className="btn btn-sm btn-dark mb-2 me-2"
                    onClick={() => setShowQuotations(!showQuotations)}
                  >
                    <i className="ti ti-star me-1"></i>Choose from Quotations
                  </button>
                </div>
              </div>

              {showQuotations && (
                <ShowQuotations
                  isQuotationsLoading={isQuotationsLoading}
                  quotations={quotations}
                  onConvertToOrder={handleConvertToCart} // Correct the prop name
                />
              )}

              <div className="d-flex align-items-center flex-wrap justify-content-between">
                <POSCategories />
              </div>

              <div className="content-wrap">
                <div className="tab-content-wrap">
                  <POSProducts
                    products={searchTerm.length > 1 ? searchResults : []}
                    isLoading={isSearchLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          <OrderList onConvertToOrder={handleConvertToCart} />
        </div>

        <POSFooter />
      </div>
    </div>
  );
};

export default POSWrapper;
