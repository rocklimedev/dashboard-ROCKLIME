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
import sampleQuotationTemplate from "../../assets/Sample-Quotation.xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
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
      console.warn(`Invalid image URL: ${url}`);
      return false;
    }

    if (url.startsWith("data:image/")) {
      const isValid = /data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,/.test(
        url
      );
      if (!isValid)
        console.warn(`Invalid base64 image URL: ${url.slice(0, 50)}...`);
      return isValid;
    }

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

  // Placeholder image
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
              console.error(
                `Failed to fetch image after ${retries} attempts: ${url}, Error: ${err.message}`
              );
              return placeholderImage;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
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

        // Handle logo image
        let logoImage = placeholderImage;
        try {
          if (logo.startsWith("data:image/")) {
            // If logo is a base64 string
            const matches = logo.match(
              /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,(.+)$/
            );
            if (matches) {
              const extension = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, "base64");
              if (buffer && buffer.length > 0) {
                logoImage = { buffer, extension };
                console.log(
                  `Logo loaded from base64, Size: ${buffer.length} bytes`
                );
              } else {
                console.error("Empty buffer from base64 logo");
              }
            } else {
              console.error("Invalid base64 logo format");
            }
          } else {
            // If logo is a URL
            const response = await fetch(logo, {
              mode: "cors",
              credentials: "omit",
              headers: { Accept: "image/*" },
            });
            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status} - ${response.statusText}`
              );
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.startsWith("image/")) {
              throw new Error(`Unsupported content type: ${contentType}`);
            }
            const extension = contentType.split("/")[1].toLowerCase();
            const buffer = Buffer.from(await response.arrayBuffer());
            if (buffer && buffer.length > 0) {
              logoImage = { buffer, extension };
              console.log(
                `Logo fetched from URL, Size: ${buffer.length} bytes`
              );
            } else {
              console.error("Empty buffer from logo URL");
            }
          }
        } catch (error) {
          console.error(`Error processing logo: ${error.message}`);
          toast.warning("Using placeholder logo due to error in loading logo.");
        }

        const imagePromises = [
          Promise.resolve(logoImage),
          ...exportRows.map((row) =>
            row.imageUrl
              ? fetchImageAsBuffer(row.imageUrl)
              : Promise.resolve(placeholderImage)
          ),
        ];
        const images = await Promise.all(imagePromises);
        const logoImageFinal = images[0];
        const productImages = images.slice(1);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Quotation");

        worksheet.columns = [
          { width: 8 },
          { width: 15 },
          { width: 25 },
          { width: 15 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
          { width: 8 },
          { width: 12 },
        ];

        // Add logo with exact dimensions as in the component
        try {
          const logoId = workbook.addImage({
            buffer: logoImageFinal.buffer,
            extension: logoImageFinal.extension,
          });
          worksheet.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 100, height: 50 }, // Match component logo size
            editAs: "oneCell",
          });
          worksheet.getRow(1).height = 60; // Ensure enough row height
          console.log("Logo added successfully to Excel");
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

        // Rest of the worksheet setup (unchanged)
        worksheet.mergeCells("B1:D1");
        worksheet.getCell("B1").value = "Estimate / Quotation";
        worksheet.getCell("B1").font = { bold: true, size: 16 };
        worksheet.getCell("B1").alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.mergeCells("E1:I1");
        worksheet.getCell("E1").value = brandNames;
        worksheet.getCell("E1").font = { bold: true, size: 12 };
        worksheet.getCell("E1").alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        worksheet.mergeCells("A3:A4");
        worksheet.getCell("A3").value = "M/s";
        worksheet.getCell("A3").font = { bold: true };
        worksheet.getCell("A3").alignment = { vertical: "middle" };
        worksheet.mergeCells("B3:E4");
        worksheet.getCell("B3").value = getCustomerName(quotation.customerId);
        worksheet.getCell("B3").alignment = { vertical: "middle" };
        worksheet.mergeCells("F3:F4");
        worksheet.getCell("F3").value = "Date";
        worksheet.getCell("F3").font = { bold: true };
        worksheet.getCell("F3").alignment = { vertical: "middle" };
        worksheet.mergeCells("G3:I4");
        worksheet.getCell("G3").value = quotation.quotation_date
          ? new Date(quotation.quotation_date).toLocaleDateString()
          : new Date().toLocaleDateString();
        worksheet.getCell("G3").alignment = { vertical: "middle" };

        worksheet.mergeCells("A5:A6");
        worksheet.getCell("A5").value = "Address";
        worksheet.getCell("A5").font = { bold: true };
        worksheet.getCell("A5").alignment = { vertical: "middle" };
        worksheet.mergeCells("B5:I6");
        worksheet.getCell("B5").value = addressData
          ? `${addressData.street || ""}, ${addressData.city || ""}, ${
              addressData.state || ""
            }, ${addressData.postalCode || ""}, ${addressData.country || ""}`
          : quotation.shipTo || "456, Park Avenue, New York, USA";
        worksheet.getCell("B5").alignment = { vertical: "middle" };

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
        headerRow1.font = { bold: true };
        headerRow1.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.mergeCells(`E${headerRow1.number}:I${headerRow1.number}`);
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
        headerRow2.font = { bold: true };
        headerRow2.alignment = { vertical: "middle", horizontal: "center" };
        headerRow2.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        let currentRow = headerRow2.number + 1;
        exportRows.forEach((row, index) => {
          const excelRow = worksheet.addRow([
            row.index,
            "",
            row.name,
            row.code,
            row.mrp,
            row.discount,
            row.rate,
            row.qty,
            row.total,
          ]);
          excelRow.eachCell((cell) => {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });

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
              worksheet.getRow(currentRow).height = 50;
            } catch (error) {
              console.error(
                `Error adding image for product ${row.name}: ${error.message}`
              );
            }
          }

          currentRow++;
        });

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
        totalRow.font = { bold: true };
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

        toast.success("Quotation exported successfully as Excel!");
      } else if (exportFormat === "pdf") {
        // PDF export logic remains unchanged
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

        toast.success("Quotation exported successfully as PDF!");
      }
    } catch (error) {
      toast.error(
        `Failed to export quotation as ${exportFormat.toUpperCase()}: ${
          error.message
        }`
      );
      console.error("Export error:", error);
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
                <i className="ti ti-arrow-left"></i>
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
