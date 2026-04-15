// src/pages/quotations/NewQuotationsDetails.jsx

import React, { useRef, useState, useMemo, useCallback } from "react";
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
/** */
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
    unitPrice: true, // ← New Column
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
  const customerPhone = customer?.mobileNumber || customer?.phone || "";
  const customerAddress = address
    ? [address.street, address.city, address.state].filter(Boolean).join(", ") +
      (address.postalCode ? ` - ${address.postalCode}` : "")
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
      if (name.includes("colston")) brands.add("COLSTON");
    });
    return brands.size > 0
      ? [...brands].join(" / ")
      : "GROHE / AMERICAN STANDARD";
  }, [mainProducts]);

  // ── Calculations ────────────────────────────────────────────────────────
  const grossTotalBeforeDiscount = useMemo(() => {
    return mainProducts.reduce((sum, p) => {
      const mrp = Number(p.price ?? 0);
      const qty = Number(p.quantity ?? 1);
      return sum + mrp * qty;
    }, 0);
  }, [mainProducts]);

  const totalProductDiscount = useMemo(() => {
    return mainProducts.reduce((sum, p) => {
      const mrp = Number(p.price ?? 0);
      const qty = Number(p.quantity ?? 1);
      const grossLine = mrp * qty;
      const discountedLine = Number(p.total ?? 0);
      return sum + (grossLine - discountedLine);
    }, 0);
  }, [mainProducts]);

  const extraDiscount = Number(quotation?.extraDiscount ?? 0);
  const roundOff = Number(quotation?.roundOff ?? 0);
  const finalAmount = Number(quotation?.finalAmount ?? 0);
  const finalAmountInWords = amountInWords(Math.round(finalAmount));

  // ── Floor & Room Totals ─────────────────────────────────────────────────
  const floorTotals = useMemo(() => {
    const floorMap = new Map();
    mainProducts.forEach((p) => {
      const floor = (p.floorName || "Unspecified Floor").trim();
      const total = Number(p.total ?? 0);
      if (!floorMap.has(floor))
        floorMap.set(floor, { floorName: floor, total: 0 });
      floorMap.get(floor).total += total;
    });
    return Array.from(floorMap.values()).sort((a, b) =>
      a.floorName.localeCompare(b.floorName),
    );
  }, [mainProducts]);

  const roomTotals = useMemo(() => {
    const roomMap = new Map();
    mainProducts.forEach((p) => {
      const floor = (p.floorName || "Unspecified Floor").trim();
      const room = (p.roomName || "Unspecified Room").trim();
      const total = Number(p.total ?? 0);
      const key = `${floor}|||${room}`;
      if (!roomMap.has(key)) {
        roomMap.set(key, { floorName: floor, roomName: room, total: 0 });
      }
      roomMap.get(key).total += total;
    });

    return Array.from(roomMap.values())
      .sort((a, b) => {
        const floorCmp = a.floorName.localeCompare(b.floorName);
        return floorCmp !== 0 ? floorCmp : a.roomName.localeCompare(b.roomName);
      })
      .filter((r) => r.total > 0);
  }, [mainProducts]);

  const hasSiteLayout = useMemo(() => {
    const floors =
      activeVersionData.quotation?.floors || quotation?.floors || [];
    return Array.isArray(floors) && floors.length > 0;
  }, [activeVersionData.quotation, quotation]);

  // ── Enrich Products with Areas ──────────────────────────────────────────
  const enrichProductsWithAreas = useCallback((allProducts, floors) => {
    const areaMap = new Map();

    floors.forEach((floor) => {
      floor.rooms?.forEach((room) => {
        room.areas?.forEach((areaObj) => {
          const areaValue = areaObj.value || areaObj.name?.toLowerCase();
          if (areaValue) {
            const key = `${room.roomId}_${areaValue}`;
            areaMap.set(key, areaObj.name || areaObj.value || "Unassigned");
          }
        });
      });
    });

    return allProducts.map((p) => {
      let areaName = "Unassigned";
      if (p.areaValue || p.areaId) {
        const key = `${p.roomId}_${p.areaValue || p.areaId}`;
        if (areaMap.has(key)) areaName = areaMap.get(key);
      } else if (p.areaName && p.areaName !== "Unassigned") {
        areaName = p.areaName;
      } else {
        const productNameLower = (p.name || "").toLowerCase();
        if (
          productNameLower.includes("basin") ||
          productNameLower.includes("mixer")
        )
          areaName = "Basin Area";
        else if (
          productNameLower.includes("shower") ||
          productNameLower.includes("thermostatic") ||
          productNameLower.includes("diverter")
        )
          areaName = "Shower Area";
        else if (
          productNameLower.includes("wc") ||
          productNameLower.includes("toilet")
        )
          areaName = "WC Area";
        else if (
          productNameLower.includes("spout") ||
          productNameLower.includes("bath")
        )
          areaName = "Shower Area";
      }
      return { ...p, areaName };
    });
  }, []);

  const enrichedProducts = useMemo(() => {
    const floors =
      activeVersionData.quotation?.floors || quotation?.floors || [];
    return enrichProductsWithAreas(allProducts, floors);
  }, [
    allProducts,
    activeVersionData.quotation,
    quotation,
    enrichProductsWithAreas,
  ]);

  const hasProperAreaAssignment = useMemo(() => {
    return enrichedProducts.some((p) => {
      return (
        p.areaValue ||
        p.areaId ||
        (p.areaName &&
          p.areaName !== "Unassigned" &&
          p.areaName !== "Unassigned Area" &&
          !["Basin Area", "Shower Area", "WC Area", "Unassigned"].includes(
            p.areaName,
          ))
      );
    });
  }, [enrichedProducts]);

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
    const mainAreas = Object.entries(areaGroups).slice(0, 3);

    const ZONE_LAYOUT = [
      { top: "26%", left: "2%", width: "29%" },
      { top: "26%", right: "2%", width: "29%" },
      { top: "28%", left: "37%", width: "29%" },
    ];

    const pages = [];
    const maxChunks = Math.max(
      ...mainAreas.map(([_, items]) => Math.ceil(items.length / 8)),
      1,
    );

    for (let chunkIndex = 0; chunkIndex < maxChunks; chunkIndex++) {
      const isContinuation = chunkIndex > 0;
      pages.push(
        <div
          key={`room-area-page-${floorName}-${roomName}-${chunkIndex}`}
          className="page"
          style={{
            position: "relative",
            width: "210mm",
            height: "297mm",
            overflow: "hidden",
            pageBreakBefore: "always",
            pageBreakAfter: "always",
            background: "#fff",
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

          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "35px 30px",
              height: "100%",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 25 }}>
              <h2
                style={{
                  color: "#d32f2f",
                  fontSize: "2.5em",
                  margin: "0 0 8px 0",
                }}
              >
                {floorName.toUpperCase()}
              </h2>
              <h3
                style={{
                  fontSize: "1.95em",
                  color: "#222",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {roomName}
                {isContinuation && " (Continued)"}
              </h3>
            </div>

            <div style={{ position: "absolute", inset: 0 }}>
              {mainAreas.map(([areaName, allItems], areaIndex) => {
                const zone = ZONE_LAYOUT[areaIndex];
                if (!zone) return null;

                const start = chunkIndex * 8;
                const items = allItems.slice(start, start + 8);

                return (
                  <div
                    key={areaName}
                    style={{
                      position: "absolute",
                      ...zone,
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                      }}
                    >
                      {items.map((p, i) => (
                        <div
                          key={i}
                          style={{ padding: "10px 8px", textAlign: "center" }}
                        >
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              style={{
                                width: "68px",
                                height: "68px",
                                objectFit: "contain",
                                borderRadius: "6px",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "68px",
                                height: "68px",
                                background: "#f0f0f0",
                                borderRadius: "6px",
                              }}
                            />
                          )}
                          <div
                            style={{
                              fontSize: "0.77em",
                              lineHeight: 1.3,
                              marginTop: "6px",
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            {p.quantity > 1 && (
                              <div style={{ color: "#666" }}>
                                × {p.quantity}
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
        </div>,
      );
    }
    return pages;
  };

  // ── Render All Pages with Unit Price Column ─────────────────────────────
  const renderPages = (getShouldShowColumn) => {
    const shouldShowColumn = getShouldShowColumn || (() => true);
    const pages = [];

    const MAX_PRODUCTS_NORMAL = 10;

    const renderProductTable = (items, title, startSno = 0) => {
      let localSno = startSno;
      return (
        <>
          {title && (
            <h3 style={{ color: "#d32f2f", margin: "20px 0 10px" }}>{title}</h3>
          )}
          <table className={styles.productTable}>
            <colgroup>
              {shouldShowColumn("sno") && <col className={styles.sno} />}
              {shouldShowColumn("name") && <col className={styles.name} />}
              {shouldShowColumn("code") && <col className={styles.code} />}
              {shouldShowColumn("image") && <col className={styles.image} />}
              {shouldShowColumn("unit") && <col className={styles.unit} />}
              {shouldShowColumn("mrp") && <col className={styles.mrp} />}
              {shouldShowColumn("unitPrice") && (
                <col style={{ width: "95px" }} />
              )}
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
                {shouldShowColumn("unitPrice") && <th>Unit Price</th>}
                {shouldShowColumn("discount") && <th>Discount</th>}
                {shouldShowColumn("total") && <th>Total</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const code = p.companyCode || p.productCode || "—";
                const img = p.imageUrl || "";
                const mrp = Number(p.price ?? 0);
                const qty = Number(p.quantity ?? 1);
                const lineTotal = Number(p.total ?? 0);
                const discValue = Number(p.discount ?? 0);
                const discType = (p.discountType ?? "percent").toLowerCase();

                // Calculate Unit Price after discount
                let unitPrice = mrp;
                if (discValue > 0) {
                  if (discType === "percent") {
                    unitPrice = mrp * (1 - discValue / 100);
                  } else {
                    unitPrice = mrp - discValue;
                  }
                }
                unitPrice = Math.round(unitPrice * 100) / 100;

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
                      <td className={styles.prodNameCell}>{p.name}</td>
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
                    {shouldShowColumn("unitPrice") && (
                      <td style={{ fontWeight: 600, color: "#d32f2f" }}>
                        ₹{unitPrice.toLocaleString("en-IN")}
                      </td>
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

    // Cover & Letterhead Pages
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

    // Main Products
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
          {renderProductTable(itemsThisPage, "", globalSno)}
        </div>,
      );
      globalSno += itemsThisPage.length;
      remainingMain = remainingMain.slice(itemsThisPage.length);
    }

    // Optional Items
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
        </div>,
      );
    }

    // Site Layout Visual Pages
    if (hasProperAreaAssignment && hasSiteLayout) {
      const roomGroups = groupProductsByFloorAndRoom(enrichedProducts);
      roomGroups.forEach((roomGroup) => {
        if (roomGroup.products?.length > 0) {
          const areaPages = renderAreaWisePageForRoom(roomGroup);
          pages.push(...areaPages);
        }
      });
    }

    // Site Summary
    if (hasSiteLayout && (floorTotals.length > 0 || roomTotals.length > 0)) {
      pages.push(
        <div
          key="site-layout-summary"
          className={`${styles.productPage} page`}
          style={{ pageBreakBefore: "always" }}
        >
          {/* Your existing summary tables for Floor-wise, Room-wise, Area-wise */}
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
            SITE SUMMARY
          </h2>

          <div style={{ padding: "0 20px" }}>
            {/* 1. Floor-wise Totals - Table */}
            {floorTotals.length > 0 && (
              <>
                <h3
                  style={{
                    color: "#222",
                    borderBottom: "2px solid #d32f2f",
                    paddingBottom: "8px",
                    marginBottom: "18px",
                  }}
                >
                  Floor-wise Cost Breakdown
                </h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "45px",
                    fontSize: "0.95em",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "14px 16px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: 600,
                        }}
                      >
                        Floor
                      </th>
                      <th
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          border: "1px solid #ddd",
                          fontWeight: 600,
                        }}
                      >
                        Total Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {floorTotals.map((floor, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td
                          style={{
                            padding: "14px 16px",
                            border: "1px solid #ddd",
                            fontWeight:
                              floor.floorName !== "Unspecified Floor"
                                ? "600"
                                : "normal",
                          }}
                        >
                          {floor.floorName}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            textAlign: "right",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            color: "#d32f2f",
                          }}
                        >
                          ₹{floor.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* 2. Room-wise Totals - Table */}
            {roomTotals.length > 0 && (
              <>
                <h3
                  style={{
                    color: "#222",
                    borderBottom: "2px solid #d32f2f",
                    paddingBottom: "8px",
                    marginBottom: "18px",
                  }}
                >
                  Room-wise Cost Breakdown
                </h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "45px",
                    fontSize: "0.95em",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "14px 16px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: 600,
                        }}
                      >
                        Floor
                      </th>
                      <th
                        style={{
                          padding: "14px 16px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: 600,
                        }}
                      >
                        Room
                      </th>
                      <th
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          border: "1px solid #ddd",
                          fontWeight: 600,
                        }}
                      >
                        Total Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomTotals.map((room, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td
                          style={{
                            padding: "14px 16px",
                            border: "1px solid #ddd",
                          }}
                        >
                          {room.floorName}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            border: "1px solid #ddd",
                            fontWeight: "500",
                          }}
                        >
                          {room.roomName}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            textAlign: "right",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            color: "#d32f2f",
                          }}
                        >
                          ₹{room.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* 3. Area-wise Totals - Table */}
            {enrichedProducts.length > 0 && (
              <>
                <h3
                  style={{
                    color: "#222",
                    borderBottom: "2px solid #d32f2f",
                    paddingBottom: "8px",
                    marginBottom: "18px",
                  }}
                >
                  Area-wise Cost Breakdown
                </h3>

                {(() => {
                  const areaGroups = groupProductsByAreaName(enrichedProducts);
                  return (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "40px",
                        fontSize: "0.95em",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                          <th
                            style={{
                              padding: "14px 16px",
                              textAlign: "left",
                              border: "1px solid #ddd",
                              fontWeight: 600,
                            }}
                          >
                            Area
                          </th>
                          <th
                            style={{
                              padding: "14px 16px",
                              textAlign: "right",
                              border: "1px solid #ddd",
                              fontWeight: 600,
                            }}
                          >
                            Total Amount (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(areaGroups).map(([areaName, items]) => {
                          const areaTotal = items.reduce(
                            (sum, p) => sum + Number(p.total || 0),
                            0,
                          );

                          return (
                            <tr
                              key={areaName}
                              style={{ borderBottom: "1px solid #eee" }}
                            >
                              <td
                                style={{
                                  padding: "14px 16px",
                                  border: "1px solid #ddd",
                                  fontWeight: "500",
                                }}
                              >
                                {areaName}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  textAlign: "right",
                                  border: "1px solid #ddd",
                                  fontWeight: "600",
                                  color: "#d32f2f",
                                }}
                              >
                                ₹{areaTotal.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </>
            )}
          </div>
        </div>,
      );
    }

    // Financial Summary
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
          SUMMARY
        </h2>

        <div className={styles.finalSummaryWrapper}>
          <div className={styles.finalSummarySection}>
            <div className={styles.summaryLeft}>
              <div className={styles.summaryRow}>
                <span>
                  <strong>Total</strong>
                </span>
                <span>₹{grossTotalBeforeDiscount.toLocaleString("en-IN")}</span>
              </div>
              {totalProductDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span style={{ color: "#f5222d" }}>Discount</span>
                  <span style={{ color: "#f5222d" }}>
                    -₹{Math.round(totalProductDiscount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {extraDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span style={{ color: "#fa8c16" }}>Extra Discount</span>
                  <span style={{ color: "#fa8c16" }}>
                    -₹{Math.round(extraDiscount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.summaryRight}>
              <div className={styles.totalAmount}>
                <strong>GRAND TOTAL</strong>
              </div>
              <div style={{ fontSize: "2.35em", fontWeight: 700 }}>
                ₹{finalAmount.toLocaleString("en-IN")}
              </div>
              <div className={styles.amountInWords}>{finalAmountInWords}</div>
            </div>
          </div>
        </div>
      </div>,
    );

    return pages;
  };

  // Export Handler
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

      <div className="page-wrapper">
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
                        minWidth: 240,
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
                            unitPrice: checkedValues.includes("unitPrice"),
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
                          <Checkbox value="unit">Unit / Qty</Checkbox>
                          <Checkbox value="mrp">MRP</Checkbox>
                          <Checkbox value="unitPrice">
                            Unit Price (After Discount)
                          </Checkbox>
                          <Divider style={{ margin: "8px 0" }} />
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
                              unitPrice: true,
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
                    {Object.values(visibleColumns).filter(Boolean).length}/9
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

          {/* Hidden Export Container */}
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
