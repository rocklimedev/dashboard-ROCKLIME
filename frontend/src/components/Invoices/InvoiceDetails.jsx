import React from "react";
import { useParams, Link } from "react-router-dom";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
const InvoiceDetails = () => {
  const { invoiceId } = useParams();
  const { data, isLoading, isError } = useGetInvoiceByIdQuery(invoiceId);
  const invoice = data?.data || [];
  const { data: createdByUser } = useGetCustomerByIdQuery(invoice?.createdBy, {
    skip: !invoice?.createdBy,
  });

  const { data: quotation } = useGetQuotationByIdQuery(invoice?.quotationId, {
    skip: !invoice?.quotationId,
  });

  if (isLoading) return <div>Loading invoice...</div>;
  if (isError) return <div>Error fetching invoice.</div>;

  const {
    invoiceNo = "",
    createdBy = "",
    quotationId = "",
    billTo = "",
    shipTo = "",
    amount = "",
    invoiceDate = "",
    dueDate = "",
    paymentMethod = "",
    status = "",
    products = [],
    signatureName = "",
  } = invoice || {};

  const subTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const vat = subTotal * 0.18;
  const total = subTotal + vat;

  const amountInWords = total
    ? `Rupees ${total.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })} only`
    : "Amount not available";

  const termsList = [
    "Payment is due within 15 days from the invoice date.",
    "Late payment may incur additional charges.",
    "Goods once sold will not be taken back or exchanged.",
    "All disputes are subject to jurisdiction of Delhi courts only.",
    "Please verify all details and contact us in case of any discrepancies.",
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Invoice Details</h4>
            </div>
          </div>
          <div className="page-btn">
            <a href="/invoices" className="btn btn-primary">
              <i data-feather="arrow-left" className="me-2"></i>Back to Invoices
            </a>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="row justify-content-between border-bottom mb-3">
              <div className="col-md-6">
                <img src="/assets/img/logo.svg" width="130" alt="logo" />
                <p>123 Main Street, New York, NY</p>
              </div>
              <div className="col-md-6 text-end">
                <h5>
                  Invoice No: <span className="text-primary">{invoiceNo}</span>
                </h5>
                <p>Invoice Date: {invoiceDate}</p>
                <p>Due Date: {dueDate}</p>
                {quotationId && (
                  <p>
                    Quotation:{" "}
                    <Link to={`/quotations/${quotationId}`}>
                      View Quotation
                    </Link>
                  </p>
                )}
                {createdByUser && (
                  <p>
                    Created By: <strong>{createdByUser.name}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="row border-bottom mb-3">
              <div className="col-md-5">
                <h5>Bill To</h5>
                <p>{billTo}</p>
              </div>
              <div className="col-md-5">
                <h5>Ship To</h5>
                <p>{shipTo}</p>
              </div>
              <div className="col-md-2 text-end">
                <p>Status</p>
                <span
                  className={`badge bg-${
                    status === "Paid" ? "success" : "warning"
                  }`}
                >
                  {status || "Pending"}
                </span>
              </div>
            </div>

            <div className="table-responsive mb-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th className="text-end">Quantity</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productId}</td>
                      <td className="text-end">{item.quantity}</td>
                      <td className="text-end">₹{item.price}</td>
                      <td className="text-end">
                        ₹{item.price * item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row border-bottom mb-3">
              <div className="col-md-5 ms-auto">
                <div className="d-flex justify-content-between">
                  <p>Subtotal</p>
                  <p>₹{subTotal.toFixed(2)}</p>
                </div>
                <div className="d-flex justify-content-between">
                  <p>VAT (18%)</p>
                  <p>₹{vat.toFixed(2)}</p>
                </div>
                <div className="d-flex justify-content-between fw-bold">
                  <h5>Total</h5>
                  <h5>₹{total.toFixed(2)}</h5>
                </div>
                <p className="fs-12">Amount in Words: {amountInWords}</p>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-7">
                <h6>Terms and Conditions</h6>
                <ul className="fs-14">
                  {termsList.map((term, idx) => (
                    <li key={idx}>{term}</li>
                  ))}
                </ul>
              </div>
              <div className="col-md-5 text-end">
                <h6 className="mt-4">
                  Signed by: {signatureName || "Authorized Signatory"}
                </h6>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="fs-14">
                Payment Made Via bank transfer / Cheque in the name of Your
                Company
              </p>
              <p className="fs-12 mb-0">
                Bank Name: <strong>ABC Bank</strong> | Account Number:{" "}
                <strong>1234567890</strong> | IFSC: <strong>ABC0123456</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
