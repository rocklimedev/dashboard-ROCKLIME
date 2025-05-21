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
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import logo from "../../assets/img/logo.png";
import { toast } from "sonner";
const POSWrapper = () => {
  const dispatch = useDispatch();

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetProfileQuery();
  const { data: quotations, isLoading: isQuotationsLoading } =
    useGetAllQuotationsQuery();
  const { data: products, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const { data: cartData, refetch: refetchCart } = useGetCartQuery();
  const { data: brands, isLoading: isBrandsLoading } = useGetAllBrandsQuery();

  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBrand, setActiveBrand] = useState(null);

  useEffect(() => {
    refetchCart();
  }, [cartData, refetchCart]);

  const handleConvertToCart = (quotation) => {
    if (!quotation || !Array.isArray(quotation.products)) {
      toast.error("Invalid quotation data", quotation);
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

    // Dispatch or API call for updating cart
  };

  const handleBrandClick = (brand) => {
    setActiveBrand(brand);
  };

  const filteredProducts = activeBrand
    ? products?.filter((product) => product.brandId === activeBrand.id)
    : products?.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const userName = user?.user?.name || "Guest User";
  const userEmail = user?.user?.email || "No Email Provided";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
        <div className="row pos-wrapper">
          <div className="col-md-12 col-lg-7 col-xl-8 d-flex">
            <div className="pos-categories tabs_wrapper p-0 flex-fill">
              <div className="tab-content-wrap">
                <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
                  <div>
                    {isUserLoading ? (
                      <h5>Loading User...</h5>
                    ) : isUserError ? (
                      <h5 className="text-danger">Failed to Load User</h5>
                    ) : (
                      <>
                        <h5 className="mb-1">👋 Welcome, {userName}</h5>
                        <p className="mb-1">{userEmail}</p>
                        <p className="text-muted">
                          {currentDate} | {currentTime}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="d-flex align-items-center flex-wrap">
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
                      <i className="ti ti-tag me-1"></i> Brands
                    </button>
                    <button
                      className="btn btn-sm btn-dark mb-2 me-2"
                      onClick={() => setActiveTab("quotations")}
                    >
                      <i className="ti ti-star me-1"></i> Quotations
                    </button>
                    <button
                      className="btn btn-sm btn-dark mb-2"
                      onClick={() => setActiveTab("products")}
                    >
                      <i className="ti ti-box me-1"></i> Products
                    </button>
                  </div>
                </div>
                {renderTabContent()}
              </div>
            </div>
            <OrderList onConvertToOrder={handleConvertToCart} />
          </div>
        </div>
        <POSFooter />
      </div>
    </div>
  );
};

export default POSWrapper;
