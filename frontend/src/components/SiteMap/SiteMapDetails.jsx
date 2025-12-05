// src/components/SiteMap/SiteMapDetails.jsx
import React, { useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { message, Button } from "antd";
import { useGetSiteMapByIdQuery } from "../../api/siteMapApi";
import moment from "moment";
import logo from "../../assets/img/logo-quotation.png";
import groheLogo from "../../assets/img/Grohe-Logo.png";
import { exportToPDF } from "./hooks/exportSiteMapPDF";
// Main Component
import styles from "./siteMap.module.css";

// Number to Words (Indian System: Crore, Lakh)
const NumberToWords = (num) => {
  if (!num || num === 0) return "Zero";

  const ones = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const ten = Math.floor((num % 100) / 10);
  const one = num % 10;

  let str = "";
  if (crore) str += ones[crore] + "Crore ";
  if (lakh) str += ones[lakh] + "Lakh ";
  if (thousand) str += ones[thousand] + "Thousand ";
  if (hundred) str += ones[hundred] + "Hundred ";
  if (ten >= 2) str += tens[ten] + (one ? " " + ones[one] : "");
  else if (ten || one) str += ones[ten * 10 + one];

  return str.trim() || "Zero";
};

const SiteMapDetails = () => {
  const { id } = useParams();
  const siteMapRef = useRef(null);

  const { data: response, isLoading } = useGetSiteMapByIdQuery(id);
  const siteMap = response?.data || null;
  const customer = siteMap?.Customer || {};

  // Group items by floor number
  const bathrooms = useMemo(() => {
    if (!siteMap?.items || !Array.isArray(siteMap.items)) return [];

    const grouped = {};
    siteMap.items.forEach((item) => {
      const floor = item.floor_number || 1;
      if (!grouped[floor]) grouped[floor] = [];
      grouped[floor].push(item);
    });

    return Object.keys(grouped)
      .sort((a, b) => Number(a) - Number(b))
      .map((floorNum) => ({
        name: `BATHROOM ${floorNum}`,
        items: grouped[floorNum],
        total: grouped[floorNum].reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
          0
        ),
      }));
  }, [siteMap?.items]);

  const grandTotal = bathrooms.reduce((sum, b) => sum + b.total, 0);

  const handleExportPDF = async () => {
    if (!siteMapRef.current) {
      message.error("PDF content not ready yet. Please wait...");
      return;
    }

    try {
      await exportToPDF(siteMapRef, siteMap, customer);
      message.success("Quotation exported successfully!");
    } catch (err) {
      console.error("PDF Export Error:", err);
      message.error("Failed to export PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">Loading...</div>
        </div>
      </div>
    );
  }

  if (!siteMap) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">Not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-lg-10 mx-auto">
            {/* Back Button */}
            <Link to="/site-maps" className={styles.backButton}>
              <i className="fas fa-arrow-left me-2"></i> Back
            </Link>

            <div className="card mt-3">
              <div className="card-body">
                {/* Export Button */}
                <div className="text-end mb-4">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleExportPDF}
                    className={styles.exportButton}
                  >
                    <i className="fas fa-file-pdf me-2"></i>
                    Export Quotation PDF
                  </Button>
                </div>

                {/* Printable Area */}
                <div ref={siteMapRef} className={styles.printArea}>
                  {/* Individual Bathroom Pages */}
                  {bathrooms.map((bathroom, idx) => (
                    <div
                      key={idx}
                      className={`${styles.quotationPage} quotation-page-print`}
                    >
                      {/* Header */}
                      <table className={styles.headerTable}>
                        <tbody>
                          <tr>
                            <td className={styles.headerLogoLeft}>
                              <img src={logo} alt="Embark" />
                            </td>
                            <td className={styles.headerTitle}>QUOTATION</td>
                            <td className={styles.headerLogoRight}>
                              <img src={groheLogo} alt="GROHE" />
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Customer & Quotation Info */}
                      <table className={styles.infoTable}>
                        <tbody>
                          <tr>
                            <td className={styles.infoLeft}>
                              <strong>M/s :</strong>{" "}
                              {customer.name || "________________________"}
                              <br />
                              <strong>Address :</strong>{" "}
                              {customer.address || "________________________"}
                            </td>
                            <td className={styles.infoRight}>
                              <strong>Quotation No :</strong>{" "}
                              {siteMap.quotation_no || siteMap.id}
                              <br />
                              <strong>Date :</strong>{" "}
                              {moment(siteMap.createdAt).format("DD-MM-YYYY")}
                              <br />
                              <strong>Subject :</strong> Sanitary ware & CP
                              fittings – {bathroom.name}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <hr className={styles.divider} />

                      {/* Items Table */}
                      <table className={styles.itemsTable}>
                        <thead>
                          <tr>
                            <th className={styles.th} style={{ width: "5%" }}>
                              S.No
                            </th>
                            <th className={styles.th} style={{ width: "12%" }}>
                              Image
                            </th>
                            <th className={styles.th} style={{ width: "38%" }}>
                              Description of Goods
                            </th>
                            <th className={styles.th} style={{ width: "10%" }}>
                              HSN
                            </th>
                            <th className={styles.th} style={{ width: "10%" }}>
                              Qty
                            </th>
                            <th className={styles.th} style={{ width: "12%" }}>
                              Rate (₹)
                            </th>
                            <th className={styles.th} style={{ width: "13%" }}>
                              Amount (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {bathroom.items.map((item, i) => {
                            const qty = item.quantity || 1;
                            const rate = item.price || 0;
                            const amount = rate * qty;

                            return (
                              <tr key={i}>
                                <td className={styles.td}>{i + 1}</td>
                                <td className={styles.td}>
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className={styles.productImage}
                                    />
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className={`${styles.td} ${styles.tdLeft}`}>
                                  <strong>{item.name}</strong>
                                  {item.model && (
                                    <div style={{ fontSize: "9.5px" }}>
                                      Model: {item.model}
                                    </div>
                                  )}
                                </td>
                                <td className={styles.td}>{item.hsn || "—"}</td>
                                <td className={styles.td}>{qty}</td>
                                <td className={styles.tdRight}>
                                  {rate.toLocaleString("en-IN")}
                                </td>
                                <td className={styles.tdRight}>
                                  {amount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            );
                          })}

                          <tr className={styles.totalRow}>
                            <td
                              colSpan="6"
                              className={`${styles.td} ${styles.tdRight}`}
                            >
                              <strong>TOTAL ({bathroom.name})</strong>
                            </td>
                            <td className={`${styles.td} ${styles.tdRight}`}>
                              ₹ {bathroom.total.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className={styles.note}>
                        <strong>Note:</strong> Prices are inclusive of GST @ 18%
                        wherever applicable.
                      </div>
                    </div>
                  ))}

                  {/* Summary Page */}
                  <div
                    className={`${styles.quotationPage} quotation-page-print summary-page`}
                  >
                    <div className={styles.summaryHeader}>
                      <img src={logo} alt="Logo" />
                      <div className={styles.summaryTitle}>SUMMARY</div>
                    </div>

                    <table
                      className={styles.itemsTable}
                      style={{ marginTop: "20px" }}
                    >
                      <thead>
                        <tr>
                          <th className={styles.th} style={{ width: "70%" }}>
                            PARTICULARS
                          </th>
                          <th className={styles.th} style={{ width: "30%" }}>
                            AMOUNT (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bathrooms.map((b, i) => (
                          <tr key={i}>
                            <td className={`${styles.td} ${styles.tdLeft}`}>
                              {b.name}
                            </td>
                            <td className={styles.tdRight}>
                              {b.total.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                        <tr className={styles.grandTotalRow}>
                          <td className={`${styles.td} ${styles.tdLeft}`}>
                            GRAND TOTAL
                          </td>
                          <td className={styles.tdRight}>
                            ₹ {grandTotal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className={styles.amountInWords}>
                      <strong>Amount in Words:</strong>{" "}
                      {NumberToWords(grandTotal)} Rupees Only
                    </div>

                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>
                        TERMS & CONDITIONS
                      </h4>
                      <ol className={styles.termsList}>
                        <li>
                          Validity of quotation – 15 days from the date of
                          issue.
                        </li>
                        <li>Prices are inclusive of GST.</li>
                        <li>Delivery: Ex-godown / FOR site as agreed.</li>
                        <li>Payment: 100% advance along with confirmed PO.</li>
                        <li>Warranty as per manufacturer’s policy.</li>
                        <li>Subject to Mumbai Jurisdiction.</li>
                      </ol>
                    </div>

                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>BANK DETAILS</h4>
                      <div className={styles.bankDetails}>
                        <strong>Bank Name:</strong> IDFC FIRST BANK
                        <br />
                        <strong>A/c Name:</strong> Embark Enterprises
                        <br />
                        <strong>A/c No:</strong> 10179237657
                        <br />
                        <strong>IFSC Code:</strong> IDFB0020149
                        <br />
                        <strong>Branch:</strong> Andheri West, Mumbai
                      </div>
                    </div>

                    <div className={styles.signatureSection}>
                      <strong>For EMBARK ENTERPRISES</strong>
                      <br />
                      <br />
                      <br />
                      <div className={styles.signatureLine}>
                        Authorised Signatory
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

export default SiteMapDetails;
