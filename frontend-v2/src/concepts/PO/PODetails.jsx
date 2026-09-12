import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetPurchaseOrderByIdQuery } from "../../api/poApi";
import { message, Popover, Checkbox } from "antd";
import logo from "../../assets/img/logo.png";
import defaultProductImg from "../../assets/img/default.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import {
  LeftOutlined,
  PrinterOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";
import "../../components/Orders/po.css";

// Fields the user is allowed to remove from the export.
// "S.No" is intentionally excluded — it always stays as the row anchor.
const EXPORT_FIELDS = [
  { key: "image", label: "Product Image" },
  { key: "productName", label: "Product Name" },
  { key: "productCode", label: "Product Code" },
  { key: "mrp", label: "MRP" },
  { key: "quantity", label: "Quantity" },
  { key: "total", label: "Total" },
  { key: "grandTotal", label: "Grand Total" }, // NEW: Allow toggling Grand Total row
];

const DEFAULT_VISIBLE_FIELDS = EXPORT_FIELDS.reduce((acc, f) => {
  acc[f.key] = true;
  return acc;
}, {});

// A4 page dimensions at 96dpi (210mm x 297mm), used so the on-screen
// preview matches the exported PDF page size/proportions.
const A4_WIDTH_PX = 794;
const A4_MIN_HEIGHT_PX = 1123;

