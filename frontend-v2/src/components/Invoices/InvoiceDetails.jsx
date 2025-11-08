import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetProductByIdQuery } from "../../api/productApi";
import { useGetCompanyByIdQuery } from "../../api/companyApi"; // Import the company API hook
import logo from "../../assets/img/logo.png";
import {
  DownloadOutlined,
  LeftOutlined,
  PrinterOutlined,
  CopyOutlined,
} from "@ant-design/icons";
// Subcomponent for each product row (unchanged)
const ProductRow = ({ product, index }) => {
  const { data, isLoading, isError, error } = useGetProductByIdQuery(
    product.productId,
    { skip: !product.productId }
  );

  const prod = data || {};
  const productName = prod.name || "Unknown Product";
  const price = parseFloat(product.price || prod.sellingPrice || 0);
  const quantity = parseInt(product.quantity || 0);
  const discount = 0; // Assuming no discount data is provided; adjust as needed

  return (
    <tr>
      <td>
        <h6>{isLoading ? "Loading..." : productName}</h6>
      </td>
      <td className="text-gray-9 fw-medium text-end">{quantity}</td>
      <td className="text-gray-9 fw-medium text-end">₹{price.toFixed(2)}</td>
      <td className="text-gray-9 fw-medium text-end">₹{discount.toFixed(2)}</td>
      <td className="text-gray-9 fw-medium text-end">
        ₹{(price * quantity).toFixed(2)}
      </td>
    </tr>
  );
};

