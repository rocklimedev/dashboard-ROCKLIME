import React from "react";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";

const Recents = () => {
  const { data: productData, isLoading: loadingProducts } =
    useGetAllProductsQuery();
  const { data: quotationData, isLoading: loadingQuotations } =
    useGetAllQuotationsQuery();
  const { data: invoiceData, isLoading: loadingInvoices } =
    useGetAllInvoicesQuery();
  const { data: orderData, isLoading: loadingOrders } = useGetAllOrdersQuery();

  const productCount = productData?.length || 0;
  const quotationCount = quotationData?.length || 0;
  const invoiceCount = invoiceData?.data?.length || 0;
  const orderCount = orderData?.orders?.length || 0;

  return (
    <div className="row">
      <div className="col-xl-3 col-sm-6 col-12 d-flex">
        <div className="card bg-primary sale-widget flex-fill">
          <div className="card-body d-flex align-items-center">
            <span className="sale-icon bg-white text-primary">
              <i className="ti ti-file-text fs-24"></i>
            </span>
            <div className="ms-2">
              <p className="text-white mb-1">Total Orders</p>
              <h4 className="text-white">
                {loadingOrders ? "..." : orderCount}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-3 col-sm-6 col-12 d-flex">
        <div className="card bg-secondary sale-widget flex-fill">
          <div className="card-body d-flex align-items-center">
            <span className="sale-icon bg-white text-secondary">
              <i className="ti ti-repeat fs-24"></i>
            </span>
            <div className="ms-2">
              <p className="text-white mb-1">Total Invoices</p>
              <h4 className="text-white">
                {loadingInvoices ? "..." : invoiceCount}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-3 col-sm-6 col-12 d-flex">
        <div className="card bg-teal sale-widget flex-fill">
          <div className="card-body d-flex align-items-center">
            <span className="sale-icon bg-white text-teal">
              <i className="ti ti-gift fs-24"></i>
            </span>
            <div className="ms-2">
              <p className="text-white mb-1">Total Quotations</p>
              <h4 className="text-white">
                {loadingQuotations ? "..." : quotationCount}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-3 col-sm-6 col-12 d-flex">
        <div className="card bg-info sale-widget flex-fill">
          <div className="card-body d-flex align-items-center">
            <span className="sale-icon bg-white text-info">
              <i className="ti ti-brand-pocket fs-24"></i>
            </span>
            <div className="ms-2">
              <p className="text-white mb-1">Total Products</p>
              <h4 className="text-white">
                {loadingProducts ? "..." : productCount}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recents;
