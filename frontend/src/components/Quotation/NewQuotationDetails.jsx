// src/pages/quotations/NewQuotationsDetails.jsx
import React, { useRef, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { message, Button, Space, Typography, Spin, Alert, Tabs } from "antd";
import {
  ArrowLeftOutlined,
  FilePdfFilled,
  FileExcelFilled,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";

import logo from "../../assets/img/logo-quotation.png";
import styles from "./quotationnew.module.css";
import americanStandard from "../../assets/img/american-standard-logo-2.png";
import groheLogo from "../../assets/img/Grohe-Logo.png";
import coverImage from "../../assets/img/quotation_first_page.png";

import {
  useGetQuotationByIdQuery,
  useGetQuotationVersionsQuery,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import useProductsData from "../../data/useProductdata";
import { useGetAllBrandsQuery } from "../../api/brandsApi";

import { exportToPDF, exportToExcel } from "./hooks/exportHelpers";
import { calcTotals, amountInWords } from "./hooks/calcHelpers";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const NewQuotationsDetails = () => {
  const { id } = useParams();
  const [activeVersion, setActiveVersion] = useState("current");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const quotationRef = useRef(null);

  // FETCH QUOTATION & VERSIONS
  const {
    data: quotation,
    isLoading: qLoading,
    error: qError,
  } = useGetQuotationByIdQuery(id);

  const { data: versionsData, isLoading: vLoading } =
    useGetQuotationVersionsQuery(id);
  const { data: brandsData } = useGetAllBrandsQuery();

  // SAFE PARSE PRODUCTS (handles string/array)
  const safeParseProducts = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
    return [];
  };

  // VERSIONS LOGIC
  const versions = useMemo(() => {
    const list = Array.isArray(versionsData) ? [...versionsData] : [];
    if (quotation) {
      list.unshift({
        version: "current",
        quotationData: quotation,
        quotationItems: safeParseProducts(
          quotation.products || quotation.items
        ),
        updatedAt: quotation.updatedAt || new Date(),
        updatedBy: quotation.createdBy,
      });
    }
    return list.sort((a, b) =>
      a.version === "current" ? -1 : b.version - a.version
    );
  }, [quotation, versionsData]);

  const activeVersionData = useMemo(() => {
    const v =
      versions.find((x) => x.version === activeVersion) || versions[0] || {};
    return {
      quotation: v.quotationData || quotation || {},
      products: v.quotationItems || [],
      updatedAt: v.updatedAt,
    };
  }, [activeVersion, versions, quotation]);

  const activeProducts = activeVersionData.products || [];

  // THIS LINE WAS MISSING — ADD IT BACK!
  const { productsData, loading: prodLoading } =
    useProductsData(activeProducts);

  // Prioritize version-specific customer & address if available
  const versionQuotation = activeVersionData.quotation;
  let customerId = versionQuotation?.customerId;
  let shipToId = versionQuotation?.shipTo;

  // Fallback: Try to get from the version's quotationData (for historical versions)
  if (!customerId && versionQuotation?.quotationData?.customerId) {
    customerId = versionQuotation.quotationData.customerId;
  }
  if (!shipToId && versionQuotation?.quotationData?.shipTo) {
    shipToId = versionQuotation.quotationData.shipTo;
  }

  // Optional: Even fallback to main quotation if still missing
  if (!customerId && quotation?.customerId) customerId = quotation.customerId;
  if (!shipToId && quotation?.shipTo) shipToId = quotation.shipTo;

  const {
    data: customerResponse,
    isFetching: custLoading,
    error: custError,
  } = useGetCustomerByIdQuery(customerId, {
    skip: !customerId,
  });

  const customer = customerResponse?.data || {};

  // Now fetch address
  const { data: addressResponse, isFetching: addrLoading } =
    useGetAddressByIdQuery(shipToId, { skip: !shipToId });

  const address = addressResponse?.data;
  // CUSTOMER DISPLAY VALUES
  const customerName = customer?.name || "Dear Client";
  const customerPhone =
    customer?.mobileNumber || customer?.phone || "XXXXXXXXXX";

  const customerAddress = address
    ? `${address.street || ""}, ${address.city || ""}, ${
        address.state || ""
      } - ${address.pincode || address.zip || ""}`
        .replace(/^,\s*|,*\s*$/g, "")
        .trim()
    : "487/65, National Market, Peera Garhi, Delhi, 110087";

  // BRAND NAMES
  const brandNames = useMemo(() => {
    const set = new Set();
    activeProducts.forEach((p) => {
      const pd = productsData?.find((x) => x.productId === p.productId) || {};
      let brand =
        pd.brandName ||
        pd.metaDetails?.find((m) => m.title?.toLowerCase().includes("brand"))
          ?.value ||
        brandsData?.find((b) => b.id === pd.brandId)?.brandName;

      if (brand && brand !== "N/A") set.add(brand.trim());
    });
    return set.size ? [...set].join(" / ") : "GROHE / AMERICAN STANDARD";
  }, [activeProducts, productsData, brandsData]);

  // CALCULATIONS
  const gstRate = Number(activeVersionData.quotation?.gst || 18);
  const includeGst = activeVersionData.quotation?.include_gst !== false;

  const priceMap = activeProducts.reduce((map, p) => {
    if (p.productId) {
      map[p.productId] = {
        sellingPrice: Number(p.price || p.sellingPrice || 0),
        name: p.name,
      };
    }
    return map;
  }, {});

  const {
    subtotal,
    extraDiscountAmt,
    gst: gstAmount,
    total: finalTotal,
  } = calcTotals(
    activeProducts,
    gstRate,
    includeGst,
    priceMap,
    activeVersionData.quotation?.extraDiscount || 0,
    activeVersionData.quotation?.extraDiscountType || "amount",
    activeVersionData.quotation?.roundOff || 0
  );

  const finalAmountInWords = amountInWords(Math.round(finalTotal));
  // Add this with your other useMemo/useState
  const pageTitle = useMemo(() => {
    if (!quotation) return "Loading Quotation...";

    const title =
      quotation.document_title || quotation.quotation_title || "Quotation";
    const ref = quotation.reference_number || id || "QID";

    return `${title.trim()} - ${ref}`;
  }, [quotation, id]);
  // EXPORT HANDLER
  const handleExport = async () => {
    if (!quotationRef.current) return;
    setIsExporting(true);
    try {
      const safeTitle = (quotation?.document_title || "Quotation")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, "_")
        .substring(0, 50);

      const versionLabel =
        activeVersion === "current" ? "Latest" : activeVersion;
      const fileName = `${safeTitle}_V${versionLabel}`;

      if (exportFormat === "pdf") {
        await exportToPDF(
          quotationRef,
          id,
          activeVersion,
          activeVersionData.quotation,
          `${fileName}.pdf`
        );
      } else {
        await exportToExcel(
          activeProducts,
          productsData,
          brandNames,
          activeVersionData.quotation,
          customerAddress,
          logo,
          {
            bankName: "IDFC FIRST BANK",
            accountNumber: "10179373657",
            ifscCode: "IDFB0020149",
            branch: "BHERA ENCLAVE PASCHIM VIHAR",
          },
          id,
          activeVersion,
          [],
          `${fileName}.xlsx`
        );
      }
      message.success(`${exportFormat.toUpperCase()} exported successfully!`);
    } catch (err) {
      message.error("Export failed");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // LOADING STATES
  if (qLoading || vLoading || prodLoading || custLoading || addrLoading) {
    return (
      <Spin
        tip="Loading Quotation Details..."
        size="large"
        style={{ marginTop: 100 }}
      />
    );
  }

  if (qError || !quotation) {
    return <Alert message="Quotation not found" type="error" showIcon />;
  }

  const renderPages = () => {
    const pages = [];
    const itemsPerPage = 10;

    // PAGE 1: COVER
    pages.push(
      <div key="cover" className={`${styles.coverPage} page`}>
        <img src={coverImage} alt="Cover" className={styles.coverBg} />
        <div className={styles.coverContent}>
          <div className={styles.dynamicCustomerName}>
            {customerName.toUpperCase()}
          </div>
        </div>
      </div>
    );

    // PAGE 2: LETTERHEAD
    pages.push(
      <div key="letterhead" className={`${styles.letterheadPage} page`}>
        <div className={styles.letterheadTop}>
          <img
            src={americanStandard}
            alt="American Standard"
            className={styles.brandLogoLeft}
          />
          <img src={groheLogo} alt="GROHE" className={styles.brandLogoRight} />
        </div>

        <h1 className={styles.companyTitle}>CHHABRA MARBLE PVT.LTD</h1>
        <h2 className={styles.subtitle}>Quotation Letter</h2>

        <div className={styles.clientInfoGrid}>
          <div className={styles.label}>Client Name</div>
          <div className={styles.value}>{customerName}</div>
          <div className={styles.label}>Contact Number</div>
          <div className={styles.value}>{customerPhone}</div>
          <div className={styles.label}>Address</div>
          <div className={styles.value}>{customerAddress}</div>
          <div className={styles.label}>ID</div>
          <div className={styles.value}>
            {quotation.reference_number || "—"}
          </div>
        </div>

        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Particulars</th>
              <th>MRP</th>
              <th>Discounted Price</th>
            </tr>
          </thead>
          <tbody>
            {Array(2)
              .fill()
              .map((_, i) => (
                <tr key={i}>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className={styles.letterheadFooter}>
          <img src={logo} alt="Logo" style={{ height: 80 }} />
          <div style={{ textAlign: "center", fontSize: 16 }}>
            <strong>CHHABRA MARBLE PVT. LTD.</strong>
            <br />
            487/65, National Market, Peera Garhi, Delhi, 110087
            <br />
            Phone: 099110 80605 • Web: www.cmtradingco.com
          </div>
        </div>
      </div>
    );

    // PAGE 3+: PRODUCT PAGES
    for (let i = 0; i < activeProducts.length; i += itemsPerPage) {
      const items = activeProducts.slice(i, i + itemsPerPage);
      const isLastPage = i + itemsPerPage >= activeProducts.length;

      pages.push(
        <div key={`product-${i}`} className={`${styles.productPage} page`}>
          <div className={styles.pageTopHeader}>
            <div>
              <div className={styles.clientName}>Mr {customerName}</div>
              <div className={styles.clientAddress}>{customerAddress}</div>
            </div>
            <div className={styles.pageDate}>
              {new Date(
                quotation.quotation_date || Date.now()
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          <table className={styles.productTable}>
            <colgroup>
              <col className={styles.sno} />
              <col className={styles.name} />
              <col className={styles.code} />
              <col className={styles.image} />
              <col className={styles.unit} />
              <col className={styles.mrp} />
              <col className={styles.discount} />
              <col className={styles.total} />
            </colgroup>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product Name</th>
                <th>Code</th>
                <th>Product Image</th>
                <th>Unit</th>
                <th>MRP</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, idx) => {
                const pd =
                  productsData?.find((x) => x.productId === p.productId) || {};
                const img = p.imageUrl || pd.images?.[0] || "";
                const code =
                  pd.metaDetails?.find((m) => m.slug === "companyCode")
                    ?.value || "—";
                const mrp = Number(p.price || p.sellingPrice || 0);
                const qty = Number(p.quantity || 1);
                const discount = Number(p.discount || 0);
                const total = Math.round(mrp * qty * (1 - discount / 100));

                return (
                  <tr key={p.productId}>
                    <td className={styles.snoCell}>{i + idx + 1}.</td>
                    <td className={styles.prodNameCell}>{p.name}</td>
                    <td>{code}</td>
                    <td>
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className={styles.prodImg}
                        />
                      ) : null}
                    </td>
                    <td>{qty}</td>
                    <td>₹{mrp.toLocaleString("en-IN")}</td>
                    <td className={styles.discountCell}>{discount}%</td>
                    <td className={styles.totalCell}>
                      ₹{total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* FINAL SUMMARY – ONLY ON LAST PAGE */}
          {isLastPage && (
            <div className={styles.finalSummaryWrapper}>
              <div className={styles.finalSummarySection}>
                <div className={styles.summaryLeft}>
                  <div className={styles.summaryRow}>
                    <span>Taxable Value</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {gstAmount > 0 ? (
                    <>
                      <div className={styles.summaryRow}>
                        <span>CGST @{(gstRate / 2).toFixed(1)}%</span>
                        <span>₹{(gstAmount / 2).toLocaleString("en-IN")}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>SGST @{(gstRate / 2).toFixed(1)}%</span>
                        <span>₹{(gstAmount / 2).toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.summaryRow}>
                        <span>CGST @0.0%</span>
                        <span>₹0</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>SGST @0.0%</span>
                        <span>₹0</span>
                      </div>
                    </>
                  )}
                  <div className={styles.summaryRow}>
                    <span>Round off</span>

                    <span>
                      ₹
                      {Number(
                        activeVersionData.quotation?.roundOff || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span style={{ fontSize: "26px" }}>Total Amount</span>
                    <span style={{ fontSize: "26px" }}>
                      ₹{Math.round(finalTotal).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return pages;
  };
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className="page-wrapper">
        <div className="content">
          {/* TOP BAR */}
          <div
            style={{
              padding: "24px 40px",
              background: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                maxWidth: 1400,
                margin: "0 auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Title level={2} style={{ margin: 0, color: "#aa0f1f" }}>
                  {quotation.document_title || "Quotation"}
                </Title>
                <Text type="secondary">
                  {quotation.reference_number} • {customerName} • {brandNames}
                </Text>
              </div>

              <Space size="large">
                <Tabs
                  activeKey={activeVersion}
                  onChange={setActiveVersion}
                  type="card"
                >
                  {versions.map((v) => (
                    <TabPane
                      tab={
                        v.version === "current"
                          ? "Current Version"
                          : `Version ${v.version}`
                      }
                      key={v.version}
                    />
                  ))}
                </Tabs>

                <Space>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    style={{ padding: "8px 16px", borderRadius: 6 }}
                    disabled={isExporting}
                  >
                    <option value="pdf">Export as PDF</option>
                    <option value="excel">Export as Excel</option>
                  </select>
                  <Button
                    type="primary"
                    size="large"
                    loading={isExporting}
                    onClick={handleExport}
                    icon={
                      exportFormat === "pdf" ? (
                        <FilePdfFilled />
                      ) : (
                        <FileExcelFilled />
                      )
                    }
                    style={{ background: "#aa0f1f", border: "none" }}
                  >
                    {isExporting ? "Exporting..." : "Export Quotation"}
                  </Button>
                </Space>

                <Button icon={<ArrowLeftOutlined />} size="large">
                  <Link to="/quotations/list">Back</Link>
                </Button>
              </Space>
            </div>
          </div>

          {/* HIDDEN FOR PRINT */}
          <div
            ref={quotationRef}
            style={{ position: "absolute", left: "-9999px", top: 0 }}
          >
            <div className={styles.printArea}>{renderPages()}</div>
          </div>

          {/* ON-SCREEN PREVIEW */}
          <div
            style={{
              padding: "40px 20px",
              background: "#f5f5f5",
              minHeight: "100vh",
            }}
          >
            <div className={styles.printArea}>{renderPages()}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewQuotationsDetails;
