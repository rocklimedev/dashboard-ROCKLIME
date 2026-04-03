// src/pages/quotations/NewQuotationsDetails.jsx

import React, { useRef, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useCallback } from "react";
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

  // ── Floor-wise & Room-wise Totals ───────────────────────────────────────
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

  const hasFloorData = useMemo(() => {
    return floorTotals.some(
      (floor) => floor.floorName !== "Unspecified Floor" && floor.total > 0,
    );
  }, [floorTotals]);

  const hasRoomData = useMemo(() => {
    return roomTotals.some(
      (room) =>
        room.roomName !== "Unspecified Room" &&
        room.floorName !== "Unspecified Floor",
    );
  }, [roomTotals]);

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
  // Helper to enrich products with correct area info from floors structure
  // ── Enriched Products for Area Layout ─────────────────────────────────────

  // Make enrichProductsWithAreas stable (optional but recommended)
  const enrichProductsWithAreas = useCallback((allProducts, floors) => {
    const areaMap = new Map(); // roomId -> areaValue -> areaName

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
      // Strategy 1: Use areaValue/areaId if available (future-proof)
      if (p.areaValue) {
        const key = `${p.roomId}_${p.areaValue}`;
        if (areaMap.has(key)) {
          return { ...p, areaName: areaMap.get(key) };
        }
      }

      // Strategy 2: Fallback - try to guess area from product name (common for Grohe)
      // This is very useful when areaValue is not stored yet
      let inferredArea = "Unassigned";

      const productNameLower = (p.name || "").toLowerCase();

      if (
        productNameLower.includes("basin") ||
        (productNameLower.includes("mixer") &&
          (productNameLower.includes("basin") ||
            productNameLower.includes("pop-up")))
      ) {
        inferredArea = "Basin Area";
      } else if (
        productNameLower.includes("shower") ||
        productNameLower.includes("headshower") ||
        productNameLower.includes("thermostatic") ||
        productNameLower.includes("diverter")
      ) {
        inferredArea = "Shower Area";
      } else if (
        productNameLower.includes("wc") ||
        productNameLower.includes("toilet") ||
        productNameLower.includes("brush")
      ) {
        inferredArea = "WC Area";
      } else if (
        productNameLower.includes("spout") ||
        productNameLower.includes("bath") ||
        productNameLower.includes("cascade")
      ) {
        inferredArea = "Shower Area"; // or create "Bath Area" if needed
      } else if (
        productNameLower.includes("mirror") ||
        productNameLower.includes("towel") ||
        productNameLower.includes("holder") ||
        productNameLower.includes("dispenser")
      ) {
        inferredArea = "Basin Area"; // most accessories go here
      }

      return {
        ...p,
        areaName: inferredArea,
      };
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

  // ── Grouping Helpers (unchanged) ────────────────────────────────────────
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

  // ── Render Area-wise Page (All 3 Areas on ONE page | Max 8 products per area) ──
  const renderAreaWisePageForRoom = (roomGroup) => {
    const { floorName, roomName, products } = roomGroup;
    const areaGroups = groupProductsByAreaName(products);

    const allAreaEntries = Object.entries(areaGroups);
    const mainAreas = allAreaEntries.slice(0, 3); // Basin, Shower, WC

    const ZONE_LAYOUT = [
      { top: "26%", left: "2%", width: "29%" }, // SHOWER AREA
      { top: "26%", right: "2%", width: "29%" }, // WC AREA
      { top: "28%", left: "37%", width: "29%" }, // BASIN AREA
    ];

    const pages = [];

    // Calculate max chunks needed across all areas
    const maxChunks = Math.max(
      ...mainAreas.map(([_, items]) => Math.ceil(items.length / 8)),
      1,
    );

    // Create one page per chunk (so all 3 areas stay together)
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
              position: "absolute",
              inset: 0,

              zIndex: 1,
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
            {/* Header */}
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

            {/* Three Areas Layout */}
            <div style={{ position: "absolute", inset: 0 }}>
              {mainAreas.map(([areaName, allItems], areaIndex) => {
                const zone = ZONE_LAYOUT[areaIndex];
                if (!zone) return null;

                // Get only 8 products for current chunk
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
                    {/* Products Grid - 2 products per row */}
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
                          style={{
                            padding: "10px 8px",

                            textAlign: "center",

                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                          }}
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

                          <div style={{ fontSize: "0.77em", lineHeight: 1.3 }}>
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

                    {/* Remaining count indicator */}
                    {chunkIndex === 0 && allItems.length > 8 && (
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "0.82em",
                          color: "#d32f2f",
                          marginTop: "6px",
                        }}
                      >
                        + {allItems.length - 8} more on next page
                      </div>
                    )}
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
  // ── Render Pages ────────────────────────────────────────────────────────
  const renderPages = (getShouldShowColumn) => {
    const shouldShowColumn = getShouldShowColumn || (() => true);
    const pages = [];

    const MAX_PRODUCTS_NORMAL = 10;

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

    // Main Products Pages
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

    // Optional Products
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

    // Site Layout Pages
    // Site Layout Pages
    // Site Layout Pages
    if (hasSiteLayout) {
      const roomGroups = groupProductsByFloorAndRoom(enrichedProducts);

      roomGroups.forEach((roomGroup) => {
        if (roomGroup.products?.length > 0) {
          const areaPages = renderAreaWisePageForRoom(roomGroup);
          pages.push(...areaPages); // This is correct
        }
      });
    }
    // ==================== SUMMARY PAGE (UPDATED WITH ROOM TOTALS) ====================
    {
      /* ==================== SUMMARY PAGE (WITH FLOOR & ROOM DISCOUNTS) ==================== */
    }
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

        {/* Floor-wise Totals + Discounts */}
        {hasFloorData && (
          <>
            <h3 style={{ color: "#d32f2f", margin: "25px 0 12px" }}>
              Floor-wise Totals
            </h3>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Floor</th>
                  <th style={{ textAlign: "right" }}>Subtotal (₹)</th>
                  <th style={{ textAlign: "right" }}>Discount (₹)</th>
                  <th style={{ textAlign: "right" }}>Net Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {floorTotals.map((floor, index) => {
                  // Calculate discount for this floor
                  const floorDiscount = mainProducts
                    .filter(
                      (p) =>
                        (p.floorName || "Unspecified Floor").trim() ===
                        floor.floorName,
                    )
                    .reduce((sum, p) => {
                      const orig =
                        Number(p.price ?? 0) * Number(p.quantity ?? 1);
                      const lineTotal = Number(p.total ?? 0);
                      return sum + (orig - lineTotal);
                    }, 0);

                  const netAmount = floor.total - floorDiscount;

                  return (
                    <tr key={index}>
                      <td>{floor.floorName}</td>
                      <td style={{ textAlign: "right" }}>
                        ₹{floor.total.toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: floorDiscount > 0 ? "#f5222d" : "#666",
                        }}
                      >
                        {floorDiscount > 0
                          ? `-₹${Math.round(floorDiscount).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        ₹{Math.round(netAmount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Divider style={{ margin: "30px 0 25px" }} />
          </>
        )}

        {/* Room-wise Totals + Discounts */}
        {hasRoomData && (
          <>
            <h3 style={{ color: "#d32f2f", margin: "25px 0 12px" }}>
              Room-wise Totals
            </h3>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Floor</th>
                  <th>Room</th>
                  <th style={{ textAlign: "right" }}>Subtotal (₹)</th>
                  <th style={{ textAlign: "right" }}>Discount (₹)</th>
                  <th style={{ textAlign: "right" }}>Net Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {roomTotals.map((room, index) => {
                  // Calculate discount for this room
                  const roomDiscount = mainProducts
                    .filter(
                      (p) =>
                        (p.floorName || "Unspecified Floor").trim() ===
                          room.floorName &&
                        (p.roomName || "Unspecified Room").trim() ===
                          room.roomName,
                    )
                    .reduce((sum, p) => {
                      const orig =
                        Number(p.price ?? 0) * Number(p.quantity ?? 1);
                      const lineTotal = Number(p.total ?? 0);
                      return sum + (orig - lineTotal);
                    }, 0);

                  const netAmount = room.total - roomDiscount;

                  return (
                    <tr key={index}>
                      <td>{room.floorName}</td>
                      <td>{room.roomName}</td>
                      <td style={{ textAlign: "right" }}>
                        ₹{room.total.toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: roomDiscount > 0 ? "#f5222d" : "#666",
                        }}
                      >
                        {roomDiscount > 0
                          ? `-₹${Math.round(roomDiscount).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        ₹{Math.round(netAmount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Divider style={{ margin: "30px 0 25px" }} />
          </>
        )}

        {/* Final Financial Summary */}
        <div
          className={styles.finalSummaryWrapper}
          style={{ marginTop: hasFloorData || hasRoomData ? 10 : 40 }}
        >
          <div className={styles.finalSummarySection}>
            <div className={styles.summaryLeft}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
              </div>

              {displayProductDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Total Product Discount</span>
                  <span style={{ color: "#f5222d" }}>
                    -₹
                    {Math.round(displayProductDiscount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {backendExtraDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Extra Discount</span>
                  <span style={{ color: "#fa8c16" }}>
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
      </div>,
    );
    return pages;
  };

  // ── Export Handler (unchanged) ──────────────────────────────────────────
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
