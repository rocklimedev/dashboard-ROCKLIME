// src/pages/quotations/NewQuotationsDetails.jsx
import React, { useRef, useState, useMemo } from "react";
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
  Tag,
  Tooltip,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  FilePdfFilled,
  FileExcelFilled,
  HistoryOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Dropdown } from "antd";
import logo from "../../assets/img/logo-quotation.png";
import styles from "./quotationnew.module.css";
import coverImage from "../../assets/img/quotation_first_page.jpeg";
import quotationBgImage from "../../assets/img/quotation_letterhead.jpeg";
import siteMapQuotation from "../../assets/img/quotation_sitemap.jpg";
import {
  useGetQuotationByIdQuery,
  useGetQuotationVersionsQuery,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { exportToPDF, exportToExcel } from "./hooks/exportHelpers";
import { amountInWords } from "./hooks/calcHelpers";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const NewQuotationsDetails = () => {
  const { id } = useParams();
  const [activeVersion, setActiveVersion] = useState("current");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);

  // Column visibility — only affects export
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
        label: "Current Version (Latest)",
        shortLabel: "Latest",
        quotationData: quotation,
        quotationItems: safeParse(quotation.items || quotation.products),
        updatedAt: quotation.updatedAt || new Date().toISOString(),
        updatedBy: quotation.updatedBy || quotation.createdBy || "System",
        isCurrent: true,
      });
    }

    return list
      .map((v) => ({
        ...v,
        label:
          v.version === "current" ? "Current Version" : `Version ${v.version}`,
        shortLabel: v.version === "current" ? "Latest" : `V${v.version}`,
        timeAgo: v.updatedAt ? dayjs(v.updatedAt).fromNow() : "—",
      }))
      .sort((a, b) =>
        a.version === "current" ? -1 : (b.version || 0) - (a.version || 0),
      );
  }, [quotation, versionsData]);

  const activeVersionObj = useMemo(
    () =>
      versions.find((v) => v.version === activeVersion) || versions[0] || {},
    [activeVersion, versions],
  );

  const activeVersionData = useMemo(
    () => ({
      quotation: activeVersionObj.quotationData || quotation || {},
      products: activeVersionObj.quotationItems || [],
      updatedAt: activeVersionObj.updatedAt,
    }),
    [activeVersionObj, quotation],
  );

  const classificationSource = activeVersionData.products;

  const mainProducts = useMemo(
    () => classificationSource.filter((p) => p.isOptionFor == null),
    [classificationSource],
  );

  const optionalProducts = useMemo(
    () => classificationSource.filter((p) => p.isOptionFor != null),
    [classificationSource],
  );

  // ── Customer & Address ──────────────────────────────────────────────────
  const customerId =
    activeVersionData.quotation?.customerId || quotation?.customerId;
  const shipToId = activeVersionData.quotation?.shipTo || quotation?.shipTo;

  const { data: customerResponse, isFetching: custLoading } =
    useGetCustomerByIdQuery(customerId, { skip: !customerId });

  const { data: addressResponse, isFetching: addrLoading } =
    useGetAddressByIdQuery(shipToId, { skip: !shipToId });

  const customer = customerResponse?.data || {};
  const address = addressResponse || {};

  const customerName = customer?.name || "Dear Client";
  const customerPhone =
    customer?.mobileNumber || customer?.phone || "XXXXXXXXXX";
  const customerAddress = address
    ? `${address.street || ""}, ${address.city || ""}, ${address.state || ""} - ${address.postalCode || ""}`
        .replace(/^,\s*|,*\s*$/g, "")
        .trim()
    : "--";

  // ── Brand Names (no external product data) ──────────────────────────────
  const brandNames = useMemo(() => {
    const brands = new Set();

    mainProducts.forEach((p) => {
      const name = (p.name || "").toLowerCase();
      if (name.includes("grohe")) brands.add("GROHE");
      if (name.includes("american standard")) brands.add("AMERICAN STANDARD");
      if (name.includes("caesarstone")) brands.add("Caesarstone");
    });

    return brands.size > 0
      ? [...brands].join(" / ")
      : "GROHE / AMERICAN STANDARD";
  }, [mainProducts]);

  // ── Calculations ────────────────────────────────────────────────────────
  const backendFinalAmount = Number(quotation?.finalAmount ?? 0);
  const backendRoundOff = Number(quotation?.roundOff ?? 0);
  const backendExtraDiscount = Number(quotation?.extraDiscount ?? 0);

  const displaySubtotal = useMemo(
    () =>
      mainProducts.reduce((sum, p) => {
        const item =
          quotation?.items?.find((i) => i.productId === p.productId) ||
          quotation?.products?.find((i) => i.productId === p.productId) ||
          p;
        return sum + Number(item?.total ?? 0);
      }, 0),
    [mainProducts, quotation],
  );

  const displayProductDiscount = useMemo(
    () =>
      mainProducts.reduce((sum, p) => {
        const item =
          quotation?.items?.find((i) => i.productId === p.productId) ||
          quotation?.products?.find((i) => i.productId === p.productId) ||
          p;
        const orig = Number(item?.price ?? 0) * Number(item?.quantity ?? 1);
        const discounted = Number(item?.total ?? 0);
        return sum + (orig - discounted);
      }, 0),
    [mainProducts, quotation],
  );

  const finalAmountInWords = amountInWords(Math.round(backendFinalAmount));

  const pageTitle = useMemo(() => {
    if (!quotation) return "Loading Quotation...";
    const title =
      quotation.document_title || quotation.quotation_title || "Quotation";
    const ref = quotation.reference_number || id || "QID";
    return `${title.trim()} - ${ref}`;
  }, [quotation, id]);
  // ── Helper: Group products by floor → room → area category ──────────────────
  // Replace the hardcoded groupProductsByArea with this more dynamic version

  const groupProductsByAreaName = (products = []) => {
    const groups = {};

    products.forEach((p) => {
      const area = (p.areaName || "Unassigned").trim();
      if (!groups[area]) {
        groups[area] = [];
      }
      groups[area].push({
        ...p,
        locationLabel: [
          p.floorName ? `Floor: ${p.floorName}` : null,
          p.roomName ? `Room: ${p.roomName}` : null,
          p.areaName ? `Area: ${p.areaName}` : null,
        ]
          .filter(Boolean)
          .join(" → "),
      });
    });

    return groups;
  };

  // ── Helper: Group all products by floor + room combinations ─────────────────
  const groupProductsByFloorAndRoom = (products = []) => {
    const map = new Map();

    products.forEach((p) => {
      const floor = (p.floorName || "Unspecified Floor").trim();
      const room = (p.roomName || "Unspecified Room").trim();
      const key = `${floor}|||${room}`;

      if (!map.has(key)) {
        map.set(key, {
          floorName: floor,
          roomName: room,
          products: [],
        });
      }

      map.get(key).products.push(p);
    });

    // Return sorted array
    return Array.from(map.values()).sort((a, b) => {
      const floorCmp = a.floorName.localeCompare(b.floorName);
      return floorCmp !== 0 ? floorCmp : a.roomName.localeCompare(b.roomName);
    });
  };

  // ── Single room/area-wise page renderer ─────────────────────────────────────
  const renderAreaWisePageForRoom = (roomGroup, customerName, refNumber) => {
    const { floorName, roomName, products } = roomGroup;

    const areaGroups = groupProductsByAreaName(products);
    const areaEntries = Object.entries(areaGroups).slice(0, 3); // max 3 areas

    // Zones mapped by index (not by name)
    const ZONE_LAYOUT = [
      { top: "32%", left: "6%", width: "26%" }, // LEFT
      { top: "30%", left: "37%", width: "26%" }, // CENTER
      { top: "30%", right: "6%", width: "26%" }, // RIGHT
    ];

    return (
      <div
        key={`area-page-${floorName}-${roomName}`}
        className="page"
        style={{
          position: "relative",
          width: "210mm",
          height: "297mm",
          overflow: "hidden",
          pageBreakBefore: "always",
          pageBreakAfter: "always",
        }}
      >
        {/* FULL PAGE IMAGE */}
        <img
          src={siteMapQuotation}
          alt="Site Map"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill", // exact A4 fit
            zIndex: 0,
          }}
        />

        {/* LIGHT OVERLAY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
          }}
        />

        {/* CONTENT LAYER */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "40px 30px",
            height: "100%",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ color: "#d32f2f", fontSize: "2.4em", margin: 0 }}>
              {floorName.toUpperCase()}
            </h2>
            <h3
              style={{ fontSize: "1.9em", color: "#222", margin: "8px 0 4px" }}
            >
              {roomName}
            </h3>
          </div>

          {/* AREA ZONES */}
          <div style={{ position: "absolute", inset: 0 }}>
            {areaEntries.map(([areaName, items], index) => {
              const zone = ZONE_LAYOUT[index];
              if (!zone) return null;

              return (
                <div key={areaName} style={{ position: "absolute", ...zone }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {items.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 10,
                          background: "rgba(255,255,255,0.92)",
                          padding: 8,
                          borderRadius: 6,
                        }}
                      >
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              background: "#ddd",
                            }}
                          />
                        )}

                        <div style={{ fontSize: "0.85em" }}>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          {p.quantity > 1 && <div>× {p.quantity}</div>}
                          {p.price && (
                            <div>
                              ₹{Number(p.price).toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── In renderPages or wherever you build pages ────────────────────────────────
  const areaPages = [];

  const renderProductList = (items) => {
    if (items.length === 0) {
      return (
        <div style={{ color: "#777", fontSize: "0.95em", padding: "8px 0" }}>
          No products assigned
        </div>
      );
    }

    return (
      <ul
        style={{
          margin: 0,
          paddingLeft: "20px",
          fontSize: "0.94em",
          lineHeight: 1.45,
        }}
      >
        {items.slice(0, 10).map(
          (
            p,
            i, // reduced to 10 to avoid crowding
          ) => (
            <li
              key={i}
              style={{
                marginBottom: "8px",
                paddingBottom: "4px",
                borderBottom: "1px dashed #eee",
              }}
            >
              {/* Product name + qty */}
              <div style={{ fontWeight: 500 }}>
                {p.name}
                {p.quantity > 1 && (
                  <span style={{ color: "#777", fontSize: "0.92em" }}>
                    {" "}
                    × {p.quantity}
                  </span>
                )}
              </div>
            </li>
          ),
        )}

        {items.length > 10 && (
          <li
            style={{
              color: "#d32f2f",
              fontStyle: "italic",
              marginTop: "6px",
              fontSize: "0.92em",
            }}
          >
            + {items.length - 10} more items...
          </li>
        )}
      </ul>
    );
  };
  // ── Export Handler ──────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!quotationRef.current) return;
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 120));

    try {
      const safeTitle = (quotation?.document_title || "Quotation")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, "_")
        .substring(0, 50);

      const versionLabel = activeVersionObj.shortLabel || "Latest";
      const fileName = `${safeTitle}_${versionLabel}`;

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
          [], // no productsData
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
      message.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Loading / Error States ──────────────────────────────────────────────
  if (qLoading || vLoading || custLoading || addrLoading) {
    return (
      <Spin
        tip="Loading Quotation Details..."
        size="large"
        style={{ marginTop: 100, display: "block", textAlign: "center" }}
      />
    );
  }

  if (qError || !quotation) {
    return (
      <Alert
        message="Quotation not found"
        type="error"
        showIcon
        style={{ margin: "40px" }}
      />
    );
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
              const matchingItem =
                // Prefer products array first — it has more complete data
                quotation?.products?.find(
                  (it) => it.productId === p.productId,
                ) ||
                // fallback to items (which may be partial/minimal)
                quotation?.items?.find((it) => it.productId === p.productId) ||
                // last resort: use whatever came from classificationSource
                p;

              const code =
                matchingItem?.companyCode ||
                matchingItem?.productCode ||
                p.companyCode ||
                "—";

              const img = matchingItem?.imageUrl || p.imageUrl || "";

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
                      {matchingItem?.name || p.name || "—"}
                    </td>
                  )}
                  {shouldShowColumn("code") && <td>{code}</td>}
                  {shouldShowColumn("image") && (
                    <td>
                      {img ? (
                        <img
                          src={img}
                          alt={matchingItem?.name || p.name || "Product"}
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
    // ← Add here

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
    }
    // Area-wise pages — one per floor-room combination
    const roomGroups = groupProductsByFloorAndRoom(activeVersionData.products);

    roomGroups.forEach((roomGroup) => {
      // Only create page if this room actually has products
      if (roomGroup.products.length > 0) {
        pages.push(
          renderAreaWisePageForRoom(
            roomGroup,
            customerName,
            quotation.reference_number,
          ),
        );
      }
    });
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

  // ────────────────────────────────────────────────────────────────────────
  //   MAIN RETURN
  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <div
        className="page-wrapper"
        style={{ position: "relative", minHeight: "100vh" }}
      >
        <div className="content">
          {/* TOP BAR */}
          <div
            style={{
              padding: "16px 40px",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
                gap: 20,
              }}
            >
              <div>
                <Title level={3} style={{ margin: 0, color: "#E31E24" }}>
                  {quotation.document_title || "Quotation"}
                  {activeVersion !== "current" && (
                    <Tag color="blue" style={{ marginLeft: 12 }}>
                      Version {activeVersion}
                    </Tag>
                  )}
                </Title>
                <Text type="secondary">
                  {quotation.reference_number || "—"} • {customerName} •{" "}
                  {brandNames}
                </Text>
              </div>

              <Space size="middle" wrap>
                <Dropdown
                  placement="bottomRight"
                  trigger={["click"]}
                  dropdownRender={() => (
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#fff",
                        borderRadius: 8,
                        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                        minWidth: 220,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 12,
                          color: "#333",
                        }}
                      >
                        Columns to include in export
                      </div>

                      <Checkbox.Group
                        style={{ width: "100%" }}
                        value={Object.keys(visibleColumns).filter(
                          (k) => visibleColumns[k],
                        )}
                        onChange={(checkedValues) => {
                          setVisibleColumns({
                            sno: checkedValues.includes("sno"),
                            name: checkedValues.includes("name"),
                            code: checkedValues.includes("code"),
                            image: checkedValues.includes("image"),
                            unit: checkedValues.includes("unit"),
                            mrp: checkedValues.includes("mrp"),
                            discount: checkedValues.includes("discount"),
                            total: checkedValues.includes("total"),
                          });
                        }}
                      >
                        <Space
                          direction="vertical"
                          size={10}
                          style={{ width: "100%" }}
                        >
                          <Checkbox value="sno">S.No</Checkbox>
                          <Checkbox value="name">Product Name</Checkbox>
                          <Checkbox value="code">Code</Checkbox>
                          <Checkbox value="image">Image</Checkbox>
                          <Divider style={{ margin: "8px 0" }} />
                          <Checkbox value="unit">Unit / Qty</Checkbox>
                          <Checkbox value="mrp">MRP</Checkbox>
                          <Checkbox value="discount">Discount</Checkbox>
                          <Checkbox value="total">Total</Checkbox>
                        </Space>
                      </Checkbox.Group>

                      <Divider style={{ margin: "12px 0 8px" }} />

                      <div style={{ textAlign: "right" }}>
                        <Button
                          size="small"
                          type="link"
                          onClick={() =>
                            setVisibleColumns({
                              sno: true,
                              name: true,
                              code: true,
                              image: true,
                              unit: true,
                              mrp: true,
                              discount: true,
                              total: true,
                            })
                          }
                        >
                          Reset to default
                        </Button>
                      </div>
                    </div>
                  )}
                >
                  <Button icon={<SettingOutlined />}>
                    Export Columns{" "}
                    {Object.values(visibleColumns).filter(Boolean).length}/8
                  </Button>
                </Dropdown>

                <Divider type="vertical" style={{ height: 120 }} />

                <Space>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 6,
                      borderColor: "#d9d9d9",
                    }}
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
                    {isExporting ? "Exporting..." : "Export"}
                  </Button>
                </Space>

                <Button
                  icon={<ArrowLeftOutlined />}
                  size="large"
                  style={{
                    background: "#E31E24",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  <Link to="/quotations/list" style={{ color: "#fff" }}>
                    Back
                  </Link>
                </Button>
              </Space>
            </div>
          </div>

          {/* MAIN PREVIEW AREA */}
          <div
            style={{
              padding: "32px 40px",
              background: "#f9f9f9",
              minHeight: "calc(100vh - 220px)",
            }}
          >
            <div className={styles.printArea}>{renderPages(() => true)}</div>
          </div>

          {/* STICKY VERSION TABS */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#fff",
              borderTop: "1px solid #e8e8e8",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
              zIndex: 1000,
              padding: "12px 40px",
            }}
          >
            <div style={{ maxWidth: 1400, margin: "0 auto" }}>
              <Tabs
                activeKey={activeVersion}
                onChange={setActiveVersion}
                tabBarExtraContent={
                  <Tooltip title="Version history">
                    <Button type="text" icon={<HistoryOutlined />}>
                      History
                    </Button>
                  </Tooltip>
                }
                centered
                size="default"
              >
                {versions.map((ver) => (
                  <Tabs.TabPane
                    key={ver.version}
                    tab={
                      <Space size={8}>
                        <span>{ver.label}</span>
                        {ver.isCurrent && <Tag color="green">Latest</Tag>}
                        <Text type="secondary" style={{ fontSize: "0.85em" }}>
                          {ver.timeAgo}
                        </Text>
                      </Space>
                    }
                  />
                ))}
              </Tabs>
            </div>
          </div>

          {/* HIDDEN EXPORT CONTAINER */}
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
        </div>
      </div>
    </>
  );
};

export default NewQuotationsDetails;