const PODetails = () => {
  const { id } = useParams();
  const {
    data: purchaseOrder,
    isLoading,
    error,
  } = useGetPurchaseOrderByIdQuery(id);

  const [isExporting, setIsExporting] = useState(false);
  const poRef = useRef(null);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [visibleFields, setVisibleFields] = useState(DEFAULT_VISIBLE_FIELDS);
  const [fieldsPopoverOpen, setFieldsPopoverOpen] = useState(false);

  if (isLoading)
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          Loading purchase order details...
        </div>
      </div>
    );
  if (error || !purchaseOrder) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">
            {error?.data?.message || "Purchase Order not found"}
          </p>
        </div>
      </div>
    );
  }

  const {
    poNumber,
    vendor,
    orderDate,
    expectDeliveryDate,
    totalAmount,
    createdBy,
    items = [],
  } = purchaseOrder;

  const selectedFields = EXPORT_FIELDS.filter(
    (f) => f.key !== "grandTotal" && visibleFields[f.key],
  );
  const showGrandTotal = visibleFields.grandTotal;
  const columnCount = 1 + selectedFields.length; // +1 for S.No

  const toggleField = (key) => {
    setVisibleFields((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Prevent removing every field — keep at least one alongside S.No
      const anyLeft = EXPORT_FIELDS.some(
        (f) => f.key !== "grandTotal" && next[f.key],
      );
      return anyLeft ? next : prev;
    });
  };

  const renderCell = (item, key) => {
    switch (key) {
      case "image":
        return (
          <td key={key}>
            <img
              src={item.imageUrl || defaultProductImg}
              alt={item.productName}
              style={{
                maxWidth: "70px",
                maxHeight: "70px",
                objectFit: "contain",
                borderRadius: "4px",
                border: "1px solid #eee",
                backgroundColor: "#f8f9fa",
              }}
              onError={(e) => {
                e.currentTarget.src = defaultProductImg;
              }}
              crossOrigin="anonymous"
            />
          </td>
        );
      case "productName":
        return <td key={key}>{item.productName || "N/A"}</td>;
      case "productCode":
        return <td key={key}>{item.companyCode || "N/A"}</td>;
      case "mrp":
        return (
          <td key={key}>₹{(item.unitPrice ?? item.mrp ?? 0).toFixed(2)}</td>
        );
      case "quantity":
        return <td key={key}>{item.quantity || 0}</td>;
      case "total":
        return (
          <td key={key}>
            ₹
            {Number(
              (item.total ?? item.unitPrice * item.quantity) || 0,
            ).toFixed(2)}
          </td>
        );
      default:
        return null;
    }
  };

  const fieldHeaderWidths = {
    image: "12%",
    productName: "38%",
    productCode: "15%",
    mrp: "12%",
    quantity: "8%",
    total: "10%",
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "pdf") {
        if (!poRef.current) {
          message.error("Purchase Order content not found.");
          return;
        }

        // Minimize visual disruption
        const originalScrollY = window.scrollY;
        window.scrollTo({ top: 0, behavior: "instant" });

        // Small delay helps images stabilize and reduces flicker
        await new Promise((resolve) => setTimeout(resolve, 400));

        const canvas = await html2canvas(poRef.current, {
          scale: 2.5, // Higher quality
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: poRef.current.scrollWidth,
          windowHeight: poRef.current.scrollHeight,
          onclone: (clonedDoc) => {
            // Force images to load eagerly in the cloned document
            Array.from(clonedDoc.getElementsByTagName("img")).forEach((img) => {
              if (!img.complete) {
                img.loading = "eager";
              }
            });
          },
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

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          10,
          position,
          imgWidth,
          imgHeight,
        );
        heightLeft -= pageHeight - 20;

        while (heightLeft > 0) {
          pdf.addPage();
          position = heightLeft - imgHeight + 10;
          pdf.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            10,
            position,
            imgWidth,
            imgHeight,
          );
          heightLeft -= pageHeight - 20;
        }

        pdf.save(`PurchaseOrder_${poNumber || id}.pdf`);

        // Restore scroll position
        window.scrollTo({ top: originalScrollY, behavior: "instant" });
      } else if (exportFormat === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Purchase Order");

        // S.No column + one column per selected field
        const colWidths = {
          image: 15,
          productName: 35,
          productCode: 18,
          mrp: 12,
          quantity: 10,
          total: 14,
        };
        worksheet.columns = [
          { width: 8 }, // S.No
          ...selectedFields.map((f) => ({ width: colWidths[f.key] })),
        ];

        const lastColLetter = worksheet.getColumn(columnCount).letter;

        // Header section
        worksheet.mergeCells(`A1:${lastColLetter}1`);
        worksheet.getCell("A1").value = " ";

        const midCol = Math.max(2, Math.ceil(columnCount / 2));
        worksheet.mergeCells(`B2:${worksheet.getColumn(midCol).letter}2`);
        worksheet.getCell("B2").value = "Purchase Order";
        worksheet.getCell("B2").font = { bold: true, size: 16 };
        worksheet.getCell("B2").alignment = { horizontal: "center" };

        // Vendor & Dates
        worksheet.getCell("A4").value = "Vendor";
        worksheet.getCell("B4").value = vendor?.vendorName || "N/A";

        worksheet.getCell("A5").value = "Order Date";
        worksheet.getCell("B5").value = orderDate
          ? new Date(orderDate).toLocaleDateString("en-IN")
          : "N/A";

        worksheet.getCell("A6").value = "Expected Delivery";
        worksheet.getCell("B6").value = expectDeliveryDate
          ? new Date(expectDeliveryDate).toLocaleDateString("en-IN")
          : "N/A";

        // Table headers
        const headerLabels = {
          image: "Product Image",
          productName: "Product Name",
          productCode: "Product Code",
          mrp: "MRP",
          quantity: "Quantity",
          total: "Total",
        };
        const headerRow = worksheet.addRow([
          "S.No",
          ...selectedFields.map((f) => headerLabels[f.key]),
        ]);
        headerRow.font = { bold: true };

        // Items
        items.forEach((item, index) => {
          const row = [index + 1];
          selectedFields.forEach((f) => {
            switch (f.key) {
              case "image":
                row.push(""); // Image placeholder (can be extended later with base64)
                break;
              case "productName":
                row.push(item.productName || "N/A");
                break;
              case "productCode":
                row.push(item.companyCode || "N/A");
                break;
              case "mrp":
                row.push(
                  `₹${Number(item.unitPrice ?? item.mrp ?? 0).toFixed(2)}`,
                );
                break;
              case "quantity":
                row.push(item.quantity || 0);
                break;
              case "total":
                row.push(
                  `₹${Number(
                    (item.total ?? item.unitPrice * item.quantity) || 0,
                  ).toFixed(2)}`,
                );
                break;
              default:
                row.push("");
            }
          });
          worksheet.addRow(row);
        });

        // Grand Total (only if enabled)
        if (showGrandTotal) {
          const totalRow = new Array(columnCount).fill("");
          totalRow[columnCount - 2 >= 0 ? columnCount - 2 : 0] = "Total";
          totalRow[columnCount - 1] = `₹${Number(totalAmount ?? 0).toFixed(2)}`;
          const totalExcelRow = worksheet.addRow(totalRow);
          totalExcelRow.font = { bold: true };
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PurchaseOrder_${poNumber || id}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      message.error(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const fieldsPopoverContent = (
    <div style={{ minWidth: "200px" }}>
      {EXPORT_FIELDS.map((f) => (
        <div key={f.key} style={{ marginBottom: "6px" }}>
          <Checkbox
            checked={visibleFields[f.key]}
            onChange={() => toggleField(f.key)}
          >
            {f.label}
          </Checkbox>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page-wrapper">
      <Helmet>
        <title>{poNumber || "Purchase Order Details"}</title>
      </Helmet>

      <div className="content">
        <div className="row">
          <div className="col-sm-10 mx-auto">
            {/* Page Header: back link, title, and export controls live here.
                The PO content/structure below (po-container) is untouched. */}
            <div className="po-page-header d-flex justify-content-between align-items-center flex-wrap mb-3">
              <div className="d-flex flex-column">
                <Link
                  to="/purchase-manager"
                  className="back-icon d-flex align-items-center fs-12 fw-medium mb-2 d-inline-flex"
                >
                  <span className="d-flex justify-content-center align-items-center rounded-circle me-2">
                    <LeftOutlined />
                  </span>
                  Back to Purchase Orders
                </Link>
                <h4 className="mb-0">{poNumber || "Purchase Order Details"}</h4>
              </div>

              <div className="d-flex align-items-center flex-wrap">
                <Popover
                  content={fieldsPopoverContent}
                  title="Fields to include"
                  trigger="click"
                  open={fieldsPopoverOpen}
                  onOpenChange={setFieldsPopoverOpen}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-2 d-flex align-items-center"
                  >
                    <SettingOutlined className="me-2" />
                    Customize Fields
                  </button>
                </Popover>

                <select
                  className="form-select me-2"
                  style={{ width: "auto" }}
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
                  <PrinterOutlined className="me-2" />
                  {isExporting ? "Exporting..." : "Export Purchase Order"}
                </button>
              </div>
            </div>

            {/* A4 page preview wrapper: centers the document and gives it a
                page-like backdrop. The po-container below is sized to A4
                (210mm x 297mm) so the on-screen preview matches the export. */}
            <div
              className="po-page-preview"
              style={{
                background: "#e9ecef",
                padding: "24px",
                overflowX: "auto",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div className="card" style={{ margin: 0 }}>
                <div
                  className="po-container"
                  ref={poRef}
                  style={{
                    width: `${A4_WIDTH_PX}px`,
                    minHeight: `${A4_MIN_HEIGHT_PX}px`,
                    padding: "40px",
                    margin: "0 auto",
                    background: "#ffffff",
                    boxSizing: "border-box",
                    boxShadow: "0 0 8px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Header */}
                  <table className="po-table full-width">
                    <tbody>
                      <tr>
                        <td
                          colSpan={3}
                          style={{ textAlign: "center", padding: "20px 0" }}
                        >
                          <img
                            src={logo}
                            alt="Company Logo"
                            className="logo-img"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td
                          className="title-cell"
                          style={{ textAlign: "center" }}
                        >
                          Purchase Order
                        </td>
                        <td
                          className="brand-cell"
                          style={{ textAlign: "right" }}
                        >
                          {poNumber || "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Vendor & Dates - Improved Layout */}
                  <table className="po-table full-width">
                    <tbody>
                      <tr>
                        <td
                          className="label-cell"
                          style={{ width: "18%" }}
                          rowSpan={2}
                        >
                          Vendor
                        </td>
                        <td style={{ width: "52%" }} rowSpan={2}>
                          {vendor?.vendorName || "N/A"}
                        </td>
                        <td className="label-cell" style={{ width: "15%" }}>
                          Order Date
                        </td>
                        <td style={{ width: "15%" }}>
                          {orderDate
                            ? new Date(orderDate).toLocaleDateString("en-IN")
                            : "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td className="label-cell">Expected Delivery</td>
                        <td>
                          {expectDeliveryDate
                            ? new Date(expectDeliveryDate).toLocaleDateString(
                                "en-IN",
                              )
                            : "N/A"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Items Table - fields shown depend on visibleFields selection */}
                  <table className="po-table full-width">
                    <thead>
                      <tr>
                        <th style={{ width: "5%" }}>S.No</th>
                        {selectedFields.map((f) => (
                          <th
                            key={f.key}
                            style={{ width: fieldHeaderWidths[f.key] }}
                          >
                            {f.key === "quantity" ? "Qty" : f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length > 0 ? (
                        items.map((item, index) => (
                          <tr key={item._id || index}>
                            <td>{index + 1}</td>
                            {selectedFields.map((f) => renderCell(item, f.key))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={columnCount} className="text-center">
                            No products in this purchase order
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {showGrandTotal && (
                      <tfoot>
                        <tr
                          style={{
                            fontWeight: "bold",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          {visibleFields.total ? (
                            <>
                              <td
                                colSpan={columnCount - 1}
                                style={{ textAlign: "right" }}
                              >
                                Grand Total
                              </td>
                              <td>₹{Number(totalAmount ?? 0).toFixed(2)}</td>
                            </>
                          ) : (
                            <td
                              colSpan={columnCount}
                              style={{ textAlign: "right" }}
                            >
                              Grand Total: ₹
                              {Number(totalAmount ?? 0).toFixed(2)}
                            </td>
                          )}
                        </tr>
                      </tfoot>
                    )}
                  </table>

                  {/* Approved By Section */}
                  <div
                    style={{
                      marginTop: "60px",
                      padding: "20px 0",
                      borderTop: "2px solid #ddd",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontWeight: "500",
                            textAlign: "center",
                          }}
                        >
                          Approved By
                        </p>

                        {/* Space for signature & stamp */}
                        <div
                          style={{
                            height: "80px", // increase to 100-120px if needed
                          }}
                        />

                        <div
                          style={{
                            width: "260px",
                            borderBottom: "1px solid #333",
                            marginBottom: "4px",
                          }}
                        />

                        <small
                          style={{
                            display: "block",
                            textAlign: "center",
                          }}
                        >
                          Name &amp; Signature with Date
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PODetails;
