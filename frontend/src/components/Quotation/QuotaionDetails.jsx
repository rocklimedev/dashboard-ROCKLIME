import React, { useRef, useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useExportQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetProductByIdQuery } from "../../api/productApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetCompanyByIdQuery } from "../../api/companyApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import "./quotation.css";
import useProductsData from "../../data/useProductdata";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { Buffer } from "buffer";
import { LeftOutlined, ExportOutlined } from "@ant-design/icons";
const QuotationsDetails = () => {
  const { id } = useParams();
  const {
    data: quotation,
    error,
    isLoading: isQuotationLoading,
  } = useGetQuotationByIdQuery(id);
  const [isExporting, setIsExporting] = useState(false);
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

  // Fix for brand displaying as UUID
  const brandNames = useMemo(() => {
    const uniqueBrands = new Set();
    products.forEach((product) => {
      const productDetail =
        productsData?.find((p) => p.productId === product.productId) || {};
      let brandName = "N/A";
      if (productDetail.brandName) {
        brandName = productDetail.brandName;
      } else if (productDetail.metaDetails) {
        const brandMeta = productDetail.metaDetails.find(
          (m) => m.title === "brandName" || m.title === "brand"
        );
        brandName = brandMeta?.value || "N/A";
      }
      if (
        brandName !== "N/A" &&
        !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          brandName
        )
      ) {
        uniqueBrands.add(brandName);
      }
    });
    return Array.from(uniqueBrands).join(" / ") || "GROHE / AMERICAN STANDARD";
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
      return false;
    }

    if (url.startsWith("data:image/")) {
      const isValid = /data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,/.test(
        url
      );
      if (!isValid) return isValid;
    }

    try {
      new URL(url);
      const imageExtensions = /\.(png|jpg|jpeg|gif|bmp|webp)$/i;
      const isValid = imageExtensions.test(url.split("?")[0]);
      return isValid;
    } catch (error) {
      return false;
    }
  };

  // Placeholder image
  const placeholderImage = {
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAAA1BMVEX///+nxBvIAAAAIElEQVR4nGNgGAWjYBSMglEwCkbBKBgFo2AUjIJRMAoGAK8rB3N0S2o0AAAAAElFTkSuQmCC",
      "base64"
    ),
    extension: "png",
  };

  const fetchImageAsBuffer = async (url, retries = 2) => {
    try {
      if (!url || !isValidImageUrl(url)) {
        return placeholderImage;
      }

      let buffer, extension;

      if (url.startsWith("data:image/")) {
        const matches = url.match(
          /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,(.+)$/
        );
        if (!matches) {
          return placeholderImage;
        }
        extension = matches[1];
        buffer = Buffer.from(matches[2], "base64");
        if (!buffer || buffer.length === 0) {
          return placeholderImage;
        }
      } else {
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
            break;
          } catch (err) {
            if (attempt === retries) {
              return placeholderImage;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      return { buffer, extension };
    } catch (error) {
      return placeholderImage;
    }
  };

  const handleExport = async () => {
    try {
      if (!id) {
        toast.error("Quotation ID is missing.");
        return;
      }

      setIsExporting(true);

      if (exportFormat === "excel") {
        if (!products || products.length === 0) {
          toast.error("No products available to export.");
          return;
        }

        // Prepare export rows
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
          } catch (error) {}

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

        // Fetch logo image
        let logoImage = placeholderImage;
        try {
          if (logo.startsWith("data:image/")) {
            const matches = logo.match(
              /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,(.+)$/
            );
            if (matches) {
              logoImage = {
                buffer: Buffer.from(matches[2], "base64"),
                extension: matches[1],
              };
            }
          } else if (isValidImageUrl(logo)) {
            const response = await fetch(logo, {
              mode: "cors",
              credentials: "omit",
              headers: { Accept: "image/*" },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const contentType = response.headers.get("content-type");
            const extension = contentType.split("/")[1].toLowerCase();
            const buffer = Buffer.from(await response.arrayBuffer());
            logoImage = {
              buffer,
              extension: extension === "jpeg" ? "jpg" : extension,
            };
          }
        } catch (error) {
          toast.warning("Using placeholder logo.");
        }

        // Fetch product images
        const imagePromises = exportRows.map((row) =>
          row.imageUrl && isValidImageUrl(row.imageUrl)
            ? fetchImageAsBuffer(row.imageUrl)
            : Promise.resolve(placeholderImage)
        );
        const productImages = await Promise.all(imagePromises);

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Quotation", {
          properties: { defaultColWidth: 15, defaultRowHeight: 20 },
        });

        // Set column widths to match HTML proportions
        worksheet.columns = [
          { width: 8 }, // S.No
          { width: 15 }, // Product Image
          { width: 25 }, // Product Name
          { width: 15 }, // Product Code
          { width: 12 }, // MRP
          { width: 12 }, // Discount
          { width: 12 }, // Rate
          { width: 8 }, // Unit
          { width: 12 }, // Total
        ];

        // Add logo (100x50 pixels, centered)
        const logoId = workbook.addImage({
          buffer: logoImage.buffer,
          extension: logoImage.extension,
        });
        worksheet.addImage(logoId, {
          tl: { col: 3, row: 0 }, // Center logo (spanning columns 4-6)
          ext: { width: 100, height: 50 },
          editAs: "absolute",
        });
        worksheet.getRow(1).height = 60;

        // Add title and brand
        worksheet.mergeCells("B2:E2");
        worksheet.getCell("B2").value = "Estimate / Quotation";
        worksheet.getCell("B2").font = { bold: true, size: 16 };
        worksheet.getCell("B2").alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        worksheet.mergeCells("F2:I2");
        worksheet.getCell("F2").value = brandNames;
        worksheet.getCell("F2").font = { bold: true, size: 12 };
        worksheet.getCell("F2").alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        // Customer and address details
        worksheet.mergeCells("A4:A5");
        worksheet.getCell("A4").value = "M/s";
        worksheet.getCell("A4").font = { bold: true };
        worksheet.getCell("A4").alignment = { vertical: "middle" };

        worksheet.mergeCells("B4:E5");
        worksheet.getCell("B4").value = getCustomerName(quotation.customerId);
        worksheet.getCell("B4").alignment = {
          vertical: "middle",
          wrapText: true,
        };

        worksheet.mergeCells("F4:F5");
        worksheet.getCell("F4").value = "Date";
        worksheet.getCell("F4").font = { bold: true };
        worksheet.getCell("F4").alignment = { vertical: "middle" };

        worksheet.mergeCells("G4:I5");
        worksheet.getCell("G4").value = quotation.quotation_date
          ? new Date(quotation.quotation_date).toLocaleDateString()
          : new Date().toLocaleDateString();
        worksheet.getCell("G4").alignment = { vertical: "middle" };

        worksheet.mergeCells("A6:A7");
        worksheet.getCell("A6").value = "Address";
        worksheet.getCell("A6").font = { bold: true };
        worksheet.getCell("A6").alignment = { vertical: "middle" };

        worksheet.mergeCells("B6:I7");
        worksheet.getCell("B6").value = addressData
          ? `${addressData.street || ""}, ${addressData.city || ""}, ${
              addressData.state || ""
            }, ${addressData.postalCode || ""}, ${addressData.country || ""}`
          : quotation.shipTo || "456, Park Avenue, New York, USA";
        worksheet.getCell("B6").alignment = {
          vertical: "middle",
          wrapText: true,
        };

        // Product table headers
        const headerRow1 = worksheet.addRow([
          "S.No",
          "Product Image",
          "Product Name",
          "Product Code",
          "Amount",
          "",
          "",
          "",
          "",
        ]);
        worksheet.mergeCells(`E${headerRow1.number}:I${headerRow1.number}`);
        headerRow1.font = { bold: true, size: 11 };
        headerRow1.alignment = { vertical: "middle", horizontal: "center" };
        headerRow1.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        const headerRow2 = worksheet.addRow([
          "",
          "",
          "",
          "",
          "MRP",
          "Discount",
          "Rate",
          "Unit",
          "Total",
        ]);
        headerRow2.font = { bold: true, size: 11 };
        headerRow2.alignment = { vertical: "middle", horizontal: "center" };
        headerRow2.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Product rows
        let currentRow = headerRow2.number + 1;
        exportRows.forEach((row, index) => {
          const excelRow = worksheet.addRow([
            row.index,
            "", // Placeholder for image
            row.name,
            row.code,
            row.mrp,
            row.discount,
            row.rate,
            row.qty,
            row.total,
          ]);
          excelRow.eachCell((cell) => {
            cell.alignment = {
              vertical: "middle",
              horizontal: "center",
              wrapText: true,
            };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
          worksheet.getRow(currentRow).height = 50;

          // Add product image
          if (productImages[index].buffer) {
            try {
              const imageId = workbook.addImage({
                buffer: productImages[index].buffer,
                extension: productImages[index].extension,
              });
              worksheet.addImage(imageId, {
                tl: { col: 1, row: currentRow - 1 },
                ext: { width: 50, height: 50 },
                editAs: "oneCell",
              });
            } catch (error) {}
          }
          currentRow++;
        });

        // Totals section
        const subtotal = products.reduce(
          (sum, product) => sum + Number(product.total || 0),
          0
        );
        const gstAmount =
          quotation.include_gst && quotation.gst_value
            ? (subtotal * Number(quotation.gst_value)) / 100
            : 0;
        const finalTotal = subtotal + gstAmount;

        const subtotalRow = worksheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "Sub Total",
          `₹${subtotal.toFixed(2)}`,
        ]);
        subtotalRow.eachCell((cell, colNumber) => {
          if (colNumber > 7) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });

        if (quotation.include_gst && quotation.gst_value) {
          const gstRow = worksheet.addRow([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            `GST (${quotation.gst_value}%)`,
            `₹${gstAmount.toFixed(2)}`,
          ]);
          gstRow.eachCell((cell, colNumber) => {
            if (colNumber > 7) {
              cell.alignment = { vertical: "middle", horizontal: "center" };
              cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
              };
            }
          });
        }

        const totalRow = worksheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "Total",
          `₹${finalTotal.toFixed(2)}`,
        ]);
        totalRow.font = { bold: true, size: 11 };
        totalRow.eachCell((cell, colNumber) => {
          if (colNumber > 7) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });

        // Generate and download Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Quotation_${id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (exportFormat === "pdf") {
        // PDF export (unchanged)
        if (!quotationRef.current) {
          toast.error("Quotation content not found.");
          return;
        }
        const canvas = await html2canvas(quotationRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const imgWidth = 190;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
        while (heightLeft > 0) {
          pdf.addPage();
          position = heightLeft - imgHeight + 10;
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight - 20;
        }
        pdf.save(`Quotation_${id}.pdf`);
      }
    } catch (error) {
      toast.error(
        `Failed to export quotation as ${exportFormat.toUpperCase()}: ${
          error.message
        }`
      );
    } finally {
      setIsExporting(false);
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
                <LeftOutlined />
              </span>
              Back to List
            </Link>
            <div className="card">
              <div className="quotation-container" ref={quotationRef}>
                <table className="quotation-table full-width">
                  <tbody>
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        <img
                          src={logo}
                          alt="Company Logo"
                          className="logo-img"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td className="title-cell">Estimate / Quotation</td>
                      <td className="brand-cell">{brandNames}</td>
                    </tr>
                  </tbody>
                </table>

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
                  <ExportOutlined />
                  Export Quotation
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
