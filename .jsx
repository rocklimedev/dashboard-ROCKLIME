// src/pages/quotations/NewQuotationsDetails.jsx
import React, { useRef, useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  message,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Tabs,
  Checkbox,
} from "antd";
import {
  ArrowLeftOutlined,
  FilePdfFilled,
  FileExcelFilled,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";
import logo from "../../assets/img/logo-quotation.png";
import styles from "./quotationnew.module.css";
import coverImage from "../../assets/img/quotation_first_page.jpeg";
import quotationBgImage from "../../assets/img/quotation_letterhead.jpeg";
import {
  useGetQuotationByIdQuery,
  useGetQuotationVersionsQuery,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import useProductsData from "../../data/useProductdata";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { exportToPDF, exportToExcel } from "./hooks/exportHelpers";
import { amountInWords } from "./hooks/calcHelpers";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const NewQuotationsDetails = () => {
  const { id } = useParams();
  const [activeVersion, setActiveVersion] = useState("current");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);

  // Column visibility control — only affects export
  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    name: true,
    code: true,
    image: true,
    unit: true,
    mrp: true,
    discount: true,
    total: true,
  });

  const quotationRef = useRef(null);

  // ── Data Fetching ───────────────────────────────────────────────────────
  const {
    data: quotation,
    isLoading: qLoading,
    error: qError,
  } = useGetQuotationByIdQuery(id);

  const { data: versionsData, isLoading: vLoading } =
    useGetQuotationVersionsQuery(id);

  const { data: brandsData } = useGetAllBrandsQuery();

  const safeParse = (data) => {
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

  // ── Versions Logic ──────────────────────────────────────────────────────
  const versions = useMemo(() => {
    const list = Array.isArray(versionsData) ? [...versionsData] : [];
    if (quotation) {
      list.unshift({
        version: "current",
        quotationData: quotation,
        quotationItems: safeParse(quotation.items || quotation.products),
        updatedAt: quotation.updatedAt || new Date(),
        updatedBy: quotation.createdBy,
      });
    }
    return list.sort((a, b) =>
      a.version === "current" ? -1 : b.version - a.version,
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

  const classificationSource =
    quotation?.products || activeVersionData.products || [];

  const mainProducts = useMemo(
    () => classificationSource.filter((p) => p.isOptionFor == null),
    [classificationSource],
  );

  const optionalProducts = useMemo(
    () => classificationSource.filter((p) => p.isOptionFor != null),
    [classificationSource],
  );

  const { productsData, loading: prodLoading } =
    useProductsData(classificationSource);

  // ── Customer & Address ──────────────────────────────────────────────────
  const customerId =
    activeVersionData.quotation?.customerId || quotation?.customerId;
  const shipToId = activeVersionData.quotation?.shipTo || quotation?.shipTo;

  const { data: customerResponse, isFetching: custLoading } =
    useGetCustomerByIdQuery(customerId, {
      skip: !customerId,
    });

  const customer = customerResponse?.data || {};
  const { data: addressResponse, isFetching: addrLoading } =
    useGetAddressByIdQuery(shipToId, {
      skip: !shipToId,
    });

  const address = addressResponse || {};
  const customerName = customer?.name || "Dear Client";
  const customerPhone =
    customer?.mobileNumber || customer?.phone || "XXXXXXXXXX";
  const customerAddress = address
    ? `${address.street || ""}, ${address.city || ""}, ${address.state || ""} - ${address.postalCode || ""}`
        .replace(/^,\s*|,*\s*$/g, "")
        .trim()
    : "--";

  // ── Brand Names ─────────────────────────────────────────────────────────
  const brandNames = useMemo(() => {
    const set = new Set();
    mainProducts.forEach((p) => {
      const pd = productsData?.find((x) => x.productId === p.productId) || {};
      const brand =
        pd.brandName ||
        pd.metaDetails?.find((m) => m.title?.toLowerCase().includes("brand"))
          ?.value ||
        brandsData?.find((b) => b.id === pd.brandId)?.brandName ||
        "N/A";
      if (brand && brand !== "N/A") set.add(brand.trim());
    });
    return set.size ? [...set].join(" / ") : "GROHE / AMERICAN STANDARD";
  }, [mainProducts, productsData, brandsData]);

  // ── Calculations ────────────────────────────────────────────────────────
  const backendFinalAmount = Number(quotation?.finalAmount ?? 0);
  const backendRoundOff = Number(quotation?.roundOff ?? 0);
  const backendExtraDiscount = Number(quotation?.extraDiscount ?? 0);

  const displaySubtotal = useMemo(() => {
    return mainProducts.reduce((sum, p) => {
      const item =
        quotation?.items?.find((i) => i.productId === p.productId) ||
        quotation?.products?.find((i) => i.productId === p.productId) ||
        p;
      return sum + Number(item?.total ?? 0);
    }, 0);
  }, [mainProducts, quotation]);

  const displayProductDiscount = useMemo(() => {
    return mainProducts.reduce((sum, p) => {
      const item =
        quotation?.items?.find((i) => i.productId === p.productId) ||
        quotation?.products?.find((i) => i.productId === p.productId) ||
        p;
      const orig = Number(item?.price ?? 0) * Number(item?.quantity ?? 1);
      const discounted = Number(item?.total ?? 0);
      return sum + (orig - discounted);
    }, 0);
  }, [mainProducts, quotation]);

  const finalAmountInWords = amountInWords(Math.round(backendFinalAmount));

  const pageTitle = useMemo(() => {
    if (!quotation) return "Loading Quotation...";
    const title =
      quotation.document_title || quotation.quotation_title || "Quotation";
    const ref = quotation.reference_number || id || "QID";
    return `${title.trim()} - ${ref}`;
  }, [quotation, id]);

  // ── Export Handler ──────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!quotationRef.current) return;
    setIsExporting(true);

    // Give React a moment to render the export content
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const safeTitle = (quotation?.document_title || "Quotation")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, "_")
        .substring(0, 50);

      const versionLabel =
        activeVersion === "current" ? "Latest" : activeVersion;
      const fileName = `${safeTitle}_V${versionLabel}`;

      const exportOptions = { visibleColumns };

      if (exportFormat === "pdf") {
        await exportToPDF(
          quotationRef,
          id,
          activeVersion,
          activeVersionData.quotation,
          `${fileName}.pdf`,
          exportOptions,
        );
      } else {
        await exportToExcel(
          mainProducts,
          productsData,
          customerName,
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
          optionalProducts,
          `${fileName}.xlsx`,
          exportOptions,
        );
      }

      message.success(`${exportFormat.toUpperCase()} exported successfully!`);
    } catch (err) {
      console.error(err);
      message.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Loading / Error States ──────────────────────────────────────────────
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

  // ────────────────────────────────────────────────────────────────────────
  //   SHARED PAGE RENDERING LOGIC
  // ────────────────────────────────────────────────────────────────────────
  const renderPages = (getShouldShowColumn) => {
    const shouldShowColumn = getShouldShowColumn;

    const renderProductTable = (items, isOptional = false, startSno = 0) => {
      let localSno = startSno;

      return (
        <table className={styles.productTable}>
          <colgroup>
            {shouldShowColumn("sno") && <col className={styles.sno} />}
            {shouldShowColumn("name") && <col className={styles.name} />}
            {shouldShowColumn("code") && <col className={styles.code} />}
            {shouldShowColumn("image") && <col className={styles.image} />}
            {shouldShowColumn("unit") && <col className={styles.unit} />}
            {shouldShowColumn("mrp") && <col className={styles.mrp} />}
            {shouldShowColumn("discount") && (
              <col className={styles.discount} />
            )}
            {shouldShowColumn("total") && <col className={styles.total} />}
          </colgroup>

          <thead>
            <tr>
              {shouldShowColumn("sno") && <th>S.No</th>}
              {shouldShowColumn("name") && <th>Product Name</th>}
              {shouldShowColumn("code") && <th>Code</th>}
              {shouldShowColumn("image") && <th>Image</th>}
              {shouldShowColumn("unit") && <th>Unit</th>}
              {shouldShowColumn("mrp") && <th>MRP</th>}
              {shouldShowColumn("discount") && <th>Discount</th>}
              {shouldShowColumn("total") && <th>Total</th>}
            </tr>
          </thead>

          <tbody>
            {items.map((p) => {
              const pd =
                productsData?.find((x) => x.productId === p.productId) || {};
              const matchingItem =
                quotation?.items?.find((it) => it.productId === p.productId) ||
                quotation?.products?.find(
                  (it) => it.productId === p.productId,
                ) ||
                p;

              const code =
                matchingItem?.companyCode ||
                p.companyCode ||
                p.productCode ||
                matchingItem?.productCode ||
                pd.companyCode ||
                "—";

              const img =
                p.imageUrl ||
                matchingItem?.imageUrl ||
                pd.images?.[0] ||
                pd.imageUrl ||
                "";

              const mrp = Number(matchingItem?.price ?? p.price ?? 0);
              const qty = Number(matchingItem?.quantity ?? p.quantity ?? 1);
              const lineTotal = Number(matchingItem?.total ?? p.total ?? 0);
              const discValue = Number(matchingItem?.discount ?? 0);
              const discType = (
                matchingItem?.discountType ?? "percent"
              ).toLowerCase();

              let displayDiscount = "—";
              if (discValue > 0) {
                displayDiscount =
                  discType === "percent"
                    ? `${discValue}%`
                    : `₹${discValue.toFixed(0)}`;
              }

              localSno++;

              return (
                <tr key={p.productId || `item-${localSno}`}>
                  {shouldShowColumn("sno") && (
                    <td className={styles.snoCell}>
                      {isOptional ? localSno - startSno : localSno}.
                    </td>
                  )}
                  {shouldShowColumn("name") && (
                    <td className={styles.prodNameCell}>
                      {p.name || matchingItem?.name || pd.name || "—"}
                    </td>
                  )}
                  {shouldShowColumn("code") && <td>{code}</td>}
                  {shouldShowColumn("image") && (
                    <td>
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className={styles.prodImg}
                        />
                      ) : null}
                    </td>
                  )}
                  {shouldShowColumn("unit") && <td>{qty}</td>}
                  {shouldShowColumn("mrp") && (
                    <td>₹{mrp.toLocaleString("en-IN")}</td>
                  )}
                  {shouldShowColumn("discount") && (
                    <td className={styles.discountCell}>{displayDiscount}</td>
                  )}
                  {shouldShowColumn("total") && (
                    <td className={styles.totalCell}>
                      ₹{lineTotal.toLocaleString("en-IN")}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    };

    const pages = [];
    const MAX_PRODUCTS_NORMAL = 10;
    const MAX_PRODUCTS_WITH_SUMMARY = 8;

    // PAGE 1: COVER
    pages.push(
      <div key="cover" className={`${styles.coverPage} page`}>
        <img src={coverImage} alt="Cover" className={styles.coverBg} />
        <div className={styles.coverContent}>
          <div className={styles.dynamicCustomerName}>
            {customerName.toUpperCase()}
          </div>
        </div>
      </div>,
    );

    // PAGE 2: LETTERHEAD
    pages.push(
      <div key="letterhead" className={`${styles.letterheadPage} page`}>
        <img
          src={quotationBgImage}
          alt="Background"
          className={styles.letterheadBg}
        />
        <div className={styles.letterheadContent}>
          <div className={`${styles.clientField} ${styles.clientNameField}`}>
            {customerName}
          </div>
          <div className={`${styles.clientField} ${styles.contactField}`}>
            {customerPhone}
          </div>
          <div className={`${styles.clientField} ${styles.addressField}`}>
            {customerAddress}
          </div>
          <div className={`${styles.clientField} ${styles.quotationNoField}`}>
            {quotation.reference_number || "—"}
          </div>
        </div>
        <div className={styles.letterheadFooter}>
          <img src={logo} alt="Logo" />
          <div>
            487/65, National Market, Peera Garhi, Delhi, 110087
            <br />
            0991180605
            <br />
            www.cmtradingco.com
          </div>
        </div>
      </div>,
    );

    // MAIN PRODUCTS PAGES
    let remainingMain = [...mainProducts];
    let globalSno = 0;

    while (remainingMain.length > 0) {
      const isVeryLastChunk = remainingMain.length <= MAX_PRODUCTS_WITH_SUMMARY;
      const canFitSummaryHere =
        isVeryLastChunk && optionalProducts.length === 0;

      let itemsThisPage;
      let showSummaryThisPage = false;

      if (canFitSummaryHere) {
        itemsThisPage = remainingMain;
        showSummaryThisPage = true;
      } else {
        itemsThisPage = remainingMain.slice(0, MAX_PRODUCTS_NORMAL);
        showSummaryThisPage = false;
      }

      pages.push(
        <div
          key={`main-page-${globalSno}`}
          className={`${styles.productPage} page`}
        >
          <div className={styles.pageTopHeader}>
            <div>
              <div className={styles.clientName}>{customerName}</div>
              <div className={styles.clientAddress}>{customerAddress}</div>
            </div>
            <div className={styles.pageDate}>
              {new Date(
                quotation.quotation_date || Date.now(),
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          {renderProductTable(itemsThisPage, false, globalSno)}

          {showSummaryThisPage && (
            <div className={styles.finalSummaryWrapper}>
              <div className={styles.finalSummarySection}>
                <div className={styles.summaryLeft}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {displayProductDiscount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Total Discount</span>
                      <span>
                        -₹
                        {Math.round(displayProductDiscount).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                  )}
                  {backendExtraDiscount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Extra Discount</span>
                      <span>
                        -₹
                        {Math.round(backendExtraDiscount).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                  )}
                  <div className={styles.summaryRow}>
                    <span>Taxable Value</span>
                    <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className={styles.summaryRight}>
                  <div className={styles.totalAmount}>
                    <strong>Total Amount:</strong>
                    <strong>
                      {" "}
                      ₹{backendFinalAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className={styles.amountInWords}>
                    {finalAmountInWords}
                  </div>
                  {backendRoundOff !== 0 && (
                    <div className={styles.roundOffNote}>
                      (Round off: {backendRoundOff >= 0 ? "+" : "-"}₹
                      {Math.abs(backendRoundOff).toFixed(2)})
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>,
      );

      globalSno += itemsThisPage.length;
      remainingMain = remainingMain.slice(itemsThisPage.length);
    }

    // OPTIONAL ITEMS PAGE
    if (optionalProducts.length > 0) {
      pages.push(
        <div key="optional-page" className={`${styles.productPage} page`}>
          <div className={styles.pageTopHeader}>
            <div>
              <div className={styles.clientName}>{customerName}</div>
              <div className={styles.clientAddress}>{customerAddress}</div>
            </div>
            <div className={styles.pageDate}>
              {new Date(
                quotation.quotation_date || Date.now(),
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "26px",
              fontWeight: "bold",
              color: "#E31E24",
              margin: "40px 0 20px",
            }}
          >
            Optional / Suggested Accessories
          </div>

          <div
            style={{
              textAlign: "center",
              fontStyle: "italic",
              color: "#555",
              marginBottom: "32px",
              fontSize: "15px",
            }}
          >
            These items are <strong>not included</strong> in the quoted total.
            <br />
            They are recommended add-ons or compatible variants.
          </div>

          {renderProductTable(optionalProducts, true, globalSno)}

          <div
            style={{
              textAlign: "right",
              marginTop: "32px",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            Total Value of Optional Items:{" "}
            <span style={{ color: "#E31E24" }}>
              ₹
              {optionalProducts
                .reduce((sum, p) => sum + Number(p.total || 0), 0)
                .toLocaleString("en-IN")}
            </span>
          </div>
        </div>,
      );

      globalSno += optionalProducts.length;
    }

    // SUMMARY ONLY (when optional items exist)
    if (mainProducts.length > 0 && optionalProducts.length > 0) {
      pages.push(
        <div key="summary-only" className={`${styles.productPage} page`}>
          <div className={styles.pageTopHeader}>
            <div>
              <div className={styles.clientName}>{customerName}</div>
              <div className={styles.clientAddress}>{customerAddress}</div>
            </div>
            <div className={styles.pageDate}>
              {new Date(
                quotation.quotation_date || Date.now(),
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              margin: "40px 0 60px",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#E31E24",
            }}
          >
            Quotation Summary
          </div>

          <div className={styles.finalSummaryWrapper}>
            <div className={styles.finalSummarySection}>
              <div className={styles.summaryLeft}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
                </div>
                {displayProductDiscount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Total Discount</span>
                    <span>
                      -₹
                      {Math.round(displayProductDiscount).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                )}
                {backendExtraDiscount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Extra Discount</span>
                    <span>
                      -₹
                      {Math.round(backendExtraDiscount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Taxable Value</span>
                  <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className={styles.summaryRight}>
                <div className={styles.totalAmount}>
                  <strong>Total Amount:</strong>
                  <strong>
                    {" "}
                    ₹{backendFinalAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div className={styles.amountInWords}>{finalAmountInWords}</div>
                {backendRoundOff !== 0 && (
                  <div className={styles.roundOffNote}>
                    (Round off: {backendRoundOff >= 0 ? "+" : "-"}₹
                    {Math.abs(backendRoundOff).toFixed(2)})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
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
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <Title level={2} style={{ margin: 0, color: "#E31E24" }}>
                  {quotation.document_title || "Quotation"}
                </Title>
                <Text type="secondary">
                  {quotation.reference_number} • {customerName} • {brandNames}
                </Text>
              </div>

              <Space size="large" wrap>
                {/* Column selection */}
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    Export columns:
                  </div>
                  <Space direction="vertical" size={4}>
                    <Checkbox
                      checked={visibleColumns.sno}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          sno: e.target.checked,
                        }))
                      }
                    >
                      S.No
                    </Checkbox>
                    <Checkbox
                      checked={visibleColumns.name}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          name: e.target.checked,
                        }))
                      }
                    >
                      Product Name
                    </Checkbox>
                    <Checkbox
                      checked={visibleColumns.code}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          code: e.target.checked,
                        }))
                      }
                    >
                      Code
                    </Checkbox>
                    <Checkbox
                      checked={visibleColumns.image}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          image: e.target.checked,
                        }))
                      }
                    >
                      Image
                    </Checkbox>
                    <Checkbox
                      checked={visibleColumns.unit}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          unit: e.target.checked,
                        }))
                      }
                    >
                      Unit
                    </Checkbox>
                    <Checkbox
                      checked={visibleColumns.mrp}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          mrp: e.target.checked,
                        }))
                      }
                    >
                      MRP
                    </Checkbox>
                    <Checkbox
                      checked={visibleColumns.discount}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          discount: e.target.checked,
                        }))
                      }
                    >
                      Discount
                    </Checkbox>
                    <Checkbox
                      checked={visibleColumns.total}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          total: e.target.checked,
                        }))
                      }
                    >
                      Total
                    </Checkbox>
                  </Space>
                </div>

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
                    style={{ background: "#E31E24", border: "none" }}
                  >
                    {isExporting ? "Exporting..." : "Export Quotation"}
                  </Button>
                </Space>

                <Button
                  icon={<ArrowLeftOutlined />}
                  size="large"
                  style={{ background: "#E31E24", color: "#fff" }}
                >
                  <Link to="/quotations/list">Back</Link>
                </Button>
              </Space>
            </div>
          </div>

          {/* HIDDEN EXPORT-ONLY AREA */}
          <div
            ref={quotationRef}
            style={{ position: "absolute", left: "-9999px", top: 0 }}
          >
            {isExporting && (
              <div className={styles.printArea}>
                {renderPages((col) => visibleColumns[col] ?? true)}
              </div>
            )}
          </div>

          {/* ON-SCREEN PREVIEW – always full columns */}
          <div
            style={{
              padding: "40px 20px",
              background: "#f5f5f5",
              minHeight: "100vh",
            }}
          >
            <div className={styles.printArea}>{renderPages(() => true)}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewQuotationsDetails;
