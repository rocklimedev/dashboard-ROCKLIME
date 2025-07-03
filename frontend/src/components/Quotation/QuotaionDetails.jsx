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

        try {
          const response = await fetch(sampleQuotationTemplate);
          if (!response.ok) {
            throw new Error("Failed to fetch the Excel template.");
          }
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

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

          worksheet["A5"] = { v: getCustomerName(quotation.customerId) };
          worksheet["A6"] = { v: customer?.address || "Address not available" };
          worksheet["F5"] = {
            v: quotation.quotation_date
              ? new Date(quotation.quotation_date).toLocaleDateString()
              : "N/A",
          };

          const startRow = 9;
          products.forEach((product, index) => {
            const row = startRow + index;
            XLSX.utils.sheet_add_aoa(
              worksheet,
              [
                [
                  index + 1,
                  "",
                  product.name || "N/A",
                  product.productCode || "N/A",
                  product.sellingPrice ? Number(product.sellingPrice) : 0,
                  product.discount || 0,
                  product.rate || product.sellingPrice || 0,
                  product.qty || product.quantity || 0,
                  product.total ? Number(product.total) : 0,
                ],
              ],
              { origin: `A${row}` }
            );

            ["E", "G", "I"].forEach((col) => {
              const cell = `${col}${row}`;
              worksheet[cell].z = "₹#,##0.00";
            });

            const discountCell = `F${row}`;
            if (product.discount) {
              worksheet[discountCell].z =
                product.discountType === "percent" ? "0.00%" : "₹#,##0.00";
            }
          });

          const maxRows = startRow + (products.length || 1);
          for (let row = maxRows; row < startRow + 50; row++) {
            XLSX.utils.sheet_add_aoa(
              worksheet,
              [[null, null, null, null, null, null, null, null, null]],
              { origin: `A${row}` }
            );
          }

          const totalsStartRow = startRow + (products.length || 1) + 1;
          XLSX.utils.sheet_add_aoa(
            worksheet,
            [
              ["", "", "", "", "", "", "", "Subtotal", subtotal],
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
              ],
              ["", "", "", "", "", "", "", "Total", finalTotal],
            ],
            { origin: `A${totalsStartRow}` }
          );

          ["I"].forEach((col) => {
            for (let row = totalsStartRow; row <= totalsStartRow + 2; row++) {
              const cell = `${col}${row}`;
              if (worksheet[cell]?.v) {
                worksheet[cell].z = "₹#,##0.00";
              }
            }
          });

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
        {/* Other Details Section */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>Quotation ID:</strong> {quotation.quotationId}
                </p>
                <p>
                  <strong>Customer:</strong>{" "}
                  {getCustomerName(quotation.customerId)}
                </p>
                <p>
                  <strong>Created By:</strong>{" "}
                  {getUserName(quotation.createdBy)}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Quotation Date:</strong>{" "}
                  {quotation.quotation_date
                    ? new Date(quotation.quotation_date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {quotation.due_date
                    ? new Date(quotation.due_date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Reference Number:</strong>{" "}
                  {quotation.reference_number || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quotation Area Section */}
        <div className="card">
          <div className="card-body">
            <div className="quotation-container" ref={quotationRef}>
              <div className="quotation-header text-center">
                <img src={logo} alt="Company Logo" className="company-logo" />
                <h2 className="company-name">GROHE / AMERICAN STANDARD</h2>
                <h3 className="quotation-title">ESTIMATE / QUOTATION</h3>
              </div>
              <div className="row customer-details">
                <div className="col-md-8">
                  <p>
                    <strong>M/s:</strong>{" "}
                    {getCustomerName(quotation.customerId)}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    {quotation.shipTo || "Address not available"}
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <p>
                    <strong>Date:</strong>{" "}
                    {quotation.quotation_date
                      ? new Date(quotation.quotation_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Quotation No:</strong> {quotation.quotationId}
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

              {/* Terms and Conditions (Optional, based on sample image) */}
              {quotation.terms && (
                <div className="terms-conditions mt-4">
                  <h5>Terms & Conditions</h5>
                  <ul>
                    {quotation.terms.split("\n").map((term, index) => (
                      <li key={index}>{term}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="d-flex justify-content-center align-items-center mb-4 mt-4">
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
