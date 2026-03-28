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
import styles from "../../components/Quotation/quotationnew.module.css";
import coverImage from "../../assets/img/quotation_first_page.jpeg";
import quotationBgImage from "../../assets/img/quotation_letterhead.jpeg";
import siteMapQuotation from "../../assets/img/quotation_sitemap.jpg";
import {
  useGetQuotationByIdQuery,
  useGetQuotationVersionsQuery,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import {
  exportToPDF,
  exportToExcel,
} from "../../components/Quotation/hooks/exportHelpers";
import { amountInWords } from "../../components/Quotation/hooks/calcHelpers";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const NewQuotationsDetails = () => {
  const { id } = useParams();
  const [activeVersion, setActiveVersion] = useState("current");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);

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
        quotationItems: safeParse(quotation.products || quotation.items),
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

  // ── Products ────────────────────────────────────────────────────────────
  const allProducts = useMemo(() => {
    const products = activeVersionData.products || [];
    return products.map((p) => ({
      ...p,
      floorName: p.floorName || "",
      roomName: p.roomName || "",
      areaName: p.areaName || "",
      imageUrl: p.imageUrl || "",
      companyCode: p.companyCode || p.productCode || "—",
    }));
  }, [activeVersionData.products]);

  const mainProducts = useMemo(
    () => allProducts.filter((p) => p.isOptionFor == null),
    [allProducts],
  );

  const optionalProducts = useMemo(
    () => allProducts.filter((p) => p.isOptionFor != null),
    [allProducts],
  );

  // ── Brand Names ─────────────────────────────────────────────────────────
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

  const displaySubtotal = useMemo(() => {
    return mainProducts.reduce((sum, p) => sum + Number(p.total ?? 0), 0);
  }, [mainProducts]);

  const displayProductDiscount = useMemo(() => {
    return mainProducts.reduce((sum, p) => {
      const orig = Number(p.price ?? 0) * Number(p.quantity ?? 1);
      const discounted = Number(p.total ?? 0);
      return sum + (orig - discounted);
    }, 0);
  }, [mainProducts]);

  const finalAmountInWords = amountInWords(Math.round(backendFinalAmount));

  // ── Floor-wise Totals ───────────────────────────────────────────────────
  const floorTotals = useMemo(() => {
    const floorMap = new Map();

    mainProducts.forEach((p) => {
      const floor = (p.floorName || "Unspecified Floor").trim();
      const total = Number(p.total ?? 0);

      if (!floorMap.has(floor)) {
        floorMap.set(floor, { floorName: floor, total: 0 });
      }
      floorMap.get(floor).total += total;
    });

    return Array.from(floorMap.values()).sort((a, b) =>
      a.floorName.localeCompare(b.floorName),
    );
  }, [mainProducts]);

  // Check if we have meaningful floor data (skip if only "Unspecified Floor")
  const hasFloorData = useMemo(() => {
    if (!floorTotals || floorTotals.length === 0) return false;
    return floorTotals.some(
      (floor) => floor.floorName !== "Unspecified Floor" && floor.total > 0,
    );
  }, [floorTotals]);

  // ── Site Layout Check ───────────────────────────────────────────────────
  const hasSiteLayout = useMemo(() => {
    const floors =
      activeVersionData.quotation?.floors || quotation?.floors || [];
    if (!Array.isArray(floors) || floors.length === 0) return false;

    return floors.some((floor) => {
      const hasRooms = floor.rooms && floor.rooms.length > 0;
      const hasAssignedProducts = allProducts.some(
        (p) => p.floorId === floor.floorId,
      );
      return hasRooms || hasAssignedProducts;
    });
  }, [activeVersionData.quotation, quotation, allProducts]);

  // ── Grouping Helpers ────────────────────────────────────────────────────
  const groupProductsByFloorAndRoom = (products = []) => {
    const map = new Map();
    products.forEach((p) => {
      if (!p.floorId) return;
      const locations =
        Array.isArray(p.locations) && p.locations.length > 0
          ? p.locations
          : [
              {
                floorName: p.floorName || "Unspecified Floor",
                roomName: p.roomName || "Unspecified Room",
              },
            ];

      locations.forEach((loc) => {
        const floor = (loc.floorName || "Unspecified Floor").trim();
        const room = (loc.roomName || "Unspecified Room").trim();
        const key = `${floor}|||${room}`;
        if (!map.has(key)) {
          map.set(key, { floorName: floor, roomName: room, products: [] });
        }
        map.get(key).products.push({ ...p, ...loc });
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      const floorCmp = a.floorName.localeCompare(b.floorName);
      return floorCmp !== 0 ? floorCmp : a.roomName.localeCompare(b.roomName);
    });
  };

  const groupProductsByAreaName = (products = []) => {
    const groups = {};
    products.forEach((p) => {
      const area = (p.areaName || "Unassigned").trim();
      if (!groups[area]) groups[area] = [];
      groups[area].push(p);
    });
    return groups;
  };

  // ── Render Area-wise Page ───────────────────────────────────────────────
  const renderAreaWisePageForRoom = (roomGroup) => {
    const { floorName, roomName, products } = roomGroup;
    const areaGroups = groupProductsByAreaName(products);
    const areaEntries = Object.entries(areaGroups).slice(0, 3);

    const ZONE_LAYOUT = [
      { top: "25%", left: "6%", width: "26%" },
      { top: "29%", left: "37%", width: "26%" },
      { top: "28%", right: "2%", width: "26%" },
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
        <img
          src={siteMapQuotation}
          alt="Site Map"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            zIndex: 0,
          }}
        />
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }} />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "40px 30px",
            height: "100%",
          }}
        >
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

          <div style={{ position: "absolute", inset: 0 }}>
            {areaEntries.map(([areaName, items], index) => {
              const zone = ZONE_LAYOUT[index];
              if (!zone) return null;
              return (
                <div key={areaName} style={{ position: "absolute", ...zone }}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {items.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                          background: "rgba(255,255,255,0.92)",
                          padding: 10,
                          borderRadius: 8,
                          width: 120,
                        }}
                      >
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 100,
                              height: 100,
                              background: "#ddd",
                              borderRadius: 6,
                            }}
                          />
                        )}
                        <div
                          style={{ fontSize: "0.75em", textAlign: "center" }}
                        >
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

  // ── Render Pages ────────────────────────────────────────────────────────
  const renderPages = (getShouldShowColumn) => {
    const shouldShowColumn = getShouldShowColumn || (() => true);
    const pages = [];

    const MAX_PRODUCTS_NORMAL = 10;

    // Reusable Product Table
    const renderProductTable = (items, title, startSno = 0) => {
      let localSno = startSno;
      return (
        <>
          <h3 style={{ color: "#d32f2f", margin: "20px 0 10px" }}>{title}</h3>
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
                  quotation?.products?.find(
                    (it) => it.productId === p.productId,
                  ) ||
                  quotation?.items?.find(
                    (it) => it.productId === p.productId,
                  ) ||
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
                      <td className={styles.snoCell}>{localSno}.</td>
                    )}
                    {shouldShowColumn("name") && (
                      <td className={styles.prodNameCell}>
                        {matchingItem?.name || p.name || "—"}
                      </td>
                    )}
                    {shouldShowColumn("code") && <td>{code}</td>}
                    {shouldShowColumn("image") && (
                      <td>
                        {img && (
                          <img
                            src={img}
                            alt={p.name}
                            className={styles.prodImg}
                          />
                        )}
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
        </>
      );
    };

    // ==================== COVER PAGE ====================
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

    // ==================== LETTERHEAD PAGE ====================
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

    // ==================== MAIN PRODUCTS PAGES ====================
    let remainingMain = [...mainProducts];
    let globalSno = 0;

    while (remainingMain.length > 0) {
      const itemsThisPage = remainingMain.slice(0, MAX_PRODUCTS_NORMAL);

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

          {renderProductTable(itemsThisPage, "Main Items", globalSno)}
        </div>,
      );

      globalSno += itemsThisPage.length;
      remainingMain = remainingMain.slice(itemsThisPage.length);
    }

    // ==================== OPTIONAL PRODUCTS PAGE ====================
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

          {renderProductTable(optionalProducts, "Optional Items / Add-ons")}

          <div
            style={{
              marginTop: 20,
              fontSize: "0.9em",
              color: "#666",
              textAlign: "center",
            }}
          >
            * These are optional items. Final selection will be confirmed at the
            time of order.
          </div>
        </div>,
      );
    }

    // ==================== SITE LAYOUT PAGES ====================
    if (hasSiteLayout) {
      const roomGroups = groupProductsByFloorAndRoom(allProducts);
      roomGroups.forEach((roomGroup) => {
        if (roomGroup.products?.length > 0) {
          pages.push(renderAreaWisePageForRoom(roomGroup));
        }
      });
    }

    // ==================== SUMMARY PAGE (Smart) ====================
    pages.push(
      <div key="summary-page" className={`${styles.productPage} page`}>
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

        <h2
          style={{
            color: "#d32f2f",
            textAlign: "center",
            margin: "40px 0 30px",
          }}
        >
          PROJECT SUMMARY
        </h2>

        {/* Floor-wise Totals - Only if meaningful floor data exists */}
        {hasFloorData && (
          <>
            <h3 style={{ color: "#d32f2f", margin: "25px 0 12px" }}>
              Floor-wise Totals
            </h3>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Floor</th>
                  <th style={{ textAlign: "right" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {floorTotals.map((floor, index) => (
                  <tr key={index}>
                    <td>{floor.floorName}</td>
                    <td style={{ textAlign: "right" }}>
                      ₹{floor.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Divider style={{ margin: "30px 0 25px" }} />
          </>
        )}

        {/* Final Financial Summary */}
        <div
          className={styles.finalSummaryWrapper}
          style={{ marginTop: hasFloorData ? 10 : 40 }}
        >
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
                    {Math.round(displayProductDiscount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {backendExtraDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Extra Discount</span>
                  <span>
                    -₹{Math.round(backendExtraDiscount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.summaryRight}>
              <div className={styles.totalAmount}>
                <strong>Total Amount:</strong> ₹
                {backendFinalAmount.toLocaleString("en-IN")}
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

        <div
          style={{
            marginTop: 40,
            textAlign: "center",
            fontSize: "0.9em",
            color: "#666",
          }}
        >
          Thank you for your business. This quotation is valid for 15 days.
        </div>
      </div>,
    );

    return pages;
  };

  // ── Export Handler ──────────────────────────────────────────
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

      if (exportFormat === "pdf") {
        await exportToPDF(
          quotationRef,
          id,
          activeVersion,
          activeVersionData.quotation,
          `${fileName}.pdf`,
          { visibleColumns },
        );
      } else {
        await exportToExcel(
          mainProducts,
          [],
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
          { visibleColumns },
        );
      }
      message.success(`${exportFormat.toUpperCase()} exported successfully!`);
    } catch (err) {
      message.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Loading & Error States
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

  return (
    <>
      <Helmet>
        <title>
          {quotation.document_title || "Quotation"} -{" "}
          {quotation.reference_number}
        </title>
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

          {/* Hidden export container */}
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
