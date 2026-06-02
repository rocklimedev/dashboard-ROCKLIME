import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetPurchaseOrderByIdQuery } from "../../api/poApi";
import { message } from "antd";
import logo from "../../assets/img/logo.png";
import defaultProductImg from "../../assets/img/default.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import { LeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";
import "../../components/Orders/po.css";

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

        const originalScrollY = window.scrollY;
        window.scrollTo({ top: 0, behavior: "instant" });

        await new Promise((resolve) => setTimeout(resolve, 400));

        const canvas = await html2canvas(poRef.current, {
          scale: 2.5,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: poRef.current.scrollWidth,
          windowHeight: poRef.current.scrollHeight,
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
        window.scrollTo({ top: originalScrollY, behavior: "instant" });
      } else if (exportFormat === "excel") {
        // Excel export remains same (you can enhance it later if needed)
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Purchase Order");

        // ... (your existing Excel logic)
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
                          style={{ maxHeight: "80px" }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td
                        className="title-cell"
                        style={{
                          textAlign: "center",
                          fontSize: "24px",
                          fontWeight: "bold",
                        }}
                      >
                        Purchase Order
                      </td>
                      <td
                        className="brand-cell"
                        style={{ textAlign: "right", fontWeight: "bold" }}
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
                      <td className="label-cell" style={{ width: "18%" }}>
                        Vendor
                      </td>
                      <td style={{ width: "52%" }}>
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
                      <td colSpan={3}>
                        {expectDeliveryDate
                          ? new Date(expectDeliveryDate).toLocaleDateString(
                              "en-IN",
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Items Table - Better Column Merging & Spacing */}
                <table className="po-table full-width">
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>S.No</th>
                      <th style={{ width: "12%" }}>Product Image</th>
                      <th style={{ width: "38%" }}>Product Name</th>
                      <th style={{ width: "18%" }}>Product Code</th>
                      <th style={{ width: "12%" }}>MRP</th>
                      <th style={{ width: "10%" }}>Quantity</th>
                      <th style={{ width: "5%" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={item._id || index}>
                          <td>{index + 1}</td>
                          <td>
                            <img
                              src={item.imageUrl || defaultProductImg}
                              alt={item.productName || "Product"}
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
                              loading="lazy"
                              crossOrigin="anonymous"
                            />
                          </td>
                          <td>{item.productName || "N/A"}</td>
                          <td>{item.companyCode || "N/A"}</td>
                          <td>
                            ₹{(item.unitPrice ?? item.mrp ?? 0).toFixed(2)}
                          </td>
                          <td>{item.quantity || 0}</td>
                          <td>₹{Number(item.total ?? 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          No products in this purchase order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Grand Total */}
                <table className="po-table full-width">
                  <tbody>
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "right", fontWeight: "bold" }}
                      >
                        Grand Total
                      </td>
                      <td
                        colSpan={2}
                        style={{ fontWeight: "bold", fontSize: "18px" }}
                      >
                        ₹{Number(totalAmount ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Approved By Section - Signature Area */}
                <div
                  style={{
                    marginTop: "60px",
                    borderTop: "2px solid #ddd",
                    paddingTop: "30px",
                  }}
                >
                  <table className="po-table full-width">
                    <tbody>
                      <tr>
                        <td style={{ width: "50%", textAlign: "center" }}>
                          <div
                            style={{
                              borderBottom: "1px solid #333",
                              width: "70%",
                              margin: "0 auto 8px",
                            }}
                          ></div>
                          <strong>Prepared By</strong>
                        </td>
                        <td style={{ width: "50%", textAlign: "center" }}>
                          <div
                            style={{
                              borderBottom: "1px solid #333",
                              width: "70%",
                              margin: "0 auto 8px",
                              minHeight: "40px",
                            }}
                          ></div>
                          <strong>Approved By</strong>
                          <p
                            style={{
                              fontSize: "12px",
                              margin: "4px 0 0",
                              color: "#666",
                            }}
                          >
                            Signature &amp; Date
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Export Controls */}
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
                  <PrinterOutlined className="me-2" />
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
