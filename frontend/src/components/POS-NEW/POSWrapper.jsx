import React, { useState, useEffect } from "react";
import OrderCart from "./OrderCart";
import ProductsList from "./ProductsList";
import Categories from "./Categories";
import { useDispatch } from "react-redux";
import ShowQuotations from "../POS/ShowQuotations";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import logo from "../../assets/img/logo.png";

const POSWrapperNew = () => {
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
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    error: invoicesError,
  } = useGetAllInvoicesQuery();

  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    refetchCart();
  }, [cartData, refetchCart]);

  // Debug invoices data
  useEffect(() => {
    if (invoicesData) {
      console.log("Invoices Data:", invoicesData);
    }
    if (invoicesError) {
      console.error("Invoices Error:", invoicesError);
    }
  }, [invoicesData, invoicesError]);

  // Date filters (last 7 days, fallback to 30 days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filterByTime = (items, dateField) => {
    if (!Array.isArray(items)) {
      console.warn("filterByTime: Items is not an array", items);
      return [];
    }
    const weekItems = items.filter(
      (item) => item[dateField] && new Date(item[dateField]) >= oneWeekAgo
    );
    return weekItems.length > 0
      ? weekItems
      : items.filter(
          (item) => item[dateField] && new Date(item[dateField]) >= oneMonthAgo
        );
  };

  // Filter invoices and products
  const invoices = filterByTime(invoicesData?.data || [], "createdAt");
  const filteredProducts =
    products?.data?.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleConvertToCart = (data) => {
    if (!data || !Array.isArray(data.products)) {
      console.error("Invalid data for cart conversion", data);
      return;
    }

    const cartData = {
      customerId: data.customerId,
      items: data.products.map((product) => ({
        id: product.productId,
        name: product.name,
        quantity: product.quantity || 1,
        price: product.sellingPrice || product.price,
      })),
      totalAmount: data.finalAmount || data.totalAmount || 0,
    };

    // Dispatch or API call for updating cart (implement as needed)
    console.log("Converting to cart:", cartData);
  };

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
            <Categories />
            <ProductsList
              products={filteredProducts}
              isLoading={isProductsLoading}
            />
          </div>
        );
      case "invoices":
        return (
          <div className="invoice-list">
            {isInvoicesLoading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : invoicesError ? (
              <div className="alert alert-danger" role="alert">
                Error loading invoices:{" "}
                {invoicesError?.data?.message || "Unknown error"}
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-muted text-center">
                No invoices found for the selected period.
              </p>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {invoices.map((invoice) => (
                  <div key={invoice.invoiceId || invoice._id} className="col">
                    <div className="card h-100 shadow-sm">
                      <div className="card-body">
                        <h5 className="card-title fs-6 fw-bold text-primary">
                          Invoice #{invoice.invoiceId || invoice._id || "N/A"}
                        </h5>
                        <p className="card-text mb-1">
                          <span className="text-orange">Customer:</span>{" "}
                          {invoice.customerId || "Unknown"}
                        </p>
                        <p className="card-text mb-1">
                          <span className="text-orange">Total:</span> Rs{" "}
                          {(invoice.totalAmount || 0).toLocaleString()}
                        </p>
                        <p className="card-text mb-2 text-muted fs-6">
                          Date:{" "}
                          {invoice.createdAt
                            ? new Date(invoice.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <button
                          className="btn btn-outline-primary btn-sm w-100"
                          onClick={() => handleConvertToCart(invoice)}
                          disabled={
                            !invoice.products || invoice.products.length === 0
                          }
                        >
                          Convert to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
            <div className="pos-categories tabs_wrapper">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                <div>
                  {isUserLoading ? (
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : isUserError ? (
                    <h5 className="text-danger">Failed to Load User</h5>
                  ) : (
                    <>
                      <h5 className="mb-1">
                        <span className="text-orange me-2">👋</span> Welcome,{" "}
                        {userName}
                      </h5>
                      <p className="mb-1 text-muted">{userEmail}</p>
                      <p className="text-muted fs-6">
                        {currentDate} | {currentTime}
                      </p>
                    </>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <div className="input-icon-start pos-search position-relative">
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
                    className={`btn btn-sm ${
                      activeTab === "invoices"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("invoices")}
                  >
                    <i className="ti ti-receipt me-1"></i> Invoices
                  </button>
                  <button
                    className={`btn btn-sm ${
                      activeTab === "quotations"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("quotations")}
                  >
                    <i className="ti ti-star me-1"></i> Quotations
                  </button>
                  <button
                    className={`btn btn-sm ${
                      activeTab === "products"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("products")}
                  >
                    <i className="ti ti-box me-1"></i> Products
                  </button>
                </div>
              </div>
              {renderTabContent()}
            </div>
          </div>
          <OrderCart onConvertToOrder={handleConvertToCart} />
        </div>
      </div>
    </div>
  );
};

export default POSWrapperNew;
