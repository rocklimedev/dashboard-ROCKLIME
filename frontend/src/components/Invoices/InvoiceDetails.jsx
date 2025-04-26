import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetProductByIdQuery } from "../../api/productApi"; // Import product query
import { globalStyles, componentStyles } from "./styles";

// Subcomponent for each product row
const ProductRow = ({ product, index }) => {
  const { data, isLoading, isError } = useGetProductByIdQuery(
    product.productId,
    {
      skip: !product.productId,
    }
  );

  const prod = data || {};
  const productName = data?.name || "N/A";
  return (
    <tr key={product.productId || index}>
      <td>{index + 1}</td>
      <td>{productName || "Unknown Product"}</td>
      <td>{prod.product_code || "—"}</td>
      <td>{product.quantity || 0}</td>
      <td>{product.price ? product.price.toFixed(2) : "0.00"}</td>
      <td>
        {product.price && product.quantity
          ? (product.price * product.quantity).toFixed(2)
          : "0.00"}
      </td>
    </tr>
  );
};

const InvoiceDetails = () => {
  const { invoiceId } = useParams();
  const { data, isLoading, isError } = useGetInvoiceByIdQuery(invoiceId);
  const invoice = data?.data || {};

  const {
    invoiceNo = "",
    createdBy = "",
    quotationId = null,
    billTo = "",
    shipTo = "",
    amount = "0.00",
    invoiceDate = "",
    dueDate = "",
    paymentMethod = "",
    status = "Unknown",
    products = [],
    signatureName = "",
  } = invoice || {};

  const { data: createdByUser } = useGetUserByIdQuery(createdBy, {
    skip: !createdBy,
  });

  const { data: quotation } = useGetQuotationByIdQuery(quotationId, {
    skip: !quotationId,
  });

  const { data: shipToAddress, isLoading: isAddressLoading } =
    useGetAddressByIdQuery(shipTo, {
      skip: !shipTo,
    });

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

  if (isLoading || isAddressLoading)
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading invoice...
      </div>
    );

  if (isError)
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        Error fetching invoice details.
      </div>
    );

  if (products.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        No products found in this invoice.
      </div>
    );

  const subTotal = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
    0
  );
  const vat = subTotal * 0.18;
  const total = parseFloat(amount) || subTotal + vat;

  const amountInWords = total
    ? `Rupees ${Math.floor(total).toLocaleString("en-IN", {
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
    <div
      className="page-wrapper"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <style>{globalStyles}</style>
      <div style={{ top: "100px", left: "30px" }}>
        <Link to="/invoices" className="btn btn-primary">
          <i className="me-2" data-feather="arrow-left"></i>Back to Invoices
        </Link>
      </div>
      <div
        className="content"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <div className="page-header" onMouseDown={handleMouseDown}>
          <div
            className="add-item d-flex justify-between items-center"
            style={componentStyles.addItem}
          >
            <h4 style={componentStyles.headerTitle}>Invoice Details</h4>
          </div>
        </div>

        <div className="invoice-box" style={componentStyles.invoiceBox}>
          <h5 style={componentStyles.invoiceTitle}>Invoice #{invoiceNo}</h5>
          <div style={componentStyles.dateSection}>
            <p style={componentStyles.dateItem}>
              <strong>Date:</strong>{" "}
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
          </div>

          <div className="row mt-4" style={componentStyles.addressRow}>
            <div className="col-md-6" style={componentStyles.addressCol}>
              <h6 style={componentStyles.addressTitle}>Bill To</h6>
              <p style={componentStyles.addressText}>
                {billTo || createdByUser?.data?.name || "Unknown"}
              </p>
              <p style={componentStyles.addressText}>
                {createdByUser?.data?.email || "Not available"}
              </p>
            </div>
            <div className="col-md-6" style={componentStyles.addressCol}>
              <h6 style={componentStyles.addressTitle}>Ship To</h6>
              <p style={componentStyles.addressText}>
                {shipToAddress?.data?.street
                  ? `${shipToAddress.data.street}, ${shipToAddress.data.city}`
                  : "Not available"}
              </p>
              <p style={componentStyles.addressText}>
                {shipToAddress?.data?.state && shipToAddress?.data?.country
                  ? `${shipToAddress.data.state}, ${
                      shipToAddress.data.country
                    } - ${shipToAddress.data.postalCode || "Not available"}`
                  : "Not available"}
              </p>
            </div>
          </div>

          <table className="table mt-4" style={componentStyles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Product Code</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
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

          <div style={componentStyles.summarySection}>
            <p style={componentStyles.summaryItem}>
              <strong>Subtotal:</strong> ₹{subTotal.toFixed(2)}
            </p>
            <p style={componentStyles.summaryItem}>
              <strong>VAT (18%):</strong> ₹{vat.toFixed(2)}
            </p>
            <p style={componentStyles.totalItem}>
              <strong>Total:</strong> ₹{total.toFixed(2)}
            </p>
            <p style={componentStyles.amountInWords}>
              <em>{amountInWords}</em>
            </p>
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
            <div style={componentStyles.signatureSection}>
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
