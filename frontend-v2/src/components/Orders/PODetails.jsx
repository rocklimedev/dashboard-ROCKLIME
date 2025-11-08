import React, { useRef, useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetPurchaseOrderByIdQuery } from "../../api/poApi";
import { useGetVendorByIdQuery } from "../../api/vendorApi";
import { useGetProductByIdQuery } from "../../api/productApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useGetCompanyByIdQuery } from "../../api/companyApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import "./po.css"; // Assume a similar CSS file for styling
import useProductsData from "../../data/useProductdata";
import { Buffer } from "buffer";
import { LeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";
const PODetails = () => {
  const { id } = useParams();
  const {
    data: purchaseOrder,
    error,
    isLoading: isPurchaseOrderLoading,
  } = useGetPurchaseOrderByIdQuery(id);
  const [isExporting, setIsExporting] = useState(false);
  const { data: vendorsData } = useGetVendorsQuery();
  const vendors = vendorsData?.data || [];
  // Remove this line
  const { data: vendor } = useGetVendorByIdQuery(purchaseOrder?.vendorId, {
    skip: !purchaseOrder?.vendorId,
  });
  const companyId = "401df7ef-f350-4bc4-ba6f-bf36923af252";
  const {
    data: companyData,
    isLoading: isCompanyLoading,
    isError: isCompanyError,
  } = useGetCompanyByIdQuery(companyId, { skip: !companyId });
  const company = companyData?.data || {};
  const poRef = useRef(null);
  const [exportFormat, setExportFormat] = useState("pdf");

  // Stabilize products array
  const products = useMemo(
    () => (Array.isArray(purchaseOrder?.items) ? purchaseOrder.items : []),
    [purchaseOrder?.items]
  );

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

  const getVendorName = (vendorId) => {
    if (purchaseOrder?.Vendor?.vendorName) {
      return purchaseOrder.Vendor.vendorName;
    }
    if (!vendors || vendors.length === 0 || !vendorId) return "Unknown";
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor ? vendor.vendorName : "Unknown";
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
      return isValid;
    }

    try {
      new URL(url);
      const imageExtensions = /\.(png|jpg|jpeg|gif|bmp|webp)$/i;
      return imageExtensions.test(url.split("?")[0]);
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
        toast.error("Purchase Order ID is missing.");
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
            productDetail.metaDetails?.find(
              (md) =>
                md.slug === "companyCode" ||
                md.title === "company_code" ||
                md.title === "companyCode"
            )?.value ||
            productDetail.meta?.d11da9f9_3f2e_4536_8236_9671200cca4a ||
            "N/A";
          const sellingPrice =
            Number(
              productDetail.metaDetails?.find(
                (md) =>
                  md.slug === "sellingPrice" ||
                  md.title === "Selling Price" ||
                  md.title === "sellingPrice"
              )?.value
            ) ||
            Number(productDetail.sellingPrice) ||
            0;
          const quantity = Number(product.quantity) || 0;
          const total = quantity * sellingPrice;

          return {
            index: index + 1,
            imageUrl,
            name: product.name || productDetail?.name || "N/A",
            code: productCode,
            mrp: sellingPrice ? `₹${sellingPrice.toFixed(2)}` : "N/A",
            quantity,
            total: total ? `₹${total.toFixed(2)}` : "N/A",
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
        const worksheet = workbook.addWorksheet("Purchase Order", {
          properties: { defaultColWidth: 15, defaultRowHeight: 20 },
        });

        // Set column widths to match HTML proportions
        worksheet.columns = [
          { width: 8 }, // S.No
          { width: 15 }, // Product Image
          { width: 25 }, // Product Name
          { width: 15 }, // Product Code
          { width: 12 }, // MRP
          { width: 8 }, // Quantity
          { width: 12 }, // Total
        ];

        // Add logo (100x50 pixels, centered)
        const logoId = workbook.addImage({
          buffer: logoImage.buffer,
          extension: logoImage.extension,
        });
        worksheet.addImage(logoId, {
          tl: { col: 2.5, row: 0 }, // Center logo
          ext: { width: 100, height: 50 },
          editAs: "absolute",
        });
        worksheet.getRow(1).height = 60;

        // Add title and brand
        worksheet.mergeCells("B2:D2");
        worksheet.getCell("B2").value = "Purchase Order";
        worksheet.getCell("B2").font = { bold: true, size: 16 };
        worksheet.getCell("B2").alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        worksheet.mergeCells("E2:G2");
        worksheet.getCell("E2").value = brandNames;
        worksheet.getCell("E2").font = { bold: true, size: 12 };
        worksheet.getCell("E2").alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        // Vendor details
        worksheet.mergeCells("A4:A5");
        worksheet.getCell("A4").value = "Vendor";
        worksheet.getCell("A4").font = { bold: true };
        worksheet.getCell("A4").alignment = { vertical: "middle" };

        worksheet.mergeCells("B4:D5");
        worksheet.getCell("B4").value = getVendorName(purchaseOrder.vendorId);
        worksheet.getCell("B4").alignment = {
          vertical: "middle",
          wrapText: true,
        };

        worksheet.mergeCells("E4:E5");
        worksheet.getCell("E4").value = "Order Date";
        worksheet.getCell("E4").font = { bold: true };
        worksheet.getCell("E4").alignment = { vertical: "middle" };

        worksheet.mergeCells("F4:G5");
        worksheet.getCell("F4").value = purchaseOrder.orderDate
          ? new Date(purchaseOrder.orderDate).toLocaleDateString()
          : new Date().toLocaleDateString();
        worksheet.getCell("F4").alignment = { vertical: "middle" };

        worksheet.mergeCells("A6:A7");
        worksheet.getCell("A6").value = "Expected Delivery";
        worksheet.getCell("A6").font = { bold: true };
        worksheet.getCell("A6").alignment = { vertical: "middle" };

        worksheet.mergeCells("B6:G7");
        worksheet.getCell("B6").value = purchaseOrder.expectDeliveryDate
          ? new Date(purchaseOrder.expectDeliveryDate).toLocaleDateString()
          : "N/A";
        worksheet.getCell("B6").alignment = {
          vertical: "middle",
          wrapText: true,
        };

        // Product table headers
        const headerRow = worksheet.addRow([
          "S.No",
          "Product Image",
          "Product Name",
          "Product Code",
          "MRP",
          "Quantity",
          "Total",
        ]);
        headerRow.font = { bold: true, size: 11 };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Product rows
        let currentRow = headerRow.number + 1;
        exportRows.forEach((row, index) => {
          const excelRow = worksheet.addRow([
            row.index,
            "", // Placeholder for image
            row.name,
            row.code,
            row.mrp,
            row.quantity,
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

        // Total section
        const totalRow = worksheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "Total",
          `₹${Number(purchaseOrder.totalAmount || 0).toFixed(2)}`,
        ]);
        totalRow.font = { bold: true, size: 11 };
        totalRow.eachCell((cell, colNumber) => {
          if (colNumber > 5) {
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
        a.download = `PurchaseOrder_${id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (exportFormat === "pdf") {
        if (!poRef.current) {
          toast.error("Purchase Order content not found.");
          return;
        }
        const canvas = await html2canvas(poRef.current, {
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
        pdf.save(`PurchaseOrder_${id}.pdf`);
      }
    } catch (error) {
      toast.error(
        `Failed to export purchase order as ${exportFormat.toUpperCase()}: ${
          error.message
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isPurchaseOrderLoading || isCompanyLoading || loading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Loading purchase order details...</p>
        </div>
      </div>
    );
  }

  if (error || isCompanyError) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">
            Error loading purchase order or company details.
          </p>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Purchase Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Helmet>
        <title>{purchaseOrder?.poNumber}</title>
      </Helmet>
      <div className="content">
        <div className="row">
          <div className="col-sm-10 mx-auto">
            <Link
              to="/po/list"
              className="back-icon d-flex align-items-center fs-12 fw-medium mb-3 d-inline-flex"
            >
              <span className="d-flex justify-content-center align-items-center rounded-circle me-2">
                <LeftOutlined />
              </span>
              Back to Purchase Orders
            </Link>
            <div className="card">
              <div className="po-container" ref={poRef}>
                <table className="po-table full-width">
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
                      <td className="title-cell">Purchase Order</td>
                      <td className="brand-cell">{brandNames}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="po-table full-width">
                  <tbody>
                    <tr>
                      <td className="label-cell" style={{ width: "15%" }}>
                        Vendor
                      </td>
                      <td style={{ width: "55%" }}>
                        {getVendorName(purchaseOrder.vendorId)}
                      </td>
                      <td className="label-cell" style={{ width: "15%" }}>
                        Order Date
                      </td>
                      <td style={{ width: "15%" }}>
                        {purchaseOrder.orderDate
                          ? new Date(
                              purchaseOrder.orderDate
                            ).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">Expected Delivery</td>
                      <td style={{ width: "55%" }}>
                        {purchaseOrder.expectDeliveryDate
                          ? new Date(
                              purchaseOrder.expectDeliveryDate
                            ).toLocaleDateString()
                          : " "}
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                <table className="po-table full-width">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Product Image</th>
                      <th>Product Name</th>
                      <th>Product Code</th>
                      <th>MRP</th>
                      <th>Quantity</th>
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
                          productDetail?.metaDetails?.find(
                            (md) =>
                              md.slug === "companyCode" ||
                              md.title === "company_code" ||
                              md.title === "companyCode"
                          )?.value ||
                          productDetail?.meta
                            ?.d11da9f9_3f2e_4536_8236_9671200cca4a ||
                          "N/A";

                        const sellingPrice =
                          Number(
                            productDetail?.metaDetails?.find(
                              (md) =>
                                md.slug === "sellingPrice" ||
                                md.title === "Selling Price" ||
                                md.title === "sellingPrice"
                            )?.value
                          ) ||
                          Number(productDetail?.sellingPrice) ||
                          0;

                        const quantity = Number(product.quantity) || 0;
                        const total = quantity * sellingPrice;

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
                              {product?.name || productDetail?.name || "N/A"}
                            </td>
                            <td>{productCode}</td>
                            <td>
                              {sellingPrice
                                ? `₹${Number(sellingPrice).toFixed(2)}`
                                : "N/A"}
                            </td>
                            <td>{quantity || "N/A"}</td>
                            <td>
                              {quantity && sellingPrice
                                ? `₹${Number(total).toFixed(2)}`
                                : "N/A"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No products available for this purchase order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <table className="po-table full-width bordered">
                  <tbody>
                    <tr>
                      <td colSpan="6" className="text-right fw-bold">
                        Total
                      </td>
                      <td className="fw-bold">
                        ₹{Number(purchaseOrder.totalAmount || 0).toFixed(2)}
                      </td>
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
                  disabled={isExporting}
                >
                  <PrinterOutlined />
                  {isExporting ? "Exporting..." : "Export Purchase Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PODetails;
