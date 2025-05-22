import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useExportQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import sampleQuotationTemplate from "../../assets/Sample-Quotation.xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import "./quotation.css";

const QuotationsDetails = () => {
  const { id } = useParams();
  const { data: quotation, error, isLoading } = useGetQuotationByIdQuery(id);
  const { data: usersData } = useGetAllUsersQuery();
  const { data: customersData } = useGetCustomersQuery();
  const users = usersData?.users || [];
  const customers = customersData?.data || [];
  const { data: customer } = useGetCustomerByIdQuery(quotation?.customerId, {
    skip: !quotation?.customerId,
  });
  const [exportQuotation] = useExportQuotationMutation();
  const { data: user } = useGetUserByIdQuery(quotation?.createdBy, {
    skip: !quotation?.createdBy,
  });
  const quotationRef = useRef(null);
  const [exportFormat, setExportFormat] = useState("pdf");

  const getUserName = (createdBy) => {
    if (!users || users.length === 0 || !createdBy) return "Unknown";
    const user = users.find(
      (u) => u.userId && u.userId.trim() === createdBy.trim()
    );
    return user ? user.name : "Unknown";
  };

  const getCustomerName = (customerId) => {
    if (!customers || customers.length === 0 || !customerId) return "Unknown";
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.name : "Unknown";
  };

  const handleExport = async () => {
    try {
      if (!id) {
        toast.error("Quotation ID is missing.");
        return;
      }

      if (exportFormat === "pdf") {
        if (!quotationRef.current) {
          toast.error("Quotation content not available.");
          return;
        }

        const canvas = await html2canvas(quotationRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`quotation_${id}.pdf`);
        toast.success("Quotation exported as PDF successfully!");
      } else if (exportFormat === "excel") {
        // First, try the backend API export
        try {
          const blob = await exportQuotation(id).unwrap();
          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `quotation_${id}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Quotation exported as Excel successfully!");
            return;
          }
        } catch (apiError) {
          console.warn(
            "Backend Excel export failed, falling back to client-side generation:",
            apiError
          );
        }

        // Fallback: Use the template to export the quotation data
        try {
          // Fetch and read the template file
          const response = await fetch(sampleQuotationTemplate);
          if (!response.ok) {
            throw new Error("Failed to fetch the Excel template.");
          }
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Calculate totals
          const products = Array.isArray(quotation.products)
            ? quotation.products
            : [];
          const subtotal = products.reduce(
            (sum, product) => sum + Number(product.total || 0),
            0
          );
          const gstAmount =
            quotation.include_gst && quotation.gst_value
              ? (subtotal * Number(quotation.gst_value)) / 100
              : 0;
          const finalTotal = subtotal + gstAmount;

          // Populate customer details and date (based on template structure)
          worksheet["A5"] = { v: getCustomerName(quotation.customerId) }; // M/s (Customer Name)
          worksheet["A6"] = { v: customer?.address || "Address not available" }; // Address
          worksheet["F5"] = {
            v: quotation.quotation_date
              ? new Date(quotation.quotation_date).toLocaleDateString()
              : "N/A",
          }; // Date

          // Populate product table (starting at row 9, columns A to I)
          const startRow = 9; // Data starts at row 9 (after headers at row 8)
          products.forEach((product, index) => {
            const row = startRow + index;
            // Use XLSX.utils.sheet_add_aoa for better control over cell updates
            XLSX.utils.sheet_add_aoa(
              worksheet,
              [
                [
                  index + 1, // S.No
                  "", // Product Image (skip, as Excel doesn't render images easily)
                  product.name || "N/A", // Product Name
                  product.productCode || "N/A", // Product Code
                  product.sellingPrice ? Number(product.sellingPrice) : 0, // MRP (number)
                  product.discount || 0, // Discount (number)
                  product.rate || product.sellingPrice || 0, // Rate (number)
                  product.qty || product.quantity || 0, // Unit
                  product.total ? Number(product.total) : 0, // Total (number)
                ],
              ],
              { origin: `A${row}` }
            );

            // Apply currency formatting to MRP, Rate, and Total
            ["E", "G", "I"].forEach((col) => {
              const cell = `${col}${row}`;
              worksheet[cell].z = "₹#,##0.00"; // Apply currency format
            });

            // Apply percentage or currency formatting to Discount
            const discountCell = `F${row}`;
            if (product.discount) {
              if (product.discountType === "percent") {
                worksheet[discountCell].z = "0.00%"; // Percentage format
              } else {
                worksheet[discountCell].z = "₹#,##0.00"; // Currency format
              }
            }
          });

          // Clear extra rows in the product table
          const maxRows = startRow + (products.length || 1);
          for (let row = maxRows; row < startRow + 50; row++) {
            if (products.length === 0 && row === startRow) {
              XLSX.utils.sheet_add_aoa(
                worksheet,
                [
                  [
                    "No products available for this quotation.",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                  ],
                ],
                { origin: `A${row}` }
              );
            } else {
              XLSX.utils.sheet_add_aoa(
                worksheet,
                [[null, null, null, null, null, null, null, null, null]],
                { origin: `A${row}` }
              );
            }
          }

          // Populate totals (adjust row numbers based on template)
          const totalsStartRow = startRow + (products.length || 1) + 1;
          XLSX.utils.sheet_add_aoa(
            worksheet,
            [
              ["", "", "", "", "", "", "", "Subtotal", subtotal], // Subtotal
              [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                quotation.include_gst && quotation.gst_value
                  ? `GST (${quotation.gst_value}%)`
                  : "",
                quotation.include_gst && quotation.gst_value ? gstAmount : "",
              ], // GST
              ["", "", "", "", "", "", "", "Total", finalTotal], // Total
            ],
            { origin: `A${totalsStartRow}` }
          );

          // Apply currency formatting to totals
          ["I"].forEach((col) => {
            for (let row = totalsStartRow; row <= totalsStartRow + 2; row++) {
              const cell = `${col}${row}`;
              if (worksheet[cell]?.v) {
                worksheet[cell].z = "₹#,##0.00";
              }
            }
          });

          // Write the updated workbook to a new file
          XLSX.writeFile(workbook, `quotation_${id}.xlsx`);
          toast.success("Quotation exported as Excel successfully!");
        } catch (error) {
          console.error("Excel export error:", error);
          toast.error(
            "Failed to export quotation to Excel. Please ensure the template is available."
          );
        }
      }
    } catch (error) {
      toast.error(
        `Failed to export quotation as ${exportFormat.toUpperCase()}.`
      );
      console.error("Export error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Loading quotation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">Error loading quotation details.</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Quotation not found.</p>
        </div>
      </div>
    );
  }

  const products = Array.isArray(quotation.products) ? quotation.products : [];
  const subtotal = products.reduce(
    (sum, product) => sum + Number(product.total || 0),
    0
  );
  const gstAmount =
    quotation.include_gst && quotation.gst_value
      ? (subtotal * Number(quotation.gst_value)) / 100
      : 0;
  const finalTotal = subtotal + gstAmount;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h4 className="mb-0">Quotation Details</h4>
          </div>
          <a href="/quotations/list" className="btn btn-primary">
            <i data-feather="arrow-left" className="me-2"></i>Back to Quotations
          </a>
        </div>

        {/* Quotation formatted as per the sample for PDF export */}
        <div className="quotation-container" ref={quotationRef}>
          <div className="quotation-header text-center">
            <h2 className="company-name">
              <img src={logo} alt="Company Logo" />
            </h2>
          </div>
          <div className="row">
            <div className="col">
              <h3 className="quotation-title">ESTIMATE / QUOTATION</h3>
            </div>
            <div className="col">
              <p className="company-details">GROHE / AMERICAN STANDARD</p>
            </div>
          </div>
          <div className="row customer-details">
            <div className="col-md-8">
              <p>
                <strong>M/s:</strong> {getCustomerName(quotation.customerId)}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {customer?.address ? customer.address : "Address not available"}
              </p>
            </div>
            <div className="col-md-4 text-end">
              <p>
                <strong>Date:</strong>{" "}
                {quotation.quotation_date
                  ? new Date(quotation.quotation_date).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <table className="table table-bordered quotation-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product Image</th>
                <th>Product Name</th>
                <th>Product Code</th>
                <th>MRP</th>
                <th>Discount</th>
                <th>Rate</th>
                <th>Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name || "Product"}
                          className="product-image"
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>{product.name || "N/A"}</td>
                    <td>{product.productCode || "N/A"}</td>
                    <td>
                      {product.sellingPrice
                        ? `₹${Number(product.sellingPrice).toFixed(2)}`
                        : "N/A"}
                    </td>
                    <td>
                      {product.discount
                        ? `${
                            product.discountType === "percent"
                              ? `${product.discount}%`
                              : `₹${Number(product.discount).toFixed(2)}`
                          }`
                        : "N/A"}
                    </td>
                    <td>
                      {product.rate
                        ? `₹${Number(product.rate).toFixed(2)}`
                        : product.sellingPrice
                        ? `₹${Number(product.sellingPrice).toFixed(2)}`
                        : "N/A"}
                    </td>
                    <td>{product.qty || product.quantity || "N/A"}</td>
                    <td>
                      {product.total
                        ? `₹${Number(product.total).toFixed(2)}`
                        : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">
                    No products available for this quotation.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="8" className="text-end">
                  <strong>Subtotal:</strong>
                </td>
                <td>₹{subtotal.toFixed(2)}</td>
              </tr>
              {quotation.include_gst && quotation.gst_value && (
                <tr>
                  <td colSpan="8" className="text-end">
                    <strong>GST ({quotation.gst_value}%):</strong>
                  </td>
                  <td>₹{gstAmount.toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td colSpan="8" className="text-end">
                  <strong>Total:</strong>
                </td>
                <td>₹{finalTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Export Options */}
        <div className="d-flex justify-content-center align-items-center mb-4">
          <div className="d-flex align-items-center me-2">
            <select
              className="form-select me-2"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              aria-label="Select export format"
            >
              <option value="pdf">Export as PDF</option>
              <option value="excel">Export as Excel</option>
            </select>
            <button
              onClick={handleExport}
              className="btn btn-primary d-flex justify-content-center align-items-center"
              aria-label={`Export quotation as ${exportFormat}`}
            >
              <i className="ti ti-printer me-2"></i>Export Quotation
            </button>
          </div>
          <button
            className="btn btn-secondary d-flex justify-content-center align-items-center border"
            onClick={() =>
              toast.info("Clone functionality not implemented yet.")
            }
            aria-label="Clone quotation"
          >
            <i className="ti ti-copy me-2"></i>Clone Quotation
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationsDetails;
