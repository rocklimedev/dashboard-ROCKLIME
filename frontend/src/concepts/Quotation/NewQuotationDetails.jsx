// src/pages/quotations/NewQuotationsDetails.jsx
import React, { useRef, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  FilePdfFilled,
  FileExcelFilled,
  HistoryOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  OrderedListOutlined,
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

// ── Shared Pricing Helper ────────────────────────────────────────────────
const computePricing = (item) => {
  const mrp = Number(item.price ?? 0);
  const qty = Number(item.quantity ?? 1);
  const discValue = Number(item.discount ?? 0);
  const discType = (item.discountType ?? "percent").toLowerCase();

  let unitPrice = mrp;
  if (discValue > 0) {
    unitPrice =
      discType === "percent" ? mrp * (1 - discValue / 100) : mrp - discValue;
  }
  unitPrice = Math.round(unitPrice * 100) / 100;

  const lineTotal =
    item.total !== undefined && item.total !== null && Number(item.total) > 0
      ? Number(item.total)
      : Math.round(unitPrice * qty * 100) / 100;

  const displayDiscount =
    discValue > 0
      ? discType === "percent"
        ? `${discValue}%`
        : `₹${discValue.toFixed(0)}`
      : "—";

  return { mrp, qty, unitPrice, lineTotal, displayDiscount };
};

const groupItemsWithOptions = (itemsList) => {
  const mains = itemsList.filter((p) => p.isOptionFor == null);
  const opts = itemsList.filter((p) => p.isOptionFor != null);
  const optMap = new Map();
  opts.forEach((opt) => {
    if (!optMap.has(opt.isOptionFor)) optMap.set(opt.isOptionFor, []);
    optMap.get(opt.isOptionFor).push(opt);
  });
  return mains.map((m) => ({ ...m, options: optMap.get(m.productId) || [] }));
};

// ── Room-wise Totals Helper ───────────────────────────────────────────────
const computeRoomTotals = (roomProducts = []) => {
  const roomMainItems = groupItemsWithOptions(roomProducts);

  const gross = roomMainItems.reduce((sum, item) => {
    const mrp = Number(item.price ?? 0);
    const qty = Number(item.quantity ?? 1);
    const optionsGross = (item.options || []).reduce(
      (s, opt) => s + Number(opt.price ?? 0) * Number(opt.quantity ?? 1),
      0,
    );
    return sum + mrp * qty + optionsGross;
  }, 0);

  const net = roomMainItems.reduce((sum, item) => {
    const { lineTotal } = computePricing(item);
    const optionsNet = (item.options || []).reduce((s, opt) => {
      const { lineTotal: optTotal } = computePricing(opt);
      return s + optTotal;
    }, 0);
    return sum + lineTotal + optionsNet;
  }, 0);

  return { gross, discount: gross - net, net };
};

// ── Title by Gender Helper ─────────────────────────────────────────────
const getTitleByGender = (gender) => {
  const g = (gender || "").toLowerCase();
  if (g === "male") return "Mr.";
  if (g === "female") return "Ms.";
  return "Mx.";
};

const NewQuotationsDetails = () => {
  const { id } = useParams();
  const [activeVersion, setActiveVersion] = useState("current");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  const [includeProductListPage, setIncludeProductListPage] = useState(true);
  const [includeSummaryPage, setIncludeSummaryPage] = useState(true);
  const [includeRoomWiseSummaryPage, setIncludeRoomWiseSummaryPage] =
    useState(true);
  const [includeRoomTotals, setIncludeRoomTotals] = useState(true);

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

  // ── Floor & Room Ordering (UI-only, no backend field) ───────────────────
  // floorOrder: null = no custom order set -> fall back to original
  // alphabetical order exactly as before. Once reordered via the UI it
  // becomes an array of floor names in the user's chosen order.
  const [floorOrder, setFloorOrder] = useState(null);
  // roomOrderMap: { [floorName]: string[] } — per-floor room order. A floor
  // missing from this map (or with an empty array) falls back to the
  // original alphabetical room order within that floor.
  const [roomOrderMap, setRoomOrderMap] = useState({});

  const quotationRef = useRef(null);

  // ── Data Fetching ─────────────────────────────────────────────────────
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

  // ── Versions Logic ───────────────────────────────────────────────────
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

  // ── Customer & Address ───────────────────────────────────────────────
  const customerId =
    activeVersionData.quotation?.customerId || quotation?.customerId;
  const shipToId = activeVersionData.quotation?.shipTo || quotation?.shipTo;

  const { data: customerResponse, isFetching: custLoading } =
    useGetCustomerByIdQuery(customerId, { skip: !customerId });
  const { data: addressResponse, isFetching: addrLoading } =
    useGetAddressByIdQuery(shipToId, { skip: !shipToId });

  const customer = customerResponse?.data || {};
  const address = addressResponse || {};

  const customerName = useMemo(() => {
    if (!customer?.name) return "Dear Client";
    if (customer.displayName) return customer.displayName;
    const title = customer.title || getTitleByGender(customer.gender);
    return `${title} ${customer.name}`;
  }, [customer]);

  const customerPhone = customer?.mobileNumber || customer?.phone || "";
  const customerAddress =
    [address.street, address.city, address.state].filter(Boolean).join(", ") +
      (address.postalCode ? ` - ${address.postalCode}` : "") || "--";

  // ── Products ───────────────────────────────────────────────────────────
  const allProducts = useMemo(() => {
    const products = activeVersionData.products || [];
    return products
      .map((p) => ({
        ...p,
        floorName: p.floorName || "",
        roomName: p.roomName || "",
        imageUrl: p.imageUrl || "",
        companyCode: p.companyCode || p.productCode || "—",
        priority: Number(p.priority ?? 9999),
      }))
      .sort((a, b) => a.priority - b.priority);
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

  const mainProductsOnly = useMemo(
    () =>
      groupedProductsWithOptions.map((item) => ({
        ...item,
        options: [],
      })),
    [groupedProductsWithOptions],
  );

  // ── Brand Names ──────────────────────────────────────────────────────
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

  // ── Calculations ─────────────────────────────────────────────────────
  const grossTotalBeforeDiscount = useMemo(() => {
    return mainProducts.reduce(
      (sum, p) => sum + Number(p.price ?? 0) * Number(p.quantity ?? 1),
      0,
    );
  }, [mainProducts]);

  const totalProductDiscount = useMemo(() => {
    return mainProducts.reduce((sum, p) => {
      const qty = Number(p.quantity ?? 1);
      const gross = Number(p.price ?? 0) * qty;
      const { lineTotal } = computePricing(p);
      return sum + (gross - lineTotal);
    }, 0);
  }, [mainProducts]);

  const extraDiscount = Number(quotation?.extraDiscount ?? 0);
  const shippingAmount = Number(
    quotation?.shippingAmount ?? quotation?.calculated?.shippingAmount ?? 0,
  );
  const finalAmount = Number(quotation?.finalAmount ?? 0);
  const finalAmountInWords = amountInWords(Math.round(finalAmount));

  const hasFloorLayout = useMemo(() => {
    const floors =
      activeVersionData.quotation?.floors || quotation?.floors || [];
    return Array.isArray(floors) && floors.length > 0;
  }, [activeVersionData.quotation, quotation]);

  const enrichedProducts = allProducts;

  // ── Floor Order (UI-only) ────────────────────────────────────────────
  // Default floor list in the app's original alphabetical order — this is
  // exactly what would render if the user never touches the new control.
  const defaultFloorNames = useMemo(() => {
    const names = new Set();
    enrichedProducts.forEach((p) => {
      const locations =
        Array.isArray(p.locations) && p.locations.length > 0
          ? p.locations
          : [{ floorName: p.floorName || "Unspecified Floor" }];
      locations.forEach((loc) => {
        names.add((loc.floorName || "Unspecified Floor").trim());
      });
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [enrichedProducts]);

  // Effective floor order: the user's custom order if one has been set
  // (merged with any newly-appearing floors), otherwise the original
  // alphabetical default as-is.
  const effectiveFloorOrder = useMemo(() => {
    if (!floorOrder || floorOrder.length === 0) return defaultFloorNames;
    const known = floorOrder.filter((f) => defaultFloorNames.includes(f));
    const missing = defaultFloorNames.filter((f) => !known.includes(f));
    return [...known, ...missing];
  }, [floorOrder, defaultFloorNames]);

  const floorOrderIndexMap = useMemo(() => {
    const m = new Map();
    effectiveFloorOrder.forEach((name, idx) => m.set(name, idx));
    return m;
  }, [effectiveFloorOrder]);

  // ── Room Order (UI-only, per floor) ──────────────────────────────────
  // Default rooms per floor, alphabetical — same as the app's original
  // room ordering within a floor.
  const defaultRoomsByFloor = useMemo(() => {
    const map = new Map(); // floorName -> Set(roomName)
    enrichedProducts.forEach((p) => {
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
        if (!map.has(floor)) map.set(floor, new Set());
        map.get(floor).add(room);
      });
    });
    const result = new Map();
    map.forEach((rooms, floor) => {
      result.set(
        floor,
        [...rooms].sort((a, b) => a.localeCompare(b)),
      );
    });
    return result;
  }, [enrichedProducts]);

  // Effective rooms per floor: user's custom order (merged with any new
  // rooms) if set for that floor, otherwise the original alphabetical
  // default as-is — exactly the prior behavior when untouched.
  const effectiveRoomsByFloor = useMemo(() => {
    const result = new Map();
    defaultRoomsByFloor.forEach((defaultRooms, floor) => {
      const custom = roomOrderMap[floor];
      if (!custom || custom.length === 0) {
        result.set(floor, defaultRooms);
        return;
      }
      const known = custom.filter((r) => defaultRooms.includes(r));
      const missing = defaultRooms.filter((r) => !known.includes(r));
      result.set(floor, [...known, ...missing]);
    });
    return result;
  }, [defaultRoomsByFloor, roomOrderMap]);

  const roomOrderIndexMap = useMemo(() => {
    const outer = new Map(); // floorName -> Map(roomName -> idx)
    effectiveRoomsByFloor.forEach((rooms, floor) => {
      const inner = new Map();
      rooms.forEach((room, idx) => inner.set(room, idx));
      outer.set(floor, inner);
    });
    return outer;
  }, [effectiveRoomsByFloor]);

  const moveFloor = (floorName, direction) => {
    const base = [...effectiveFloorOrder];
    const idx = base.indexOf(floorName);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapWith < 0 || swapWith >= base.length) return;
    [base[idx], base[swapWith]] = [base[swapWith], base[idx]];
    setFloorOrder(base);
  };

  const moveRoom = (floorName, roomName, direction) => {
    const base = [...(effectiveRoomsByFloor.get(floorName) || [])];
    const idx = base.indexOf(roomName);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapWith < 0 || swapWith >= base.length) return;
    [base[idx], base[swapWith]] = [base[swapWith], base[idx]];
    setRoomOrderMap((prev) => ({ ...prev, [floorName]: base }));
  };

  const resetFloorAndRoomOrder = () => {
    setFloorOrder(null);
    setRoomOrderMap({});
  };

  // ── Grouping Helpers ─────────────────────────────────────────────────
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
        const assignedQty = Number(loc.assignedQuantity ?? p.quantity ?? 1);
        map.get(key).products.push({
          ...p,
          ...loc,
          quantity: assignedQty,
          total: undefined,
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      // Floor order first (UI-set order, falling back to alphabetical)
      const floorCmp =
        (floorOrderIndexMap.get(a.floorName) ?? Infinity) -
        (floorOrderIndexMap.get(b.floorName) ?? Infinity);
      if (floorCmp !== 0) return floorCmp;

      // Then room order within that floor (UI-set order, falling back to
      // alphabetical) — only meaningful when both rows share a floor.
      const roomMapForFloor = roomOrderIndexMap.get(a.floorName);
      const aRoomIdx = roomMapForFloor?.get(a.roomName) ?? Infinity;
      const bRoomIdx = roomMapForFloor?.get(b.roomName) ?? Infinity;
      if (aRoomIdx !== bRoomIdx) return aRoomIdx - bRoomIdx;

      return a.roomName.localeCompare(b.roomName);
    });
  };

  // ── Render Per-Room Discount / Total Box ────────────────────────────
  const renderRoomDiscountBox = (roomName, roomProducts) => {
    if (!roomProducts || roomProducts.length === 0) return null;
    const { gross, discount, net } = computeRoomTotals(roomProducts);

    return (
      <div
        key={`room-discount-${roomName}`}
        style={{
          marginTop: 12,
          marginBottom: 8,
          padding: "10px 16px",
          border: "1.5px solid #d32f2f",
          borderRadius: 6,
          display: "flex",
          justifyContent: "flex-end",
          breakInside: "avoid",
          pageBreakInside: "avoid",
        }}
      >
        <div style={{ minWidth: 220, textAlign: "right" }}>
          <div style={{ fontSize: "0.8em", color: "#666" }}>
            {roomName.toUpperCase()} — Total
          </div>
          <div style={{ fontSize: "0.9em", color: "#333" }}>
            ₹{gross.toLocaleString("en-IN")}
          </div>
          {discount > 0 && (
            <div style={{ fontSize: "0.85em", color: "#f5222d" }}>
              Discount: −₹{Math.round(discount).toLocaleString("en-IN")}
            </div>
          )}
          <div
            style={{ fontSize: "1.15em", fontWeight: 700, color: "#d32f2f" }}
          >
            ₹{Math.round(net).toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    );
  };

  // ── Detailed Tabular Floor & Room Wise (Full Products) ──────────────
  const renderDetailedTabularFloorRoom = (
    shouldShowColumn,
    showRoomTotals = true,
  ) => {
    // floorRoomGroups already comes out floor-ordered then room-ordered
    // from groupProductsByFloorAndRoom, so iteration order below is
    // preserved automatically — no extra sorting needed here.
    const floorRoomGroups = groupProductsByFloorAndRoom(enrichedProducts);
    const floorMap = new Map();
    floorRoomGroups.forEach((group) => {
      if (!floorMap.has(group.floorName)) {
        floorMap.set(group.floorName, []);
      }
      floorMap.get(group.floorName).push(group);
    });

    // Preserve insertion order of floorMap, which already reflects the
    // effective floor order (Map preserves insertion order in JS).
    const orderedFloorNames = [...floorMap.keys()];

    const pages = [];
    const roomSnoTracker = new Map();
    const MAX_VISUAL_ROWS = 9;

    const getVisualRowCount = (items) => {
      return items.reduce((sum, item) => {
        return sum + 1 + (item.options?.length || 0);
      }, 0);
    };

    orderedFloorNames.forEach((floorName) => {
      const roomsInFloor = floorMap.get(floorName);
      let roomIndex = 0;

      while (roomIndex < roomsInFloor.length) {
        const currentPageRooms = [];
        let visualRowsUsed = 0;

        while (roomIndex < roomsInFloor.length) {
          const roomGroup = roomsInFloor[roomIndex];
          const roomMainItems = groupItemsWithOptions(roomGroup.products);
          const roomVisualRows = getVisualRowCount(roomMainItems);

          if (
            visualRowsUsed > 0 &&
            visualRowsUsed + roomVisualRows > MAX_VISUAL_ROWS
          ) {
            break;
          }

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
            currentPageRooms.push({ roomGroup, roomMainItems: splitItems });
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

          currentPageRooms.push({ roomGroup, roomMainItems });
          visualRowsUsed += roomVisualRows;
          roomIndex++;
        }

        if (currentPageRooms.length === 0) break;

        pages.push(
          <div
            key={`floor-page-${floorName}-${pages.length}`}
            className={`${styles.productPage} page`}
            style={{
              pageBreakBefore: pages.length === 0 ? "auto" : "always",
            }}
          >
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

            {currentPageRooms.map(({ roomGroup, roomMainItems }, idx) => {
              if (roomMainItems.length === 0) return null;

              const roomKey = `${floorName}|||${roomGroup.roomName}`;
              const startSno = roomSnoTracker.get(roomKey) || 0;
              roomSnoTracker.set(roomKey, startSno + roomMainItems.length);
              const isContinuation = startSno > 0;

              const isLastChunkOfRoom = !roomsInFloor.some(
                (r, i) =>
                  i >= roomIndex &&
                  r.roomName === roomGroup.roomName &&
                  (r.products?.length || 0) > 0,
              );

              const fullRoomProducts =
                floorRoomGroups.find(
                  (g) =>
                    g.floorName === floorName &&
                    g.roomName === roomGroup.roomName,
                )?.products || roomGroup.products;

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
                    {roomGroup.roomName} {isContinuation && " (Continued)"}
                  </h3>
                  {renderProductTable(
                    roomMainItems,
                    "",
                    startSno,
                    shouldShowColumn,
                  )}
                  {isLastChunkOfRoom &&
                    showRoomTotals &&
                    renderRoomDiscountBox(roomGroup.roomName, fullRoomProducts)}
                </div>
              );
            })}
          </div>,
        );
      }
    });

    return pages;
  };

  // ── Render Product Table ────────────────────────────────────────────
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
              const { mrp, qty, unitPrice, lineTotal, displayDiscount } =
                computePricing(mainItem);
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
                    const optCode = opt.companyCode || opt.productCode || "—";
                    const {
                      mrp: optMrp,
                      qty: optQty,
                      unitPrice: optUnitPrice,
                      lineTotal: optTotal,
                      displayDiscount: optDisplayDisc,
                    } = computePricing(opt);

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

  // ── Render Optional Items on their own dedicated page(s) ────────────
  const renderOptionalItemsPages = (shouldShowColumn) => {
    if (optionalProducts.length === 0) return [];

    const MAX_OPTIONAL_PER_PAGE = 10;
    const pages = [];
    const flatOptionalItems = optionalProducts.map((opt) => ({
      ...opt,
      options: [],
    }));

    let remaining = [...flatOptionalItems];
    let localSno = 0;

    while (remaining.length > 0) {
      const itemsThisPage = remaining.slice(0, MAX_OPTIONAL_PER_PAGE);

      pages.push(
        <div
          key={`optional-page-${localSno}`}
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

          <h2
            style={{
              color: "#d32f2f",
              textAlign: "center",
              margin: "20px 0 25px",
            }}
          >
            OPTIONAL ITEMS
          </h2>

          {renderProductTable(itemsThisPage, "", localSno, shouldShowColumn)}
        </div>,
      );

      localSno += itemsThisPage.length;
      remaining = remaining.slice(itemsThisPage.length);
    }

    return pages;
  };

  // ── Render Room-wise Summary Page(s) ─────────────────────────────────
  const renderRoomWiseSummaryPages = () => {
    if (!hasFloorLayout) return [];

    // roomGroups comes out already floor-ordered then room-ordered from
    // groupProductsByFloorAndRoom.
    const roomGroups = groupProductsByFloorAndRoom(enrichedProducts);
    if (roomGroups.length === 0) return [];

    const summaryRows = roomGroups.map((group) => {
      const roomMainItems = groupItemsWithOptions(group.products);
      const itemCount = roomMainItems.reduce(
        (sum, item) => sum + 1 + (item.options?.length || 0),
        0,
      );
      const roomSubtotal = roomMainItems.reduce((sum, item) => {
        const { lineTotal } = computePricing(item);
        const optionsTotal = (item.options || []).reduce((optSum, opt) => {
          const { lineTotal: optTotal } = computePricing(opt);
          return optSum + optTotal;
        }, 0);
        return sum + lineTotal + optionsTotal;
      }, 0);

      return {
        floorName: group.floorName,
        roomName: group.roomName,
        itemCount,
        roomSubtotal,
      };
    });

    // Preserve the already-correct floor+room order by inserting into a Map
    // in the order rows appear (Map preserves insertion order in JS).
    const floorWise = new Map();
    summaryRows.forEach((row) => {
      if (!floorWise.has(row.floorName)) floorWise.set(row.floorName, []);
      floorWise.get(row.floorName).push(row);
    });

    const grandTotal = summaryRows.reduce(
      (sum, row) => sum + row.roomSubtotal,
      0,
    );

    const ROWS_PER_PAGE = 22;
    const allRowsFlat = [];
    floorWise.forEach((rows, floorName) => {
      allRowsFlat.push({ isFloorHeader: true, floorName });
      rows.forEach((r) => allRowsFlat.push(r));
    });

    const pages = [];
    let pageIndex = 0;

    for (let i = 0; i < allRowsFlat.length; i += ROWS_PER_PAGE) {
      const chunk = allRowsFlat.slice(i, i + ROWS_PER_PAGE);
      const isLastPage = i + ROWS_PER_PAGE >= allRowsFlat.length;

      pages.push(
        <div
          key={`room-summary-page-${pageIndex}`}
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

          <h2
            style={{
              color: "#d32f2f",
              textAlign: "center",
              margin: "20px 0 25px",
            }}
          >
            ROOM-WISE SUMMARY {pageIndex > 0 ? "(Continued)" : ""}
          </h2>

          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Floor / Room</th>
                <th>Items</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {chunk.map((row, idx) =>
                row.isFloorHeader ? (
                  <tr key={`floor-${row.floorName}-${idx}`}>
                    <td
                      colSpan={3}
                      style={{
                        background: "#fafafa",
                        fontWeight: 700,
                        color: "#222",
                        borderTop: "2px solid #d32f2f",
                        paddingTop: 10,
                      }}
                    >
                      {row.floorName.toUpperCase()}
                    </td>
                  </tr>
                ) : (
                  <tr key={`${row.floorName}-${row.roomName}-${idx}`}>
                    <td style={{ paddingLeft: 24 }}>{row.roomName}</td>
                    <td>{row.itemCount}</td>
                    <td className={styles.totalCell}>
                      ₹{Math.round(row.roomSubtotal).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {isLastPage && (
            <div
              style={{
                marginTop: 30,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  minWidth: 280,
                  border: "2px solid #d32f2f",
                  borderRadius: 8,
                  padding: "14px 20px",
                  textAlign: "right",
                }}
              >
                <div style={{ fontSize: "0.9em", color: "#666" }}>
                  Total (All Rooms)
                </div>
                <div
                  style={{
                    fontSize: "1.6em",
                    fontWeight: 700,
                    color: "#d32f2f",
                  }}
                >
                  ₹{Math.round(grandTotal).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          )}
        </div>,
      );

      pageIndex++;
    }

    return pages;
  };

  // ── Render All Pages ─────────────────────────────────────────────────
  const renderPages = ({
    shouldShowColumn: getShouldShowColumn,
    includeProductList = true,
    includeSummary = true,
    includeRoomWiseSummary = true,
    includeRoomTotals: showRoomTotals = true,
  } = {}) => {
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
            487/65, National Market, Peera Garhi, Delhi, 110087 <br />
            0991180605 <br />
            www.cmtradingco.com
          </div>
        </div>
      </div>,
    );

    // Main Product Pages
    if (includeProductList) {
      let remainingItems = [...mainProductsOnly];
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
    }

    // Optional Items
    pages.push(...renderOptionalItemsPages(shouldShowColumn));

    // Floor & Room Section
    if (hasFloorLayout) {
      pages.push(
        ...renderDetailedTabularFloorRoom(shouldShowColumn, showRoomTotals),
      );
    }

    // Room-wise Summary (optional)
    if (includeRoomWiseSummary) {
      pages.push(...renderRoomWiseSummaryPages());
    }

    // Final Summary
    if (includeSummary) {
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
                  <span>
                    ₹{grossTotalBeforeDiscount.toLocaleString("en-IN")}
                  </span>
                </div>
                {totalProductDiscount > 0 && (
                  <div className={styles.summaryRow}>
                    <span style={{ color: "#f5222d" }}>Discount</span>
                    <span style={{ color: "#f5222d" }}>
                      -₹
                      {Math.round(totalProductDiscount).toLocaleString("en-IN")}
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
                {shippingAmount > 0 && (
                  <div className={styles.summaryRow}>
                    <span style={{ color: "#1890ff" }}>Shipping</span>
                    <span style={{ color: "#1890ff" }}>
                      ₹{Math.round(shippingAmount).toLocaleString("en-IN")}
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
    }

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
          {
            visibleColumns,
            includeProductListPage,
            includeSummaryPage,
            includeRoomWiseSummaryPage,
            includeRoomTotals,
          },
        );
      } else {
        await exportToExcel({
          products: mainProducts,
          brandNames,
          customerName,
          quotation: activeVersionData.quotation || quotation,
          address: customerAddress,
          logo,
          id,
          activeVersion,
        });
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
              padding: "14px 24px",
              background: "#fff",
              borderBottom: "1px solid #f0f0f0",
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <div
              style={{
                maxWidth: 1400,
                margin: "0 auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              {/* LEFT: Title Section */}
              <div style={{ minWidth: 280 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color: "#1f1f1f",
                      fontWeight: 600,
                    }}
                  >
                    {quotation.document_title || "Quotation"}
                  </Title>
                  {activeVersion !== "current" && (
                    <Tag color="blue">v{activeVersion}</Tag>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "#666",
                  }}
                >
                  {quotation.reference_number || "—"}{" "}
                  <span style={{ margin: "0 6px" }}>•</span>
                  {customerName || "No Customer"}{" "}
                  <span style={{ margin: "0 6px" }}>•</span>
                  {brandNames || "—"}
                </div>
              </div>

              {/* RIGHT: Actions */}
              <Space size={12} wrap align="center">
                {/* Floor & Room Order Config */}
                {hasFloorLayout && (
                  <Dropdown
                    trigger={["click"]}
                    placement="bottomRight"
                    dropdownRender={() => (
                      <div
                        style={{
                          padding: 16,
                          background: "#fff",
                          borderRadius: 10,
                          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                          width: 300,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 10 }}>
                          Floor &amp; Room Order
                        </div>
                        <Space
                          direction="vertical"
                          size={12}
                          style={{
                            width: "100%",
                            maxHeight: 340,
                            overflowY: "auto",
                            paddingRight: 4,
                          }}
                        >
                          {effectiveFloorOrder.map((floorName, idx) => {
                            const rooms =
                              effectiveRoomsByFloor.get(floorName) || [];
                            return (
                              <div key={floorName}>
                                {/* Floor row */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                    title={floorName}
                                  >
                                    {idx + 1}. {floorName}
                                  </span>
                                  <Space size={4}>
                                    <Button
                                      size="small"
                                      icon={<ArrowUpOutlined />}
                                      disabled={idx === 0}
                                      onClick={() => moveFloor(floorName, "up")}
                                    />
                                    <Button
                                      size="small"
                                      icon={<ArrowDownOutlined />}
                                      disabled={
                                        idx === effectiveFloorOrder.length - 1
                                      }
                                      onClick={() =>
                                        moveFloor(floorName, "down")
                                      }
                                    />
                                  </Space>
                                </div>

                                {/* Rooms within this floor */}
                                {rooms.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: 6,
                                      paddingLeft: 14,
                                      borderLeft: "2px solid #f0f0f0",
                                    }}
                                  >
                                    {rooms.map((roomName, rIdx) => (
                                      <div
                                        key={roomName}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 8,
                                          padding: "3px 0",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: 12,
                                            color: "#555",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                          title={roomName}
                                        >
                                          {rIdx + 1}. {roomName}
                                        </span>
                                        <Space size={4}>
                                          <Button
                                            size="small"
                                            icon={<ArrowUpOutlined />}
                                            disabled={rIdx === 0}
                                            onClick={() =>
                                              moveRoom(
                                                floorName,
                                                roomName,
                                                "up",
                                              )
                                            }
                                          />
                                          <Button
                                            size="small"
                                            icon={<ArrowDownOutlined />}
                                            disabled={rIdx === rooms.length - 1}
                                            onClick={() =>
                                              moveRoom(
                                                floorName,
                                                roomName,
                                                "down",
                                              )
                                            }
                                          />
                                        </Space>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </Space>
                        <Divider style={{ margin: "10px 0" }} />
                        <Button
                          type="link"
                          block
                          onClick={resetFloorAndRoomOrder}
                        >
                          Reset to Default (A–Z)
                        </Button>
                      </div>
                    )}
                  >
                    <Button size="middle" icon={<OrderedListOutlined />}>
                      Floor &amp; Room Order
                    </Button>
                  </Dropdown>
                )}

                {/* Export Column Config */}
                <Dropdown
                  trigger={["click"]}
                  placement="bottomRight"
                  dropdownRender={() => (
                    <div
                      style={{
                        padding: 16,
                        background: "#fff",
                        borderRadius: 10,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                        width: 260,
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 10 }}>
                        Export Columns
                      </div>
                      <Checkbox.Group
                        style={{ width: "100%" }}
                        value={Object.keys(visibleColumns).filter(
                          (k) => visibleColumns[k],
                        )}
                        onChange={(checked) => {
                          const map = {};
                          Object.keys(visibleColumns).forEach((key) => {
                            map[key] = checked.includes(key);
                          });
                          setVisibleColumns(map);
                        }}
                      >
                        <Space direction="vertical" size={6}>
                          <Checkbox value="sno">S.No</Checkbox>
                          <Checkbox value="name">Product</Checkbox>
                          <Checkbox value="code">Code</Checkbox>
                          <Checkbox value="image">Image</Checkbox>
                          <Checkbox value="unit">Qty</Checkbox>
                          <Checkbox value="mrp">MRP</Checkbox>
                          <Checkbox value="unitPrice">Unit Price</Checkbox>
                          <Checkbox value="discount">Discount</Checkbox>
                          <Checkbox value="total">Total</Checkbox>
                        </Space>
                      </Checkbox.Group>

                      <Divider style={{ margin: "10px 0" }} />

                      <div style={{ fontWeight: 600, marginBottom: 10 }}>
                        Include Sections
                      </div>
                      <Space direction="vertical" size={6}>
                        <Checkbox
                          checked={includeProductListPage}
                          onChange={(e) =>
                            setIncludeProductListPage(e.target.checked)
                          }
                        >
                          Product List Page
                        </Checkbox>
                        <Checkbox
                          checked={includeRoomWiseSummaryPage}
                          onChange={(e) =>
                            setIncludeRoomWiseSummaryPage(e.target.checked)
                          }
                        >
                          Room-wise Summary Page
                        </Checkbox>
                        <Checkbox
                          checked={includeRoomTotals}
                          onChange={(e) =>
                            setIncludeRoomTotals(e.target.checked)
                          }
                        >
                          Room Totals
                        </Checkbox>
                        <Checkbox
                          checked={includeSummaryPage}
                          onChange={(e) =>
                            setIncludeSummaryPage(e.target.checked)
                          }
                        >
                          Summary Page
                        </Checkbox>
                      </Space>

                      <Divider style={{ margin: "10px 0" }} />

                      <Button
                        type="link"
                        block
                        onClick={() => {
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
                          });
                          setIncludeProductListPage(true);
                          setIncludeRoomWiseSummaryPage(true);
                          setIncludeRoomTotals(true);
                          setIncludeSummaryPage(true);
                        }}
                      >
                        Reset Default
                      </Button>
                    </div>
                  )}
                >
                  <Button size="middle" icon={<SettingOutlined />}>
                    Columns
                  </Button>
                </Dropdown>

                {/* Export Format */}
                <Select
                  value={exportFormat}
                  onChange={setExportFormat}
                  style={{ width: 150 }}
                  disabled={isExporting}
                  options={[
                    { value: "pdf", label: "PDF Export" },
                    { value: "excel", label: "Excel Export" },
                  ]}
                />

                {/* Export Button */}
                <Button
                  type="primary"
                  loading={isExporting}
                  onClick={handleExport}
                  icon={
                    exportFormat === "pdf" ? (
                      <FilePdfFilled />
                    ) : (
                      <FileExcelFilled />
                    )
                  }
                  style={{
                    background: "#1677ff",
                    borderRadius: 8,
                  }}
                >
                  Export
                </Button>

                {/* Back */}
                <Button
                  onClick={() => navigate("/quotations/list")}
                  icon={<ArrowLeftOutlined />}
                >
                  Back
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
            <div className={styles.printArea}>
              {renderPages({
                shouldShowColumn: () => true,
                includeProductList: includeProductListPage,
                includeSummary: includeSummaryPage,
                includeRoomWiseSummary: includeRoomWiseSummaryPage,
                includeRoomTotals,
              })}
            </div>
          </div>

          {/* Hidden Export Container */}
          <div
            ref={quotationRef}
            style={{ position: "absolute", left: "-9999px", top: 0 }}
          >
            {isExporting && (
              <div className={styles.printArea}>
                {renderPages({
                  shouldShowColumn: (col) => visibleColumns[col] ?? true,
                  includeProductList: includeProductListPage,
                  includeSummary: includeSummaryPage,
                  includeRoomWiseSummary: includeRoomWiseSummaryPage,
                  includeRoomTotals,
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NewQuotationsDetails;
