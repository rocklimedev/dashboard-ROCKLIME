import React, { useRef, useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useExportQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetProductByIdQuery } from "../../api/productApi"; // Add this import
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
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { Buffer } from "buffer";
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
  const addressId = quotation?.shipTo;

  const { data: addressData } = useGetAddressByIdQuery(addressId, {
    skip: !addressId,
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
  // Fetch brand names for each product
  const brandNames = useMemo(() => {
    const uniqueBrands = new Set();
    products.forEach((product) => {
      const productDetail = productsData?.find(
        (p) => p.productId === product.productId
      );
      let brandName = "N/A";
      if (productDetail) {
        // Adjust this based on your API's structure
        // Option 1: Direct brandName field
        if (productDetail.brandName) {
          brandName = productDetail.brandName;
        }
        // Option 2: brandId field (requires mapping or additional API call)
        else if (productDetail.brandId) {
          brandName = productDetail.brandId; // Replace with actual brand name if you have a mapping
        }
        // Option 3: brand in metaDetails
        else if (productDetail.metaDetails) {
          const brandMeta = productDetail.metaDetails.find(
            (m) => m.title === "brandName" || m.title === "brand"
          );
          brandName = brandMeta?.value || "N/A";
        }
      }
      if (brandName !== "N/A") {
        uniqueBrands.add(brandName);
      }
    });
    return Array.from(uniqueBrands).join(" / ") || "Unknown";
  }, [products, productsData]);

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
    if (!url || typeof url !== "string") {
      console.warn(`Invalid image URL: ${url}`);
      return false;
    }

    // Handle base64 data URLs
    if (url.startsWith("data:image/")) {
      const isValid = /data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,/.test(
        url
      );
      if (!isValid)
        console.warn(`Invalid base64 image URL: ${url.slice(0, 50)}...`);
      return isValid;
    }

    // Handle remote URLs (e.g., https://static.cmtradingco.com/product_images/COL-4005.png)
    try {
      new URL(url);
      const imageExtensions = /\.(png|jpg|jpeg|gif|bmp|webp)$/i;
      const isValid = imageExtensions.test(url.split("?")[0]);
      if (!isValid) console.warn(`Invalid image extension in URL: ${url}`);
      return isValid;
    } catch (error) {
      console.warn(`Invalid URL format: ${url}, Error: ${error.message}`);
      return false;
    }
  };

  // Function to fetch image as buffer (supports base64 and remote URLs)
  // Placeholder image (tiny grey square, base64-encoded PNG)
  const placeholderImage = {
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAAA1BMVEX///+nxBvIAAAAIElEQVR4nGNgGAWjYBSMglEwCkbBKBgFo2AUjIJRMAoGAK8rB3N0S2o0AAAAAElFTkSuQmCC",
      "base64"
    ),
    extension: "png",
  };

  const fetchImageAsBuffer = async (url, retries = 2) => {
    console.log(`Fetching image: ${url.slice(0, 50)}...`);
    try {
      if (!url || !isValidImageUrl(url)) {
        console.error(`Invalid image URL: ${url}`);
        return placeholderImage;
      }

      let buffer, extension;

      // Handle base64 image URLs
      if (url.startsWith("data:image/")) {
        const matches = url.match(
          /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,(.+)$/
        );
        if (!matches) {
          console.error(`Invalid base64 format: ${url.slice(0, 50)}...`);
          return placeholderImage;
        }
        extension = matches[1];
        buffer = Buffer.from(matches[2], "base64");
        if (!buffer || buffer.length === 0) {
          console.error(`Empty base64 buffer for URL: ${url.slice(0, 50)}...`);
          return placeholderImage;
        }
      } else {
        // Handle remote image URLs (e.g., https://static.cmtradingco.com/product_images/COL-4005.png)
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const response = await fetch(url, {
              mode: "cors",
              credentials: "omit",
              headers: {
                Accept: "image/*",
              },
            });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status} - ${response.statusText}`
              );
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.startsWith("image/")) {
              throw new Error(
                `Unsupported content type: ${contentType || "Unknown"}`
              );
            }

            extension = contentType.split("/")[1].toLowerCase();
            if (extension === "jpeg") extension = "jpg";
            buffer = Buffer.from(await response.arrayBuffer());
            if (!buffer || buffer.length === 0) {
              throw new Error("Empty image buffer");
            }
            break; // Success, exit retry loop
          } catch (err) {
            if (attempt === retries) {
              console.error(
                `Failed to fetch image after ${retries} attempts: ${url}, Error: ${err.message}`
              );
              return placeholderImage;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
          }
        }
      }

      console.log(
        `Successfully fetched image: ${url.slice(0, 50)}..., Size: ${
          buffer.length
        } bytes`
      );
      return { buffer, extension };
    } catch (error) {
      console.error(`Error fetching image: ${url}, Error: ${error.message}`);
      return placeholderImage; // Fallback to placeholder
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

        // STEP 1: Build unified export rows
        const exportRows = products.map((product, index) => {
          const productDetail =
            productsData?.find((p) => p.productId === product.productId) || {};

          let imageUrl = null;
          try {
            if (productDetail?.images) {
              const imgs = JSON.parse(productDetail.images);
              imageUrl =
                Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
            }
          } catch (error) {
            console.error(
              `Failed to parse images for product ${product.productId}: ${error.message}`
            );
            imageUrl = null;
          }

          const productCode =
            productDetail?.product_code ||
            productDetail?.meta?.d11da9f9_3f2e_4536_8236_9671200cca4a ||
            "N/A";

          const sellingPrice =
            productDetail?.metaDetails?.find((m) => m.title === "sellingPrice")
              ?.value ||
            product.sellingPrice ||
            0;

          return {
            index: index + 1,
            imageUrl,
            name: product.name || productDetail?.name || "N/A",
            code: productCode,
            mrp: sellingPrice ? `₹${Number(sellingPrice).toFixed(2)}` : "N/A",
            discount: product.discount
              ? product.discountType === "percent"
                ? `${product.discount}%`
                : `₹${Number(product.discount).toFixed(2)}`
              : "N/A",
            rate: product.rate
              ? `₹${Number(product.rate).toFixed(2)}`
              : sellingPrice
              ? `₹${Number(sellingPrice).toFixed(2)}`
              : "N/A",
            qty: product.qty || product.quantity || "N/A",
            total: product.total
              ? `₹${Number(product.total).toFixed(2)}`
              : "N/A",
          };
        });

        // STEP 2: Workbook setup
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Quotation");

        // Logo
        const logoBuffer = await fetchImageAsBuffer(logo);
        try {
          const logoId = workbook.addImage({
            buffer: logoBuffer.buffer,
            extension: logoBuffer.extension,
          });
          worksheet.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 100, height: 50 },
            editAs: "oneCell",
          });
          worksheet.getRow(1).height = 60;
        } catch (error) {
          console.error(`Error adding logo to Excel: ${error.message}`);
          toast.warning("Failed to add logo to Excel file, using placeholder.");
          const logoId = workbook.addImage({
            buffer: placeholderImage.buffer,
            extension: placeholderImage.extension,
          });
          worksheet.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 100, height: 50 },
            editAs: "oneCell",
          });
          worksheet.getRow(1).height = 60;
        }

        // Title + brand
        worksheet.mergeCells("B1:D1");
        worksheet.getCell("B1").value = "Estimate / Quotation";
        worksheet.getCell("B1").font = { bold: true, size: 16 };
        worksheet.getCell("E1").value = brandNames; // Use dynamic brand names
        worksheet.getCell("E1").font = { bold: true, size: 12 };
        worksheet.getRow(1).height = Math.max(
          worksheet.getRow(1).height || 0,
          60
        );

        // ... (rest of the handleExport function remains unchanged)
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
                {/* Header Row */}
                <table className="quotation-table full-width">
                  {/* Header Section */}

                  <tbody>
                    {/* Logo row */}
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        <img
                          src={logo}
                          alt="Company Logo"
                          className="logo-img"
                        />
                      </td>
                    </tr>
                    {/* Title + Brand row */}
                    <tr>
                      <td></td>
                      <td className="title-cell">Estimate / Quotation</td>
                      <td className="brand-cell">GROHE / AMERICAN STANDARD</td>
                    </tr>
                  </tbody>
                </table>

                {/* M/s, Address, Date */}
                <table className="quotation-table full-width">
                  <tbody>
                    <tr>
                      <td className="label-cell" style={{ width: "15%" }}>
                        M/s
                      </td>
                      <td style={{ width: "55%" }}>
                        {getCustomerName(quotation.customerId)}
                      </td>
                      <td className="label-cell" style={{ width: "15%" }}>
                        Date
                      </td>
                      <td style={{ width: "15%" }}>
                        {quotation.quotation_date
                          ? new Date(
                              quotation.quotation_date
                            ).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">Address</td>
                      <td style={{ width: "55%" }}>
                        {addressData
                          ? `${addressData.street || ""}, ${
                              addressData.city || ""
                            }, ${addressData.state || ""}, ${
                              addressData.postalCode || ""
                            }, ${addressData.country || ""}`
                          : quotation.shipTo ||
                            "456, Park Avenue, New York, USA"}
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                {/* Product Table */}
                <table className="quotation-table full-width">
                  <thead>
                    <tr>
                      <th rowSpan="2">S.No</th>
                      <th rowSpan="2">Product Image</th>
                      <th rowSpan="2">Product Name</th>
                      <th rowSpan="2">Product Code</th>
                      <th colSpan="5">Amount</th>
                    </tr>
                    <tr>
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
                        let imageUrl = null;
                        try {
                          if (productDetail?.images) {
                            const imgs = JSON.parse(productDetail.images);
                            imageUrl = Array.isArray(imgs) ? imgs[0] : null;
                          }
                        } catch {
                          imageUrl = null;
                        }
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
                                  alt="Product"
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
