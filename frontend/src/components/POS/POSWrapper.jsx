import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import POSCategories from "./POSCategories";
import POSProducts from "./POSProducts";
import POSFooter from "./POSFooter";
import OrderList from "./OrderList";
import ShowQuotations from "./ShowQuotations";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetAllProductsQuery } from "../../api/productApi"; // Assuming you have a brand API
import { useGetAllBrandsQuery } from "../../api/brandsApi";
const POSWrapper = () => {
  const dispatch = useDispatch();
  const { data: user, isLoading, isError } = useGetProfileQuery();
  const { data: quotations, isLoading: isQuotationsLoading } =
    useGetAllQuotationsQuery();
  const { data: products, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const { data: cartData, refetch } = useGetCartQuery();
  const { data: brands, isLoading: isBrandsLoading } = useGetAllBrandsQuery(); // Fetch all brands

  const [activeTab, setActiveTab] = useState("products"); // Tab switching logic
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBrand, setActiveBrand] = useState(null); // Active brand for filtering products

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
        id: product.productId,
        name: product.name,
        quantity: product.quantity || 1,
        price: product.sellingPrice,
      })),
      totalAmount: quotation.finalAmount,
    };

    console.log("Converted Cart Data:", cartData);
    // Handle cart update or API calls
  };

  const filteredProducts = activeBrand
    ? products?.filter((product) => product.brandId === activeBrand.id)
    : products?.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const userName = user?.user?.name || "User";
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleBrandClick = (brand) => {
    setActiveBrand(brand); // Set the active brand for filtering
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "quotations":
        return (
          <ShowQuotations
            isQuotationsLoading={isQuotationsLoading}
            quotations={quotations}
            onConvertToOrder={handleConvertToCart}
          />
        );
      case "products":
        return (
          <div className="content-wrap">
            <POSCategories />
            <POSProducts
              products={filteredProducts}
              isLoading={isProductsLoading}
            />
          </div>
        );
      case "brands":
        return (
          <div className="brand-list">
            {isBrandsLoading ? (
              <p>Loading Brands...</p>
            ) : (
              brands?.map((brand) => (
                <div
                  key={brand.id}
                  className="brand-card"
                  onClick={() => handleBrandClick(brand)}
                >
                  <h5>{brand.name}</h5>
                  <p>Total Products: {brand.totalProducts}</p>
                </div>
              ))
            )}
          </div>
        );
      default:
        return null;
    }
  };

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
                  <button
                    className="btn btn-sm btn-dark mb-2 me-2"
                    onClick={() => setActiveTab("brands")}
                  >
                    <i className="ti ti-tag me-1"></i>View All Brands
                  </button>
                  <button
                    className="btn btn-sm btn-dark mb-2 me-2"
                    onClick={() => setActiveTab("quotations")}
                  >
                    <i className="ti ti-star me-1"></i>Choose from Quotations
                  </button>
                  <button
                    className="btn btn-sm btn-dark mb-2 me-2"
                    onClick={() => setActiveTab("products")}
                  >
                    <i className="ti ti-box me-1"></i>View Products
                  </button>
                </div>
              </div>

              {renderTabContent()}
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
