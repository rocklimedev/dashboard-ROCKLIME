import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import POSCategories from "./POSCategories";
import POSProducts from "./POSProducts";
import POSFooter from "./POSFooter";
import OrderList from "./OrderList";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetCartQuery } from "../../api/cartApi";
import ShowQuotations from "./ShowQuotations";
import { useGetAllProductsQuery } from "../../api/productApi";

const POSWrapper = () => {
  const dispatch = useDispatch();
  const { data: user, isLoading, isError } = useGetProfileQuery();
  const { data: quotations, isLoading: isQuotationsLoading } =
    useGetAllQuotationsQuery();
  const [showQuotations, setShowQuotations] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const { data: cartData, refetch } = useGetCartQuery();

  useEffect(() => {
    refetch();
  }, [cartData, refetch]);

  const handleConvertToCart = (quotation) => {
    if (!quotation || !Array.isArray(quotation.products)) {
      console.error("Products array is undefined or not an array", quotation);
      return;
    }

    const cartData = {
      customerId: quotation.customerId,
      items: quotation.products.map((product) => ({
        id: product.productId, // Ensure this matches the key in your data
        name: product.name,
        quantity: product.quantity || 1,
        price: product.sellingPrice, // Ensure the correct key for price
      })),
      totalAmount: quotation.finalAmount,
    };

    console.log("Converted Cart Data:", cartData);
    // Here, you can dispatch an action to update the cart or handle API calls.
  };

  const filteredProducts = searchTerm
    ? products?.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

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
                  onConvertToOrder={handleConvertToCart}
                />
              )}

              <div className="d-flex align-items-center flex-wrap justify-content-between">
                <POSCategories />
              </div>

              <div className="content-wrap">
                <div className="tab-content-wrap">
                  <POSProducts
                    products={filteredProducts}
                    isLoading={isProductsLoading}
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
