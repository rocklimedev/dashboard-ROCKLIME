import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetProductByIdQuery } from "../../api/productApi";
import { globalStyles, componentStyles } from "./styles";

// Subcomponent for each product row
const ProductRow = ({ product, index }) => {
  const { data, isLoading, isError, error } = useGetProductByIdQuery(
    product.productId,
    { skip: !product.productId }
  );

  // Log errors for debugging
  if (isError) {
    console.log(`Product Query Error for ID ${product.productId}:`, error);
  }

  const prod = data || {};
  const productName = prod.name || "Unknown Product";
  const productCode = prod.product_code || "—";
  const price = parseFloat(product.price || prod.sellingPrice || 0);
  const quantity = parseInt(product.quantity || 0);

  return (
    <tr key={product.productId || index} style={componentStyles.tableRow}>
      <td>{index + 1}</td>
      <td>{isLoading ? "Loading..." : productName}</td>
      <td>{productCode}</td>
      <td>{quantity}</td>
      <td>₹{price.toFixed(2)}</td>
      <td>₹{(price * quantity).toFixed(2)}</td>
    </tr>
  );
};

const InvoiceDetails = () => {
  const { invoiceId } = useParams();
  const { data, isLoading, isError } = useGetInvoiceByIdQuery(invoiceId);
  const invoice = data?.data || {};

  // Parse products if it's a string
  let products = invoice.products || [];
  if (typeof products === "string") {
    try {
      products = JSON.parse(products);
    } catch (e) {
      console.error("Failed to parse products JSON:", e);
      products = [];
    }
  }

  // Ensure products is an array
  if (!Array.isArray(products)) {
    products = [];
  }

  // Parse paymentMethod if it's a string
  let paymentMethodParsed = invoice.paymentMethod || "N/A";
  if (typeof invoice.paymentMethod === "string") {
    try {
      paymentMethodParsed = JSON.parse(invoice.paymentMethod)?.method || "N/A";
    } catch (e) {
      console.error("Failed to parse paymentMethod JSON:", e);
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
  const {
    data: createdByUser,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetUserByIdQuery(createdBy, { skip: !createdBy });
  const { data: quotation, isLoading: isQuotationLoading } =
    useGetQuotationByIdQuery(quotationId, { skip: !quotationId });
  const {
    data: shipToAddress,
    isLoading: isAddressLoading,
    isError: isAddressError,
  } = useGetAddressByIdQuery(shipTo, { skip: !shipTo });

  // State for drag functionality
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  // Handle drag start
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY };
  };

  // Handle drag movement
  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      dragRef.current = { startX: e.clientX, startY: e.clientY };
    }
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Calculations
  const subTotal = products.reduce(
    (sum, p) => sum + parseFloat(p.price || 0) * parseInt(p.quantity || 0),
    0
  );
  const vat = subTotal * 0.18;
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

  // Debug styles and address
  console.log("globalStyles:", globalStyles);
  console.log("componentStyles:", componentStyles);
  console.log("ShipTo Address:", shipToAddress);

  // Loading and Error States
  if (isLoading || isAddressLoading || isUserLoading || isQuotationLoading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading invoice...
      </div>
    );
  }

  if (isError || isAddressError || isUserError) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        Error fetching invoice details.
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        No products found in this invoice.
      </div>
    );
  }

  return (
    <div
      className="page-wrapper"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div style={{ position: "absolute", top: "20px", left: "20px" }}>
        <Link to="/invoices/list" className="btn btn-primary">
          <i className="me-2" data-feather="arrow-left"></i>Back to Invoices
        </Link>
        <button
          className="btn btn-secondary"
          style={{ marginLeft: "10px" }}
          onClick={() => window.print()}
        >
          Print Invoice
        </button>
      </div>
      <div
        className="content draggable-content"
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "#fff",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div className="page-header" onMouseDown={handleMouseDown}>
          <h3 style={{ ...componentStyles.headerTitle, textAlign: "center" }}>
            Invoice #{invoiceNo}
          </h3>
        </div>

        {/* Invoice Details Section */}
        <div style={{ marginBottom: "30px" }}>
          <h4 style={{ ...componentStyles.sectionTitle, fontSize: "18px" }}>
            Invoice Details
          </h4>
          <div style={{ ...componentStyles.dateSection, marginBottom: "20px" }}>
            <p style={componentStyles.dateItem}>
              <strong>Invoice Date:</strong>{" "}
              {invoiceDate
                ? new Date(invoiceDate).toLocaleDateString()
                : "Not available"}
            </p>
            <p style={componentStyles.dateItem}>
              <strong>Due Date:</strong>{" "}
              {dueDate
                ? new Date(dueDate).toLocaleDateString()
                : "Not available"}
            </p>
            <p style={componentStyles.dateItem}>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color: status === "Paid" ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {status}
              </span>
            </p>
          </div>

          <table
            className="table"
            style={{ ...componentStyles.table, marginBottom: "20px" }}
          >
            <thead style={{ backgroundColor: "#f1f1f1" }}>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Product Code</th>
                <th>Qty</th>
                <th>Rate (₹)</th>
                <th>Amount (₹)</th>
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
            <tfoot>
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  Subtotal:
                </td>
                <td>₹{subTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  VAT (18%):
                </td>
                <td>₹{vat.toFixed(2)}</td>
              </tr>
              {parseFloat(amount) !== subTotal + vat && (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: "right", fontWeight: "bold" }}
                  >
                    Additional Fees:
                  </td>
                  <td>₹{(parseFloat(amount) - (subTotal + vat)).toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  Total:
                </td>
                <td style={{ fontWeight: "bold" }}>₹{total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p style={{ ...componentStyles.amountInWords, textAlign: "right" }}>
            <em>{amountInWords}</em>
          </p>
        </div>

        {/* Miscellaneous Section */}
        <div>
          <h4 style={{ ...componentStyles.sectionTitle, fontSize: "18px" }}>
            Miscellaneous
          </h4>
          <div
            className="row"
            style={{ ...componentStyles.addressRow, marginBottom: "20px" }}
          >
            <div className="col-md-6" style={componentStyles.addressCol}>
              <h6 style={componentStyles.addressTitle}>Bill To</h6>
              <p style={componentStyles.addressText}>{billTo}</p>
              <p style={componentStyles.addressText}>
                {createdByUser?.data?.email || "Not available"}
              </p>
            </div>
            <div className="col-md-6" style={componentStyles.addressCol}>
              <h6 style={componentStyles.addressTitle}>Ship To</h6>
              {isAddressLoading ? (
                <p style={componentStyles.addressText}>Loading address...</p>
              ) : isAddressError ? (
                <p style={{ ...componentStyles.addressText, color: "red" }}>
                  Error fetching address
                </p>
              ) : shipToAddress?.data ? (
                <>
                  <p style={componentStyles.addressText}>
                    {shipToAddress.data.street || "N/A"},{" "}
                    {shipToAddress.data.city || "N/A"}
                  </p>
                  <p style={componentStyles.addressText}>
                    {shipToAddress.data.state || "N/A"},{" "}
                    {shipToAddress.data.country || "N/A"} -{" "}
                    {shipToAddress.data.postalCode || "N/A"}
                  </p>
                </>
              ) : (
                <p style={componentStyles.addressText}>Not available</p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <p style={componentStyles.summaryItem}>
              <strong>Created By:</strong>{" "}
              {createdByUser?.data?.name || "Unknown"}
            </p>
            <p style={componentStyles.summaryItem}>
              <strong>Payment Method:</strong> {paymentMethodParsed}
            </p>
            {quotationId && (
              <p style={componentStyles.summaryItem}>
                <strong>Quotation ID:</strong>{" "}
                {quotation?.data?.quotationNo || quotationId}
              </p>
            )}
          </div>

          <div style={componentStyles.termsSection}>
            <h6 style={componentStyles.termsTitle}>Terms & Conditions</h6>
            <ul style={componentStyles.termsList}>
              {termsList.map((term, idx) => (
                <li key={idx} style={componentStyles.termsItem}>
                  {term}
                </li>
              ))}
            </ul>
          </div>

          {signatureName && (
            <div
              style={{
                ...componentStyles.signatureSection,
                textAlign: "right",
              }}
            >
              <p style={componentStyles.signatureLabel}>Authorized Signatory</p>
              <h6 style={componentStyles.signatureName}>{signatureName}</h6>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
