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
  Checkbox,
  Tag,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  FilePdfFilled,
  FileExcelFilled,
  HistoryOutlined,
  SettingOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Dropdown } from "antd";

/** Assets */
import logo from "../../assets/img/logo-quotation.png";
import styles from "../../components/Quotation/quotationnew.module.css";
import coverImage from "../../assets/img/quotation_first_page.jpeg";
import quotationBgImage from "../../assets/img/quotation_letterhead.jpeg";
import siteMapQuotation from "../../assets/img/quotation_sitemap.jpg";

/** API Hooks */
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

  // Toggle between Site Map (Visual) and Tabular Floor/Room View
  const [useTabularLayout, setUseTabularLayout] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    name: true,
    code: true,
    image: true,
    unit: true,
    mrp: true,
    unitPrice: true,
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
    useGetCustomerByIdQuery(customerId, {
      skip: !customerId,
    });

  const { data: addressResponse, isFetching: addrLoading } =
    useGetAddressByIdQuery(shipToId, {
      skip: !shipToId,
    });

  const customer = customerResponse?.data || {};
  const address = addressResponse || {};

  const customerName = customer?.name || "Dear Client";
  const customerPhone = customer?.mobileNumber || customer?.phone || "";
  const customerAddress =
    [address.street, address.city, address.state].filter(Boolean).join(", ") +
      (address.postalCode ? ` - ${address.postalCode}` : "") || "--";

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

  const groupedProductsWithOptions = useMemo(() => {
    const optionMap = new Map();
    optionalProducts.forEach((opt) => {
      if (!optionMap.has(opt.isOptionFor)) optionMap.set(opt.isOptionFor, []);
      optionMap.get(opt.isOptionFor).push(opt);
    });

    return mainProducts.map((mainItem) => ({
      ...mainItem,
      options: optionMap.get(mainItem.productId) || [],
    }));
  }, [mainProducts, optionalProducts]);

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
    return mainProducts.reduce(
      (sum, p) => sum + Number(p.price ?? 0) * Number(p.quantity ?? 1),
      0,
    );
  }, [mainProducts]);

  const totalProductDiscount = useMemo(() => {
    return mainProducts.reduce((sum, p) => {
      const gross = Number(p.price ?? 0) * Number(p.quantity ?? 1);
      return sum + (gross - Number(p.total ?? 0));
    }, 0);
  }, [mainProducts]);

  const extraDiscount = Number(quotation?.extraDiscount ?? 0);
  const finalAmount = Number(quotation?.finalAmount ?? 0);
  const finalAmountInWords = amountInWords(Math.round(finalAmount));

  const hasSiteLayout = useMemo(() => {
    const floors =
      activeVersionData.quotation?.floors || quotation?.floors || [];
    return Array.isArray(floors) && floors.length > 0;
  }, [activeVersionData.quotation, quotation]);

  // ── Area Enrichment ─────────────────────────────────────────────────────
  const enrichProductsWithAreas = useCallback((products, floors) => {
    const areaMap = new Map();
    floors.forEach((floor) => {
      floor.rooms?.forEach((room) => {
        room.areas?.forEach((areaObj) => {
          const key = `${room.roomId}_${areaObj.value || areaObj.name?.toLowerCase()}`;
          if (key)
            areaMap.set(key, areaObj.name || areaObj.value || "Unassigned");
        });
      });
    });

    return products.map((p) => ({
      ...p,
      areaName:
        p.areaValue || p.areaId
          ? areaMap.get(`${p.roomId}_${p.areaValue || p.areaId}`) || p.areaName
          : p.areaName || "Unassigned",
    }));
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

  // ── Grouping Helpers ────────────────────────────────────────────────────
  const groupProductsByFloorAndRoom = (products = []) => {
    const map = new Map();
    products.forEach((p) => {
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
        if (!map.has(key))
          map.set(key, { floorName: floor, roomName: room, products: [] });
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

  // ── Render Area-wise Site Map (Existing) ───────────────────────────────
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

  // ── NEW: Detailed Tabular Floor & Room Wise (Full Products) ─────────────

  const renderDetailedTabularFloorRoom = () => {
    const floorRoomGroups = groupProductsByFloorAndRoom(enrichedProducts);

    const floorMap = new Map();

    floorRoomGroups.forEach((group) => {
      if (!floorMap.has(group.floorName)) {
        floorMap.set(group.floorName, []);
      }

      floorMap.get(group.floorName).push(group);
    });

    const pages = [];
    let globalSno = 0;

    // =========================================================
    // SAFE VISUAL LIMIT
    // (accounts for images + optional rows + headings)
    // =========================================================
    const MAX_VISUAL_ROWS = 9;

    // Estimate row count including options
    const getVisualRowCount = (items) => {
      return items.reduce((sum, item) => {
        return sum + 1 + (item.options?.length || 0);
      }, 0);
    };

    floorMap.forEach((roomsInFloor, floorName) => {
      let roomIndex = 0;

      while (roomIndex < roomsInFloor.length) {
        const currentPageRooms = [];

        let visualRowsUsed = 0;

        while (roomIndex < roomsInFloor.length) {
          const roomGroup = roomsInFloor[roomIndex];

          const roomMainItems = groupedProductsWithOptions.filter((main) =>
            roomGroup.products.some((p) => p.productId === main.productId),
          );

          const roomVisualRows = getVisualRowCount(roomMainItems);

          // =====================================================
          // IF ROOM DOESN'T FIT → NEXT PAGE
          // =====================================================
          if (
            visualRowsUsed > 0 &&
            visualRowsUsed + roomVisualRows > MAX_VISUAL_ROWS
          ) {
            break;
          }

          // =====================================================
          // HUGE ROOM → SPLIT SAFELY
          // =====================================================
          if (roomVisualRows > MAX_VISUAL_ROWS) {
            const splitItems = [];

            let tempRows = visualRowsUsed;

            for (const item of roomMainItems) {
              const itemRows = 1 + (item.options?.length || 0);

              if (
                tempRows + itemRows > MAX_VISUAL_ROWS &&
                splitItems.length > 0
              ) {
                break;
              }

              splitItems.push(item);

              tempRows += itemRows;
            }

            currentPageRooms.push({
              roomGroup,
              roomMainItems: splitItems,
            });

            // Remaining items stay for next page
            const remainingIds = splitItems.map((x) => x.productId);

            roomsInFloor[roomIndex] = {
              ...roomGroup,
              products: roomGroup.products.filter(
                (p) => !remainingIds.includes(p.productId),
              ),
            };

            visualRowsUsed = tempRows;

            break;
          }

          // =====================================================
          // NORMAL ROOM
          // =====================================================
          currentPageRooms.push({
            roomGroup,
            roomMainItems,
          });

          visualRowsUsed += roomVisualRows;

          roomIndex++;
        }

        if (currentPageRooms.length === 0) {
          break;
        }

        // =========================================================
        // PAGE
        // =========================================================
        pages.push(
          <div
            key={`floor-page-${floorName}-${pages.length}`}
            className={`${styles.productPage} page`}
            style={{
              pageBreakBefore: pages.length === 0 ? "auto" : "always",
            }}
          >
            {/* HEADER */}
            <div className={styles.pageTopHeader}>
              <div>
                <div className={styles.clientName}>{customerName}</div>

                <div className={styles.clientAddress}>{customerAddress}</div>

                <div className={styles.clientAddress}>
                  {floorName.toUpperCase()}
                  {pages.length > 1 && " (Continued)"}
                </div>
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

            {/* ROOMS */}
            {currentPageRooms.map(({ roomGroup, roomMainItems }, idx) => {
              if (roomMainItems.length === 0) {
                return null;
              }

              return (
                <div
                  key={roomGroup.roomName + idx}
                  style={{
                    marginBottom: 40,
                    breakInside: "avoid",
                    pageBreakInside: "avoid",
                  }}
                >
                  <h3
                    style={{
                      color: "#222",
                      margin: "25px 0 15px",
                      borderBottom: "2px solid #d32f2f",
                      paddingBottom: 8,
                    }}
                  >
                    {roomGroup.roomName}
                  </h3>

                  {renderProductTable(roomMainItems, "", globalSno, () => true)}
                </div>
              );
            })}
          </div>,
        );

        globalSno += currentPageRooms.reduce(
          (sum, { roomMainItems }) => sum + roomMainItems.length,
          0,
        );
      }
    });

    return pages;
  };

  // ── Render Product Table ────────────────────────────────────────────────
  const renderProductTable = (
    itemsWithOptions,
    title = "",
    startSno = 0,
    shouldShowColumn,
  ) => {
    let localSno = startSno;
    const showCol = shouldShowColumn || (() => true);

    return (
      <>
        {title && (
          <h3 style={{ color: "#d32f2f", margin: "20px 0 10px" }}>{title}</h3>
        )}
        <table className={styles.productTable}>
          <colgroup>
            {showCol("sno") && <col className={styles.sno} />}
            {showCol("name") && <col className={styles.name} />}
            {showCol("code") && <col className={styles.code} />}
            {showCol("image") && <col className={styles.image} />}
            {showCol("unit") && <col className={styles.unit} />}
            {showCol("mrp") && <col className={styles.mrp} />}
            {showCol("unitPrice") && <col style={{ width: "95px" }} />}
            {showCol("discount") && <col className={styles.discount} />}
            {showCol("total") && <col className={styles.total} />}
          </colgroup>
          <thead>
            <tr>
              {showCol("sno") && <th>S.No</th>}
              {showCol("name") && <th>Product Name</th>}
              {showCol("code") && <th>Code</th>}
              {showCol("image") && <th>Image</th>}
              {showCol("unit") && <th>Unit</th>}
              {showCol("mrp") && <th>MRP</th>}
              {showCol("unitPrice") && <th>Unit Price</th>}
              {showCol("discount") && <th>Discount</th>}
              {showCol("total") && <th>Total</th>}
            </tr>
          </thead>
          <tbody>
            {itemsWithOptions.map((mainItem) => {
              const code = mainItem.companyCode || mainItem.productCode || "—";
              const img = mainItem.imageUrl || "";
              const mrp = Number(mainItem.price ?? 0);
              const qty = Number(mainItem.quantity ?? 1);
              const lineTotal = Number(mainItem.total ?? 0);
              const discValue = Number(mainItem.discount ?? 0);
              const discType = (
                mainItem.discountType ?? "percent"
              ).toLowerCase();

              let unitPrice = mrp;
              if (discValue > 0) {
                unitPrice =
                  discType === "percent"
                    ? mrp * (1 - discValue / 100)
                    : mrp - discValue;
              }
              unitPrice = Math.round(unitPrice * 100) / 100;

              const displayDiscount =
                discValue > 0
                  ? discType === "percent"
                    ? `${discValue}%`
                    : `₹${discValue.toFixed(0)}`
                  : "—";

              localSno++;

              return (
                <React.Fragment key={mainItem.productId}>
                  <tr>
                    {showCol("sno") && (
                      <td className={styles.snoCell}>{localSno}.</td>
                    )}
                    {showCol("name") && (
                      <td className={styles.prodNameCell}>{mainItem.name}</td>
                    )}
                    {showCol("code") && <td>{code}</td>}
                    {showCol("image") && (
                      <td>
                        {img && (
                          <img
                            src={img}
                            alt={mainItem.name}
                            className={styles.prodImg}
                          />
                        )}
                      </td>
                    )}
                    {showCol("unit") && <td>{qty}</td>}
                    {showCol("mrp") && <td>₹{mrp.toLocaleString("en-IN")}</td>}
                    {showCol("unitPrice") && (
                      <td style={{ fontWeight: 600, color: "#d32f2f" }}>
                        ₹{unitPrice.toLocaleString("en-IN")}
                      </td>
                    )}
                    {showCol("discount") && (
                      <td className={styles.discountCell}>{displayDiscount}</td>
                    )}
                    {showCol("total") && (
                      <td className={styles.totalCell}>
                        ₹{lineTotal.toLocaleString("en-IN")}
                      </td>
                    )}
                  </tr>

                  {mainItem.options?.map((opt, idx) => {
                    // Optional items logic (same as your original)
                    const optCode = opt.companyCode || opt.productCode || "—";
                    const optMrp = Number(opt.price ?? 0);
                    const optQty = Number(opt.quantity ?? 1);
                    const optTotal = Number(opt.total ?? 0);
                    const optDisc = Number(opt.discount ?? 0);
                    const optDiscType = (
                      opt.discountType ?? "percent"
                    ).toLowerCase();

                    let optUnitPrice = optMrp;
                    if (optDisc > 0) {
                      optUnitPrice =
                        optDiscType === "percent"
                          ? optMrp * (1 - optDisc / 100)
                          : optMrp - optDisc;
                    }
                    optUnitPrice = Math.round(optUnitPrice * 100) / 100;

                    const optDisplayDisc =
                      optDisc > 0
                        ? optDiscType === "percent"
                          ? `${optDisc}%`
                          : `₹${optDisc.toFixed(0)}`
                        : "—";

                    return (
                      <tr
                        key={opt.productId || `opt-${idx}`}
                        style={{ background: "#f9f9f9" }}
                      >
                        {showCol("sno") && <td></td>}
                        {showCol("name") && (
                          <td
                            className={styles.prodNameCell}
                            style={{ paddingLeft: "40px", color: "#444" }}
                          >
                            ↳ {opt.name}{" "}
                            <span style={{ fontSize: "0.85em", color: "#666" }}>
                              (Optional)
                            </span>
                          </td>
                        )}
                        {showCol("code") && <td>{optCode}</td>}
                        {showCol("image") && (
                          <td>
                            {opt.imageUrl && (
                              <img
                                src={opt.imageUrl}
                                alt={opt.name}
                                className={styles.prodImg}
                              />
                            )}
                          </td>
                        )}
                        {showCol("unit") && <td>{optQty}</td>}
                        {showCol("mrp") && (
                          <td>₹{optMrp.toLocaleString("en-IN")}</td>
                        )}
                        {showCol("unitPrice") && (
                          <td style={{ fontWeight: 600, color: "#d32f2f" }}>
                            ₹{optUnitPrice.toLocaleString("en-IN")}
                          </td>
                        )}
                        {showCol("discount") && (
                          <td className={styles.discountCell}>
                            {optDisplayDisc}
                          </td>
                        )}
                        {showCol("total") && (
                          <td className={styles.totalCell}>
                            ₹{optTotal.toLocaleString("en-IN")}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </>
    );
  };

  // ── Render All Pages ────────────────────────────────────────────────────
  const renderPages = (getShouldShowColumn) => {
    const shouldShowColumn = getShouldShowColumn || (() => true);
    const pages = [];
    const MAX_PRODUCTS_NORMAL = 10;

    // Cover Page
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

    // Letterhead Page
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

    // Main Product Pages
    let remainingItems = [...groupedProductsWithOptions];
    let globalSno = 0;

    while (remainingItems.length > 0) {
      const itemsThisPage = remainingItems.slice(0, MAX_PRODUCTS_NORMAL);
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
          {renderProductTable(itemsThisPage, "", globalSno, shouldShowColumn)}
        </div>,
      );
      globalSno += itemsThisPage.length;
      remainingItems = remainingItems.slice(itemsThisPage.length);
    }

    // Floor & Room Section with Toggle
    if (hasSiteLayout) {
      if (useTabularLayout) {
        pages.push(...renderDetailedTabularFloorRoom());
      } else {
        const roomGroups = groupProductsByFloorAndRoom(enrichedProducts);
        roomGroups.forEach((roomGroup) => {
          if (roomGroup.products?.length > 0) {
            pages.push(...renderAreaWisePageForRoom(roomGroup));
          }
        });
      }
    }

    // Final Summary
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
        await exportToExcel(/* your existing excel params */);
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
          {/* Top Bar */}
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

                <Button
                  icon={
                    useTabularLayout ? <TableOutlined /> : <HistoryOutlined />
                  }
                  onClick={() => setUseTabularLayout(!useTabularLayout)}
                  type={useTabularLayout ? "default" : "primary"}
                >
                  {useTabularLayout ? "Show Site Map" : "Show Tabular"}
                </Button>

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

          {/* Preview */}
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
