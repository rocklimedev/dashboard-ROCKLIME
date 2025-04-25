import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useMultipleProducts } from "../../data/useMultipleProducts";

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

  const {
    productDetailsMap,
    isLoading: isProductLoading,
    isError: productErrors,
  } = useMultipleProducts(products);

  // Debugging logs
  console.log("Products:", products);
  console.log("Product Details Map:", Array.from(productDetailsMap.entries()));

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

  if (isLoading || isProductLoading || isAddressLoading)
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading invoice...
      </div>
    );

  if (isError || productErrors)
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        Error fetching invoice or product details.
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
      <div style={{ top: "100px", left: "30px" }}>
        <Link to="/invoices" className="btn btn-primary">
          <i className="me-2" data-feather="arrow-left"></i>Back to Invoices
        </Link>
      </div>
      <style>
        {`
          .invoice-box {
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .table th, .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          .table th {
            background-color: #f8f9fa;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 14px;
          }
          .table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .table tbody tr:hover {
            background-color: #f1f1f1;
          }
          .btn-primary {
            background-color: #007bff;
            border-color: #007bff;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            color: white;
            font-size: 16px;
            font-weight: 500;
            transition: background-color 0.3s, box-shadow 0.3s;
            display: inline-flex;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .btn-primary:hover {
            background-color: #0056b3;
            border-color: #0056b3;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          }
          .btn-primary i {
            margin-right: 8px;
          }
        `}
      </style>

      <div
        className="content"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <div className="page-header" onMouseDown={handleMouseDown}>
          <div
            className="add-item d-flex justify-between items-center"
            style={styles.addItem}
          >
            <h4 style={styles.headerTitle}>Invoice Details</h4>
          </div>
        </div>

        <div className="invoice-box" style={styles.invoiceBox}>
          <h5 style={styles.invoiceTitle}>Invoice #{invoiceNo}</h5>
          <div style={styles.dateSection}>
            <p style={styles.dateItem}>
              <strong>Date:</strong>{" "}
              {invoiceDate
                ? new Date(invoiceDate).toLocaleDateString()
                : "Not available"}
            </p>
            <p style={styles.dateItem}>
              <strong>Due Date:</strong>{" "}
              {dueDate
                ? new Date(dueDate).toLocaleDateString()
                : "Not available"}
            </p>
          </div>

          <div className="row mt-4" style={styles.addressRow}>
            <div className="col-md-6" style={styles.addressCol}>
              <h6 style={styles.addressTitle}>Bill To</h6>
              <p style={styles.addressText}>
                {billTo || createdByUser?.data?.name || "Unknown"}
              </p>
              <p style={styles.addressText}>
                {createdByUser?.data?.email || "Not available"}
              </p>
            </div>
            <div className="col-md-6" style={styles.addressCol}>
              <h6 style={styles.addressTitle}>Ship To</h6>
              <p style={styles.addressText}>
                {shipToAddress?.data?.street
                  ? `${shipToAddress.data.street}, ${shipToAddress.data.city}`
                  : "Not available"}
              </p>
              <p style={styles.addressText}>
                {shipToAddress?.data?.state && shipToAddress?.data?.country
                  ? `${shipToAddress.data.state}, ${
                      shipToAddress.data.country
                    } - ${shipToAddress.data.postalCode || "Not available"}`
                  : "Not available"}
              </p>
            </div>
          </div>

          <table className="table mt-4" style={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => {
                const prod = productDetailsMap.get(p.productId);
                // Log product details for debugging
                console.log(`Product ${p.productId}:`, prod);
                return (
                  <tr key={p.productId || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      {prod?.name ||
                        prod?.title ||
                        p.productId ||
                        "Unknown Product"}
                    </td>
                    <td>
                      {prod?.product_code ||
                        prod?.productCode ||
                        prod?.hsnCode ||
                        "—"}
                    </td>
                    <td>{p.quantity || 0}</td>
                    <td>{p.price ? p.price.toFixed(2) : "0.00"}</td>
                    <td>
                      {p.price && p.quantity
                        ? (p.price * p.quantity).toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {productDetailsMap.size === 0 && (
            <div
              style={{ textAlign: "center", color: "red", marginTop: "10px" }}
            >
              Warning: No product details found. Please check product IDs or API
              connectivity.
            </div>
          )}

          <div style={styles.summarySection}>
            <p style={styles.summaryItem}>
              <strong>Subtotal:</strong> ₹{subTotal.toFixed(2)}
            </p>
            <p style={styles.summaryItem}>
              <strong>VAT (18%):</strong> ₹{vat.toFixed(2)}
            </p>
            <p style={styles.totalItem}>
              <strong>Total:</strong> ₹{total.toFixed(2)}
            </p>
            <p style={styles.amountInWords}>
              <em>{amountInWords}</em>
            </p>
          </div>

          <div style={styles.termsSection}>
            <h6 style={styles.termsTitle}>Terms & Conditions</h6>
            <ul style={styles.termsList}>
              {termsList.map((term, idx) => (
                <li key={idx} style={styles.termsItem}>
                  {term}
                </li>
              ))}
            </ul>
          </div>

          {signatureName && (
            <div style={styles.signatureSection}>
              <p style={styles.signatureLabel}>Authorized Signatory</p>
              <h6 style={styles.signatureName}>{signatureName}</h6>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  addItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
  },
  invoiceBox: {
    padding: "20px",
  },
  invoiceTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1a73e8",
    marginBottom: "15px",
  },
  dateSection: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  dateItem: {
    fontSize: "14px",
    color: "#555",
  },
  addressRow: {
    marginBottom: "20px",
  },
  addressCol: {
    padding: "15px",
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "4px",
  },
  addressTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  addressText: {
    fontSize: "14px",
    color: "#666",
    margin: "5px 0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  summarySection: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    textAlign: "right",
  },
  summaryItem: {
    fontSize: "15px",
    margin: "5px 0",
    color: "#333",
  },
  totalItem: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1a73e8",
    margin: "10px 0",
  },
  amountInWords: {
    fontSize: "14px",
    color: "#555",
    fontStyle: "italic",
  },
  termsSection: {
    marginTop: "20px",
  },
  termsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  termsList: {
    listStyleType: "decimal",
    paddingLeft: "20px",
  },
  termsItem: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "5px",
  },
  signatureSection: {
    marginTop: "20px",
    textAlign: "right",
    borderTop: "1px solid #eee",
    paddingTop: "10px",
  },
  signatureLabel: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "5px",
  },
  signatureName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
  },
};

export default InvoiceDetails;