const InvoiceDetails = () => {
  const { invoiceId } = useParams();
  const {
    data: invoiceData,
    isLoading: isInvoiceLoading,
    isError: isInvoiceError,
  } = useGetInvoiceByIdQuery(invoiceId);
  const invoice = invoiceData?.data || {};

  // Fetch company details for "CHABBRA MARBEL"
  const companyId = "401df7ef-f350-4bc4-ba6f-bf36923af252";
  const {
    data: companyData,
    isLoading: isCompanyLoading,
    isError: isCompanyError,
  } = useGetCompanyByIdQuery(companyId, { skip: !companyId });
  const company = companyData?.data || {};

  // Parse products
  let products = invoice.products || [];
  if (typeof products === "string") {
    try {
      products = JSON.parse(products);
    } catch (e) {
      products = [];
    }
  }
  if (!Array.isArray(products)) {
    products = [];
  }

  // Parse paymentMethod
  let paymentMethodParsed = invoice.paymentMethod || "N/A";
  if (typeof invoice.paymentMethod === "string") {
    try {
      paymentMethodParsed = JSON.parse(invoice.paymentMethod)?.method || "N/A";
    } catch (e) {
      paymentMethodParsed = "N/A";
    }
  }

  const {
    invoiceNo = "N/A",
    createdBy = "",
    quotationId = null,
    billTo = "N/A",
    shipTo = "",
    amount = "0.00",
    invoiceDate = "",
    dueDate = "",
    status = "Unknown",
    signatureName = "",
  } = invoice;

  // Fetch additional data
  const { data: createdByUser, isLoading: isUserLoading } = useGetUserByIdQuery(
    createdBy,
    { skip: !createdBy }
  );
  const { data: quotation, isLoading: isQuotationLoading } =
    useGetQuotationByIdQuery(quotationId, { skip: !quotationId });
  const { data: shipToAddress, isLoading: isAddressLoading } =
    useGetAddressByIdQuery(shipTo, { skip: !shipTo });

  // Calculations
  const subTotal = products.reduce(
    (sum, p) => sum + parseFloat(p.price || 0) * parseInt(p.quantity || 0),
    0
  );
  const vat = subTotal * 0.05; // Using 5% VAT as per the provided HTML
  const total = parseFloat(amount) || subTotal + vat;

  const amountInWords = total
    ? `Rupees ${Math.floor(total).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })} only`
    : "Amount not available";

  // Terms and Conditions
  const termsList = [
    "Payment is due within 15 days from the invoice date.",
    "Late payment may incur additional charges.",
    "Goods once sold will not be taken back or exchanged.",
    "All disputes are subject to jurisdiction of Delhi courts only.",
    "Please verify all details and contact us in case of any discrepancies.",
  ];

  // Loading and Error States
  if (
    isInvoiceLoading ||
    isAddressLoading ||
    isUserLoading ||
    isQuotationLoading ||
    isCompanyLoading
  ) {
    return <div className="text-center p-4">Loading invoice...</div>;
  }

  if (isInvoiceError || isCompanyError) {
    return (
      <div className="text-center p-4 text-danger">
        Error fetching invoice or company details.
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Invoices</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item active" aria-current="page">
                  Manage your Invoice
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="mb-2">
              <button className="btn btn-dark d-flex align-items-center">
                <DownloadOutlined />
                Download
              </button>
            </div>
          </div>
        </div>
        {/* /Breadcrumb */}

        {/* Invoices */}
        <div>
          <div className="row">
            <div className="col-sm-10 mx-auto">
              <Link
                to="/orders/list"
                className="back-icon d-flex align-items-center fs-12 fw-medium mb-3 d-inline-flex"
              >
                <span className="d-flex justify-content-center align-items-center rounded-circle me-2">
                  <LeftOutlined />
                </span>
                Back to List
              </Link>
              <div className="card">
                <div className="card-body">
                  {/* Header Section */}
                  <div className="row justify-content-between align-items-center border-bottom mb-3">
                    <div className="col-md-6">
                      <div className="mb-2">
                        <img src={logo} className="img-fluid" alt="logo" />
                      </div>
                      <h4>{company.name || "CHABBRA MARBEL"}</h4>
                      <p>
                        {company.address || "123, Main Street, Mumbai, India"}
                      </p>
                      <p>
                        Website:{" "}
                        <a href={company.website || "https://cmtradingco.com/"}>
                          {company.website || "https://cmtradingco.com/"}
                        </a>
                      </p>
                    </div>
                    <div className="col-md-6">
                      <div className="text-end mb-3">
                        <h5 className="text-gray mb-1">
                          Invoice No{" "}
                          <span className="text-primary">#{invoiceNo}</span>
                        </h5>
                        <p className="mb-1 fw-medium">
                          Created Date :{" "}
                          <span className="text-dark">
                            {invoiceDate
                              ? new Date(invoiceDate).toLocaleDateString()
                              : "Not available"}
                          </span>
                        </p>
                        <p className="fw-medium">
                          Due Date :{" "}
                          <span className="text-dark">
                            {dueDate
                              ? new Date(dueDate).toLocaleDateString()
                              : "Not available"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* From/To Section */}
                  <div className="row border-bottom mb-3">
                    <div className="col-md-5">
                      <p className="text-dark mb-2 fw-semibold">From</p>
                      <div>
                        <h4 className="mb-1">
                          {createdByUser?.data?.name ||
                            company.name ||
                            "CHABBRA MARBEL"}
                        </h4>
                        <p className="mb-1">
                          {company.address || "123, Main Street, Mumbai, India"}
                        </p>
                        <p className="mb-1">
                          Email :{" "}
                          <span className="text-dark">
                            {createdByUser?.data?.email || "Not available"}
                          </span>
                        </p>
                        <p>
                          Phone :{" "}
                          <span className="text-dark">+1 987 654 3210</span>
                        </p>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <p className="text-dark mb-2 fw-semibold">To</p>
                      <div>
                        <h4 className="mb-1">{billTo}</h4>
                        <p className="mb-1">
                          {shipToAddress?.data
                            ? `${shipToAddress.data.street || "N/A"}, ${
                                shipToAddress.data.city || "N/A"
                              }, ${shipToAddress.data.state || "N/A"}, ${
                                shipToAddress.data.country || "N/A"
                              } - ${shipToAddress.data.postalCode || "N/A"}`
                            : "Not available"}
                        </p>
                        <p className="mb-1">
                          Email :{" "}
                          <span className="text-dark">sarainc@example.com</span>
                        </p>
                        <p>
                          Phone :{" "}
                          <span className="text-dark">+1 987 471 6589</span>
                        </p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="mb-3">
                        <p className="text-title mb-2 fw-medium">
                          Payment Status
                        </p>
                        <span
                          className={`badge ${
                            status === "Paid" ? "badge-success" : "badge-danger"
                          } align-items-center mb-3`}
                        >
                          <i className="ti ti-point-filled"></i>
                          {status === "Paid" ? "Paid" : "Due in 10 Days"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div>
                    <div className="table-responsive mb-3">
                      <table className="table">
                        <thead className="thead-light">
                          <tr>
                            <th>Products</th>
                            <th className="text-end">Qty</th>
                            <th className="text-end">Cost</th>
                            <th className="text-end">Discount</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product, idx) => (
                            <ProductRow
                              key={product.productId || idx}
                              product={product}
                              index={idx}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="row border-bottom mb-3">
                    <div className="col-md-7">
                      <div className="py-4">
                        <div className="mb-3">
                          <h6 className="mb-1">Terms and Conditions</h6>
                          {termsList.map((term, idx) => (
                            <p key={idx}>{term}</p>
                          ))}
                        </div>
                        <div className="mb-3">
                          <h6 className="mb-1">Notes</h6>
                          <p>
                            Please quote invoice number when remitting funds.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                        <p className="mb-0">Sub Total</p>
                        <p className="text-dark fw-medium mb-2">
                          ₹{subTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                        <p className="mb-0">Discount(0%)</p>
                        <p className="text-dark fw-medium mb-2">₹0.00</p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                        <p className="mb-0">VAT(5%)</p>
                        <p className="text-dark fw-medium mb-2">
                          ₹{vat.toFixed(2)}
                        </p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                        <h5>Total Amount</h5>
                        <h5>₹{total.toFixed(2)}</h5>
                      </div>
                      <p className="fs-12">{amountInWords}</p>
                    </div>
                  </div>

                  {/* Signature Section */}
                  {signatureName && (
                    <div className="row justify-content-end align-items-end text-end border-bottom mb-3">
                      <div className="col-md-3">
                        <div className="text-end">
                          <img
                            src="https://smarthr.co.in/demo/html/template/assets/img/sign.svg"
                            className="img-fluid"
                            alt="sign"
                          />
                        </div>
                        <div className="text-end mb-3">
                          <h6 className="fs-14 fw-medium pe-3">
                            {signatureName}
                          </h6>
                          <p>Assistant Manager</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Section */}
                  <div className="text-center">
                    <div className="mb-3">
                      <img src={logo} className="img-fluid" alt="logo" />
                    </div>
                    <p className="text-dark mb-1">
                      Payment Made Via {paymentMethodParsed} in the name of{" "}
                      {company.name ||
                        createdByUser?.data?.name ||
                        "CHABBRA MARBEL"}
                    </p>
                    <div className="d-flex justify-content-center align-items-center">
                      <p className="fs-12 mb-0 me-3">
                        Bank Name : <span className="text-dark">HDFC Bank</span>
                      </p>
                      <p className="fs-12 mb-0 me-3">
                        Account Number :{" "}
                        <span className="text-dark">45366287987</span>
                      </p>
                      <p className="fs-12">
                        IFSC : <span className="text-dark">HDFC0018159</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Invoices */}

        {/* Action Buttons */}
        <div className="d-flex justify-content-center align-items-center mb-4">
          <button
            className="btn btn-primary d-flex justify-content-center align-items-center me-2"
            onClick={() => window.print()}
          >
            <PrinterOutlined />
            Print Invoice
          </button>
          <button className="btn btn-white d-flex justify-content-center align-items-center border">
            <CopyOutlined />
            Clone Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
