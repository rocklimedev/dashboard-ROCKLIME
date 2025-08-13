import React, { useRef, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useExportQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetCompanyByIdQuery } from "../../api/companyApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import sampleQuotationTemplate from "../../assets/Sample-Quotation.xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs"; // Add exceljs import
import * as XLSX from "xlsx";
import "./quotation.css";
import useProductsData from "../../data/useProductdata";
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
  const companyId = "401df7ef-f350-4bc4-ba6f-bf36923af252";
  const {
    data: companyData,
    isLoading: isCompanyLoading,
    isError: isCompanyError,
  } = useGetCompanyByIdQuery(companyId, { skip: !companyId });
  const company = companyData?.data || {};
  const quotationRef = useRef(null);
  const [exportFormat, setExportFormat] = useState("pdf");

  const products = Array.isArray(quotation?.products) ? quotation.products : [];
  const { productsData, errors, loading } = useProductsData(products);

  // Display errors for failed product fetches
  useEffect(() => {
    if (errors.length > 0) {
      errors.forEach(({ productId, error }) => {
        toast.error(`Failed to fetch product ${productId}: ${error}`);
      });
    }
  }, [errors]);

  const getUserName = (createdBy) => {
    if (!users || users.length === 0 || !createdBy)
      return company.name || "CHHABRA MARBLE";
    const user = users.find(
      (u) => u.userId && u.userId.trim() === createdBy.trim()
    );
    return user ? user.name : company.name || "CHHABRA MARBLE";
  };

  const getCustomerName = (customerId) => {
    if (!customers || customers.length === 0 || !customerId) return "Unknown";
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.name : "Unknown";
  };

  // Function to validate image URLs (including base64)
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;

    // Check for base64 data URLs
    if (url.startsWith("data:image/")) {
      return (
        url.includes("base64,") && /image\/(png|jpg|jpeg|gif|bmp)/i.test(url)
      );
    }

    // Check for remote URLs with valid image extensions
    try {
      new URL(url);
      const imageExtensions = /\.(png|jpg|jpeg|gif|bmp)$/i;
      return imageExtensions.test(url);
    } catch {
      return false;
    }
  };

  // Function to fetch image as buffer (supports base64 and remote URLs)
  const fetchImageAsBuffer = async (url) => {
    try {
      if (!url || !isValidImageUrl(url)) {
        throw new Error("Invalid or missing image URL");
      }

      let buffer, extension;

      // Handle base64 image URLs
      if (url.startsWith("data:image/")) {
        const matches = url.match(
          /^data:image\/(png|jpg|jpeg|gif|bmp);base64,(.+)$/
        );
        if (!matches) {
          throw new Error("Invalid base64 image format");
        }
        extension = matches[1];
        buffer = Buffer.from(matches[2], "base64");
      } else {
        // Handle remote image URLs
        const response = await fetch(url, {
          mode: "cors",
          credentials: "omit",
          headers: {
            Accept: "image/*",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch image from ${url}: ${response.status} - ${response.statusText}`
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
          throw new Error(
            `Unsupported content type: ${
              contentType || "Unknown"
            } for URL: ${url}`
          );
        }

        extension = contentType.split("/")[1].toLowerCase();
        if (extension === "jpeg") extension = "jpg"; // Normalize extension
        buffer = Buffer.from(await response.arrayBuffer());
      }

      return { buffer, extension };
    } catch (error) {
      console.error(`Error fetching image from ${url}:`, error.message);
      toast.error(`Failed to load image: ${error.message}`);
      return null;
    }
  };

  // Inside handleExport function, update the image processing logic
  const handleExport = async () => {
    try {
      if (!id) {
        toast.error("Quotation ID is missing.");
        return;
      }

      if (exportFormat === "excel") {
        if (!products || products.length === 0) {
          toast.error("No products available to export.");
          return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Quotation");

        // Add header with logo, title, and brand
        const logoBuffer = await fetchImageAsBuffer(logo);
        if (logoBuffer) {
          const logoId = workbook.addImage({
            buffer: logoBuffer.buffer,
            extension: logoBuffer.extension,
          });
          worksheet.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 100, height: 50 },
            editAs: "undefined",
          });
        }
        worksheet.mergeCells("B1:D1");
        worksheet.getCell("B1").value = "Estimate / Quotation";
        worksheet.getCell("B1").font = { bold: true, size: 16 };
        worksheet.getCell("E1").value = "GROHE / AMERICAN STANDARD";
        worksheet.getCell("E1").font = { bold: true, size: 12 };
        worksheet.getRow(1).height = 50;

        // Add M/s, Address, Date section
        worksheet.getCell("A2").value = "M/s";
        worksheet.getCell("B2").value =
          getUserName(quotation.createdBy) || "CHHABRA MARBLE";
        worksheet.getCell("D2").value = "Date";
        worksheet.getCell("E2").value = quotation.quotation_date
          ? new Date(quotation.quotation_date).toLocaleDateString()
          : new Date().toLocaleDateString();
        worksheet.mergeCells("B3:D3");
        worksheet.getCell("A3").value = "Address";
        worksheet.getCell("B3").value =
          customer?.address ||
          quotation.shipTo ||
          "456, Park Avenue, New York, USA";
        worksheet.getRow(2).height = 20;
        worksheet.getRow(3).height = 40;

        // Add product table headers
        const headers = [
          "S.No",
          "Product Image",
          "Product Name",
          "Product Code",
          "MRP",
          "Discount",
          "Rate",
          "Unit",
          "Total",
        ];
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        worksheet.mergeCells("G1:I1");
        worksheet.getCell("G1").value = "Amount";
        worksheet.getCell("G1").font = { bold: true };

        // Set column widths
        worksheet.columns = [
          { width: 5 }, // S.No
          { width: 15 }, // Product Image
          { width: 25 }, // Product Name
          { width: 15 }, // Product Code
          { width: 10 }, // MRP
          { width: 10 }, // Discount
          { width: 10 }, // Rate
          { width: 10 }, // Unit
          { width: 10 }, // Total
        ];

        // Add product rows with images
        for (let index = 0; index < products.length; index++) {
          const product = products[index];
          const productDetail =
            productsData?.find((p) => p.productId === product.productId) || {};
          const productCode =
            product.productCode ||
            productDetail.product_code ||
            productDetail.meta?.d11da9f9_3f2e_4536_8236_9671200cca4a ||
            "N/A";
          const sellingPrice =
            product.sellingPrice ||
            productDetail.metaDetails?.find((m) => m.title === "sellingPrice")
              ?.value ||
            0;
          let imageUrl = productDetail?.images;
          try {
            imageUrl =
              imageUrl && Array.isArray(JSON.parse(imageUrl))
                ? JSON.parse(imageUrl)[0]
                : imageUrl;
          } catch {
            imageUrl = null; // Handle invalid JSON gracefully
          }

          const rowData = [
            index + 1,
            "", // Placeholder for image
            product.name || productDetail.name || "N/A",
            productCode,
            Number(sellingPrice) || 0,
            product.discount
              ? product.discountType === "percent"
                ? `${Number(product.discount)}%`
                : `₹${Number(product.discount).toFixed(2)}`
              : "N/A",
            Number(product.rate) || Number(sellingPrice) || 0,
            product.qty || product.quantity || 0,
            Number(product.total) || 0,
          ];

          const row = worksheet.addRow(rowData);

          if (imageUrl && isValidImageUrl(imageUrl)) {
            console.log(`Fetching image from: ${imageUrl}`);
            const imageData = await fetchImageAsBuffer(imageUrl);
            if (imageData) {
              console.log(`Successfully fetched image: ${imageUrl}`);
              const imageId = workbook.addImage({
                buffer: imageData.buffer,
                extension: imageData.extension,
              });
              worksheet.addImage(imageId, {
                tl: { col: 1, row: row.number - 1 }, // Adjust row number (ExcelJS is 1-based)
                ext: { width: 50, height: 50 },
                editAs: "undefined",
              });
              worksheet.getRow(row.number).height = 60;
            } else {
              console.warn(`Failed to fetch image: ${imageUrl}`);
              worksheet.getRow(row.number).height = 20;
              worksheet.getCell(row.number, 2).value = "Image Unavailable";
            }
          } else {
            console.warn(
              `Invalid or missing image URL for product: ${product.name}`
            );
            worksheet.getRow(row.number).height = 20;
            worksheet.getCell(row.number, 2).value = "No Image";
          }

          // Apply number formatting
          row.getCell(5).numFmt = "₹#,##0.00"; // MRP
          if (product.discountType === "percent") {
            row.getCell(6).numFmt = "0.00%"; // Discount as percentage
          } else {
            row.getCell(6).numFmt = "₹#,##0.00"; // Discount as currency
          }
          row.getCell(7).numFmt = "₹#,##0.00"; // Rate
          row.getCell(9).numFmt = "₹#,##0.00"; // Total
        }

        // Calculate and add totals
        const subtotal = products.reduce(
          (sum, product) => sum + Number(product.total || 0),
          0
        );
        const gstAmount =
          quotation.include_gst && quotation.gst_value
            ? (subtotal * Number(quotation.gst_value)) / 100
            : 0;
        const finalTotal = subtotal + gstAmount;

        worksheet.addRow([]);
        const subtotalRow = worksheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "",
          "Subtotal",
          "",
          subtotal,
        ]);
        subtotalRow.getCell(9).numFmt = "₹#,##0.00";
        if (quotation.include_gst && quotation.gst_value) {
          const gstRow = worksheet.addRow([
            "",
            "",
            "",
            "",
            "",
            "",
            `GST (${quotation.gst_value}%)`,
            "",
            gstAmount,
          ]);
          gstRow.getCell(9).numFmt = "₹#,##0.00";
        }
        const totalRow = worksheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "",
          "Total",
          "",
          finalTotal,
        ]);
        totalRow.getCell(9).numFmt = "₹#,##0.00";
        totalRow.font = { bold: true };

        // Apply borders to the table
        const lastRow = worksheet.lastRow.number;
        for (let row = 4; row <= lastRow; row++) {
          for (let col = 1; col <= 9; col++) {
            const cell = worksheet.getCell(row, col);
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        }

        // Save the workbook
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quotation_${id}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error(
        `Failed to export quotation as ${exportFormat.toUpperCase()}: ${
          error.message
        }`
      );
      console.error("Export error:", error);
    }
  };
  if (isQuotationLoading || isCompanyLoading || loading) {
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
              <div className="quotation-container" ref={quotationRef}>
                {/* Header Row */}
                <table className="quotation-table full-width no-border">
                  <tbody>
                    <tr>
                      <td className="logo-cell">
                        <img
                          src={logo}
                          alt="Company Logo"
                          className="logo-img"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="title-cell">
                        <h2>Estimate / Quotation</h2>
                      </td>
                      <td className="brand-cell">GROHE / AMERICAN STANDARD</td>
                    </tr>
                  </tbody>
                </table>

                {/* M/s, Address, Date */}
                <table className="quotation-table full-width bordered">
                  <tbody>
                    <tr>
                      <td className="label-cell">M/s</td>
                      <td>{getUserName(quotation.createdBy)}</td>
                      <td className="label-cell">Date</td>
                      <td>
                        {quotation.quotation_date
                          ? new Date(
                              quotation.quotation_date
                            ).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">Address</td>
                      <td colSpan="3">
                        {customer?.address ||
                          quotation.shipTo ||
                          "456, Park Avenue, New York, USA"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Product Table */}
                <table className="quotation-table full-width bordered">
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
                      products.map((product, index) => {
                        const productDetail = productsData?.find(
                          (p) => p.productId === product.productId
                        );
                        const imageUrl =
                          productDetail?.images &&
                          Array.isArray(JSON.parse(productDetail.images)) &&
                          JSON.parse(productDetail.images)[0];
                        const productCode =
                          productDetail?.product_code ||
                          productDetail?.meta
                            ?.d11da9f9_3f2e_4536_8236_9671200cca4a ||
                          "N/A";
                        const sellingPrice =
                          productDetail?.metaDetails?.find(
                            (m) => m.title === "sellingPrice"
                          )?.value ||
                          product.sellingPrice ||
                          0;

                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name || "Product"}
                                  className="product-img"
                                />
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td>
                              {product.name || productDetail?.name || "N/A"}
                            </td>
                            <td>{productCode}</td>
                            <td>
                              {sellingPrice
                                ? `₹${Number(sellingPrice).toFixed(2)}`
                                : "N/A"}
                            </td>
                            <td>
                              {product.discount
                                ? product.discountType === "percent"
                                  ? `${product.discount}%`
                                  : `₹${Number(product.discount).toFixed(2)}`
                                : "N/A"}
                            </td>
                            <td>
                              {product.rate
                                ? `₹${Number(product.rate).toFixed(2)}`
                                : sellingPrice
                                ? `₹${Number(sellingPrice).toFixed(2)}`
                                : "N/A"}
                            </td>
                            <td>{product.qty || product.quantity || "N/A"}</td>
                            <td>
                              {product.total
                                ? `₹${Number(product.total).toFixed(2)}`
                                : "N/A"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center">
                          No products available for this quotation.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <table className="quotation-table full-width bordered">
                  <tbody>
                    <tr>
                      <td colSpan="8" className="text-right">
                        Sub Total
                      </td>
                      <td>₹{subtotal.toFixed(2)}</td>
                    </tr>
                    {quotation.include_gst && quotation.gst_value && (
                      <tr>
                        <td colSpan="8" className="text-right">
                          GST ({quotation.gst_value}%)
                        </td>
                        <td>₹{gstAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="8" className="text-right fw-bold">
                        Total
                      </td>
                      <td className="fw-bold">₹{finalTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-center align-items-center mb-4">
              <div className="d-flex align-items-center me-2">
                <select
                  className="form-select me-2"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="pdf">Export as PDF</option>
                  <option value="excel">Export as Excel</option>
                </select>
                <button
                  className="btn btn-primary d-flex justify-content-center align-items-center"
                  onClick={handleExport}
                >
                  <i className="ti ti-printer me-2"></i>Export Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationsDetails;
