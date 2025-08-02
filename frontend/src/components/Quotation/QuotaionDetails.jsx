import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useExportQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetCompanyByIdQuery } from "../../api/companyApi"; // Import the company API hook
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import sampleQuotationTemplate from "../../assets/Sample-Quotation.xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import "./quotation.css";

const QuotationsDetails = () => {
  const { id } = useParams();
  const {
    data: quotation,
    error,
    isLoading: isQuotationLoading,
  } = useGetQuotationByIdQuery(id);
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
  // Fetch company details for "CHABBRA MARBEL"
  const companyId = "401df7ef-f350-4bc4-ba6f-bf36923af252";
  const {
    data: companyData,
    isLoading: isCompanyLoading,
    isError: isCompanyError,
  } = useGetCompanyByIdQuery(companyId, { skip: !companyId });
  const company = companyData?.data || {};
  const quotationRef = useRef(null);
  const [exportFormat, setExportFormat] = useState("pdf");

  const getUserName = (createdBy) => {
    if (!users || users.length === 0 || !createdBy)
      return company.name || "CHABBRA MARBEL";
    const user = users.find(
      (u) => u.userId && u.userId.trim() === createdBy.trim()
    );
    return user ? user.name : company.name || "CHABBRA MARBEL";
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

          // Update Excel with company details
          worksheet["A2"] = { v: company.name || "CHABBRA MARBEL" };
          worksheet["A3"] = {
            v: company.address || "123, Main Street, Mumbai, India",
          };
          worksheet["A4"] = {
            v: company.website || "https://cmtradingco.com/",
          };
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

  if (isQuotationLoading || isCompanyLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Loading quotation details...</p>
        </div>
      </div>
    );
  }

  if (error || isCompanyError) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">
            Error loading quotation or company details.
          </p>
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
        {/* Breadcrumb */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Quotations</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item active" aria-current="page">
                  Manage your Quotation
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="mb-2">
              <button
                className="btn btn-dark d-flex align-items-center"
                onClick={handleExport}
              >
                <i className="ti ti-download me-2"></i>Download
              </button>
            </div>
          </div>
        </div>
        {/* /Breadcrumb */}

        {/* Quotation */}
        <div>
          <div className="row">
            <div className="col-sm-10 mx-auto">
              <Link
                to="/orders/list"
                className="back-icon d-flex align-items-center fs-12 fw-medium mb-3 d-inline-flex"
              >
                <span className="d-flex justify-content-center align-items-center rounded-circle me-2">
                  <i className="ti ti-arrow-left"></i>
                </span>
                Back to List
              </Link>
              <div className="card">
                <div className="card-body" ref={quotationRef}>
                  {/* Header Section */}
                  <div className="row justify-content-between align-items-center border-bottom mb-3">
                    <div className="col-md-6">
                      <div className="mb-2">
                        <img
                          src={logo}
                          className="img-fluid"
                          alt="Company Logo"
                        />
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
                          Quotation No{" "}
                          <span className="text-primary">
                            #{quotation.quotationId}
                          </span>
                        </h5>
                        <p className="mb-1 fw-medium">
                          Created Date :{" "}
                          <span className="text-dark">
                            {quotation.quotation_date
                              ? new Date(
                                  quotation.quotation_date
                                ).toLocaleDateString()
                              : "Not available"}
                          </span>
                        </p>
                        <p className="fw-medium">
                          Due Date :{" "}
                          <span className="text-dark">
                            {quotation.due_date
                              ? new Date(
                                  quotation.due_date
                                ).toLocaleDateString()
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
                          {getUserName(quotation.createdBy)}
                        </h4>
                        <p className="mb-1">
                          {company.address || "123, Main Street, Mumbai, India"}
                        </p>
                        <p className="mb-1">
                          Email :{" "}
                          <span className="text-dark">
                            {user?.email || "Not available"}
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
                        <h4 className="mb-1">
                          {getCustomerName(quotation.customerId)}
                        </h4>
                        <p className="mb-1">
                          {customer?.address ||
                            quotation.shipTo ||
                            "Not available"}
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
                        <p className="text-title mb-2 fw-medium">Status</p>
                        <span className="badge badge-primary align-items-center mb-3">
                          <i className="ti ti-point-filled"></i>Pending
                        </span>
                        <div>
                          <img
                            src="https://smarthr.co.in/demo/html/template/assets/img/qr.svg"
                            className="img-fluid"
                            alt="QR"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quotation Items */}
                  <div>
                    <p className="fw-medium">
                      Quotation For :{" "}
                      <span className="text-dark fw-medium">
                        {quotation.title || "Design & development"}
                      </span>
                    </p>
                    <div className="table-responsive mb-3">
                      <table className="table">
                        <thead className="thead-light">
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
                                      className="img-fluid"
                                      style={{ maxWidth: "50px" }}
                                    />
                                  ) : (
                                    "N/A"
                                  )}
                                </td>
                                <td>
                                  <h6>{product.name || "N/A"}</h6>
                                </td>
                                <td className="text-gray-9 fw-medium text-end">
                                  {product.productCode || "N/A"}
                                </td>
                                <td className="text-gray-9 fw-medium text-end">
                                  {product.sellingPrice
                                    ? `₹${Number(product.sellingPrice).toFixed(
                                        2
                                      )}`
                                    : "N/A"}
                                </td>
                                <td className="text-gray-9 fw-medium text-end">
                                  {product.discount
                                    ? `${
                                        product.discountType === "percent"
                                          ? `${product.discount}%`
                                          : `₹${Number(
                                              product.discount
                                            ).toFixed(2)}`
                                      }`
                                    : "N/A"}
                                </td>
                                <td className="text-gray-9 fw-medium text-end">
                                  {product.rate
                                    ? `₹${Number(product.rate).toFixed(2)}`
                                    : product.sellingPrice
                                    ? `₹${Number(product.sellingPrice).toFixed(
                                        2
                                      )}`
                                    : "N/A"}
                                </td>
                                <td className="text-gray-9 fw-medium text-end">
                                  {product.qty || product.quantity || "N/A"}
                                </td>
                                <td className="text-gray-9 fw-medium text-end">
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
                      </table>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="row border-bottom mb-3">
                    <div className="col-md-7">
                      <div className="py-4">
                        <div className="mb-3">
                          <h6 className="mb-1">Terms and Conditions</h6>
                          {quotation.terms ? (
                            quotation.terms
                              .split("\n")
                              .map((term, index) => <p key={index}>{term}</p>)
                          ) : (
                            <p>No terms and conditions provided.</p>
                          )}
                        </div>
                        <div className="mb-3">
                          <h6 className="mb-1">Notes</h6>
                          <p>Please quote quotation number when responding.</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                        <p className="mb-0">Sub Total</p>
                        <p className="text-dark fw-medium mb-2">
                          ₹{subtotal.toFixed(2)}
                        </p>
                      </div>
                      {quotation.include_gst && quotation.gst_value && (
                        <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                          <p className="mb-0">GST ({quotation.gst_value}%)</p>
                          <p className="text-dark fw-medium mb-2">
                            ₹{gstAmount.toFixed(2)}
                          </p>
                        </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                        <h5>Total Amount</h5>
                        <h5>₹{finalTotal.toFixed(2)}</h5>
                      </div>
                      <p className="fs-12">
                        Amount in Words: Rupees{" "}
                        {Math.floor(finalTotal).toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        only
                      </p>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="text-center">
                    <div className="mb-3">
                      <img
                        src={logo}
                        className="img-fluid"
                        alt="Company Logo"
                      />
                    </div>
                    <p className="text-dark mb-1">
                      Payment to be made via bank transfer / cheque in the name
                      of {company.name || getUserName(quotation.createdBy)}
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
        {/* /Quotation */}

        {/* Action Buttons */}
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
              className="btn btn-primary d-flex justify-content-center align-items-center"
              onClick={handleExport}
              aria-label={`Export quotation as ${exportFormat}`}
            >
              <i className="ti ti-printer me-2"></i>Export Quotation
            </button>
          </div>
          <button
            className="btn btn-white d-flex justify-content-center align-items-center border"
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
