import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetPurchaseOrderByIdQuery } from "../../api/poApi";
import { message } from "antd";
import logo from "../../assets/img/logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import { LeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";
import "./po.css";

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

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Loading purchase order details...</p>
        </div>
      </div>
    );
  }

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
    items = [],
  } = purchaseOrder;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "pdf") {
        if (!poRef.current) {
          message.error("Purchase Order content not found.");
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
        pdf.save(`PurchaseOrder_${poNumber || id}.pdf`);
      } else if (exportFormat === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Purchase Order");

        worksheet.columns = [
          { width: 8 }, // S.No
          { width: 15 }, // Image placeholder (we skip actual image in excel for simplicity)
          { width: 35 }, // Product Name
          { width: 18 }, // Product Code
          { width: 12 }, // MRP
          { width: 10 }, // Quantity
          { width: 14 }, // Total
        ];

        // Logo & Title (same structure)
        worksheet.mergeCells("A1:G1");
        worksheet.getCell("A1").value = " ";
        // You can add image logic here if needed (similar to before)

        worksheet.mergeCells("B2:D2");
        worksheet.getCell("B2").value = "Purchase Order";
        worksheet.getCell("B2").font = { bold: true, size: 16 };
        worksheet.getCell("B2").alignment = { horizontal: "center" };

        worksheet.mergeCells("E2:G2");
        worksheet.getCell("E2").value = " "; // Brand can be added if you want

        // Vendor & Dates
        worksheet.getCell("A4").value = "Vendor";
        worksheet.getCell("B4").value = vendor?.vendorName || "N/A";
        worksheet.mergeCells("B4:D4");

        worksheet.getCell("E4").value = "Order Date";
        worksheet.getCell("F4").value = new Date(
          orderDate,
        ).toLocaleDateString();

        worksheet.getCell("A5").value = "Expected Delivery";
        worksheet.getCell("B5").value = expectDeliveryDate
          ? new Date(expectDeliveryDate).toLocaleDateString()
          : "N/A";
        worksheet.mergeCells("B5:D5");

        // Headers
        const headerRow = worksheet.addRow([
          "S.No",
          "Product Image",
          "Product Name",
          "Product Code",
          "MRP",
          "Quantity",
          "Total",
        ]);
        headerRow.font = { bold: true };

        // Items
        items.forEach((item, index) => {
          worksheet.addRow([
            index + 1,
            "", // image placeholder
            item.productName || "N/A",
            item.productCode || "N/A",
            `₹${Number(item.unitPrice || 0).toFixed(2)}`,
            item.quantity || 0,
            `₹${Number(item.total || 0).toFixed(2)}`,
          ]);
        });

        // Total
        worksheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "Total",
          `₹${Number(totalAmount || 0).toFixed(2)}`,
        ]);

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

  return (
    <div className="page-wrapper">
      <Helmet>
        <title>{poNumber || "Purchase Order Details"}</title>
      </Helmet>

      <div className="content">
        <div className="row">
          <div className="col-sm-10 mx-auto">
            <Link
              to="/purchase-manager"
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
                      <td className="brand-cell">{poNumber}</td>
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
                      <td style={{ width: "55%" }}>
                        {expectDeliveryDate
                          ? new Date(expectDeliveryDate).toLocaleDateString(
                              "en-IN",
                            )
                          : "N/A"}
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
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={item._id || index}>
                          <td>{index + 1}</td>
                          <td>
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName || "Product image"}
                                style={{
                                  maxWidth: "80px",
                                  maxHeight: "80px",
                                  objectFit: "contain",
                                  borderRadius: "4px",
                                  border: "1px solid #eee",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "/assets/fallback-product.png"; // optional fallback
                                  e.currentTarget.alt = "Image failed to load";
                                }}
                              />
                            ) : (
                              <span>N/A</span>
                            )}
                          </td>
                          <td>{item.productName || "N/A"}</td>
                          <td>{item.companyCode || "N/A"}</td>
                          <td>
                            ₹
                            {Number(item.unitPrice || item.mrp || 0).toFixed(2)}
                          </td>
                          <td>{item.quantity || 0}</td>
                          <td>₹{Number(item.total || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No products in this purchase order
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
                        ₹{Number(totalAmount || 0).toFixed(2)}
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
