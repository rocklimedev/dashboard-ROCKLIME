// src/pages/site-map/NewSiteMapDetails.jsx

import React, { useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { message, Button, Spin, Typography, Space } from "antd";
import { ArrowLeftOutlined, FilePdfOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";
import { useGetSiteMapByIdQuery } from "../../api/siteMapApi";
import { exportToPDF } from "../../components/SiteMap/hooks/exportSiteMapPDF";
import styles from "./newsitemap.module.css";
import useProductsData from "../../data/useProductdata";
import logo from "../../assets/img/logo.png";
import bathroomSketch from "../../assets/img/sitemap_cover.jpg";

const { Title, Text } = Typography;

// ────────────────────────────────────────────────
// Number to Words (unchanged)
// ────────────────────────────────────────────────
const NumberToWords = (num) => {
  if (!num || num === 0) return "Zero Rupees Only";
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

  const belowHundred = (n) =>
    n < 20
      ? ones[n]
      : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");

  let str = "";
  if (Math.floor(num / 10000000) > 0) {
    str += NumberToWords(Math.floor(num / 10000000)) + "Crore ";
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    str += NumberToWords(Math.floor(num / 100000)) + "Lakh ";
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    str += NumberToWords(Math.floor(num / 1000)) + "Thousand ";
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    str += ones[Math.floor(num / 100)] + "Hundred ";
    num %= 100;
  }
  if (num > 0) str += belowHundred(num);
  return (str.trim() || "Zero") + " Rupees Only";
};

// ────────────────────────────────────────────────
// Category + Display helpers (unchanged)
// ────────────────────────────────────────────────
const getAreaCategory = (name = "") => {
  const n = name.toLowerCase();
  if (/shower|rain|head|overhead|hand ?shower|divertor/i.test(n))
    return "shower";
  if (/basin|mixer|faucet|tap|towel|vanity/i.test(n)) return "basin";
  if (/wc|toilet|flush|health ?faucet|jet ?spray/i.test(n)) return "wc";
  return "other";
};

const getDisplayData = (item, fullProduct) => {
  if (!fullProduct) {
    return {
      name: item.name || "—",
      code: "N/A",
      price: Number(item.price) || 0,
      image: item.imageUrl || "/placeholder.jpg",
    };
  }

  const code =
    fullProduct.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] ||
    fullProduct.metaDetails?.find((m) => m.slug === "companyCode")?.value ||
    fullProduct.product_code ||
    "N/A";

  const rawPrice =
    fullProduct.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
    fullProduct.metaDetails?.find((m) => m.slug === "sellingPrice")?.value ||
    fullProduct.price;

  const price = Number(rawPrice);
  const safePrice = Number.isFinite(price) ? price : 0;

  const image =
    fullProduct.images?.[0]?.url ||
    fullProduct.images?.[0] ||
    item.imageUrl ||
    "/placeholder.jpg";

  return {
    name: fullProduct.name || item.name || "—",
    code,
    price: safePrice,
    image,
  };
};

const ImageWithFallback = ({ src, alt, ...props }) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  React.useEffect(() => setImgSrc(src), [src]);
  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      onError={() =>
        imgSrc !== "/placeholder.jpg" && setImgSrc("/placeholder.jpg")
      }
      {...props}
    />
  );
};

// ────────────────────────────────────────────────
// Main Component – Single render + media queries
// ────────────────────────────────────────────────
const NewSiteMapDetails = () => {
  const { id } = useParams();
  const printContainerRef = useRef(null);

  const { data: response, isLoading: loadingSiteMap } =
    useGetSiteMapByIdQuery(id);
  const siteMap = response?.data || null;
  const customer = siteMap?.Customer || {};

  const { productsData, loading: loadingProducts } = useProductsData(
    siteMap?.items || [],
  );

  const productMap = useMemo(() => {
    const map = {};
    productsData.forEach((p) => {
      if (p.productId) map[p.productId] = p;
    });
    return map;
  }, [productsData]);

  const floorNameMap = useMemo(() => {
    const map = {};
    (siteMap?.floorDetails || []).forEach((f) => {
      map[f.floor_number] = f.floor_name || `Floor ${f.floor_number}`;
    });
    return map;
  }, [siteMap?.floorDetails]);

  const roomNameMap = useMemo(() => {
    const map = {};
    siteMap?.floorDetails?.forEach((floor) => {
      floor.rooms?.forEach((r) => {
        map[r.room_id] = r.room_name || "Area";
      });
    });
    return map;
  }, [siteMap?.floorDetails]);

  const { pages, grandTotal, floorTotals } = useMemo(() => {
    if (!siteMap?.items?.length)
      return { pages: [], grandTotal: 0, floorTotals: {} };

    const floorData = {};
    let grandTotal = 0;
    const floorTotals = {};

    siteMap.items.forEach((item) => {
      const floorNum = item.floor_number || 1;
      const floorName = floorNameMap[floorNum] || `Floor ${floorNum}`;
      const roomName = roomNameMap[item.room_id] || "Common Area";

      if (!floorData[floorNum]) {
        floorData[floorNum] = { name: floorName, rooms: {}, total: 0 };
      }

      const floor = floorData[floorNum];
      if (!floor.rooms[roomName]) floor.rooms[roomName] = [];

      const full = productMap[item.productId];
      const disp = getDisplayData(item, full);

      const enriched = {
        ...item,
        displayName: disp.name,
        displayCode: disp.code,
        displayPrice: disp.price,
        displayImage: disp.image,
        quantity: item.quantity || 1,
        category: getAreaCategory(disp.name || item.name),
      };

      floor.rooms[roomName].push(enriched);
      floor.total += disp.price * enriched.quantity;
      grandTotal += disp.price * enriched.quantity;
    });

    const pages = [];

    Object.keys(floorData)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((floorNum) => {
        const floor = floorData[floorNum];
        floorTotals[floor.name] = floor.total;

        Object.entries(floor.rooms).forEach(([roomName, items]) => {
          items.sort((a, b) => {
            const order = { shower: 1, basin: 2, wc: 3, other: 4 };
            return (order[a.category] || 5) - (order[b.category] || 5);
          });

          const callouts = items.map((it, idx) => ({
            ...it,
            calloutNumber: idx + 1,
          }));

          pages.push({
            type: "room",
            floorName: floor.name,
            roomName,
            callouts,
            roomTotal: items.reduce(
              (sum, i) => sum + i.displayPrice * i.quantity,
              0,
            ),
            pageKey: `room_${floorNum}_${roomName.replace(/\s+/g, "_")}`,
          });
        });
      });

    const allConcealed = siteMap.items
      .filter((i) => i.isConcealed || i.productType === "Concealed Works")
      .map((i) => {
        const disp = getDisplayData(i, productMap[i.productId]);
        return { ...i, ...disp, quantity: i.quantity || 1 };
      });

    if (allConcealed.length > 0) {
      pages.push({
        type: "concealed",
        title: "CONCEALED WORKS – ENTIRE PROJECT",
        items: allConcealed,
        pageKey: "concealed_all",
      });
    }

    return { pages, grandTotal, floorTotals };
  }, [siteMap?.items, productMap, floorNameMap, roomNameMap]);

  const getBaseIllustration = () => bathroomSketch;

  const handleExportPDF = async () => {
    if (!printContainerRef.current) {
      message.error("Content not ready for export");
      return;
    }
    try {
      const safeTitle = (siteMap?.title || "Site-Map").replace(
        /[\\/:*?"<>|]/g,
        "_",
      );
      await exportToPDF(printContainerRef, siteMap, `${safeTitle}.pdf`);
      message.success("Site Map exported successfully!");
    } catch (err) {
      console.error(err);
      message.error("Export failed");
    }
  };

  if (loadingSiteMap || loadingProducts) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <p className="mt-3">Preparing site map...</p>
      </div>
    );
  }

  if (!siteMap) {
    return <div className="text-center py-5">Site map not found</div>;
  }

  const pageTitle = siteMap?.title
    ? `Site Map - ${siteMap.title}`
    : `Site Map - ${id}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className="page-wrapper">
        <div className="content">
          {/* ─── Screen-only top bar ─── */}
          <div className={styles.screenHeader}>
            <div className={styles.headerInner}>
              <div>
                <Title level={2} style={{ margin: 0, color: "#c8102e" }}>
                  Site Map
                </Title>
                <Text type="secondary">
                  {customer.name || "Client"} •{" "}
                  {siteMap.siteSizeInBHK || "— sq.ft."} • {id}
                </Text>
              </div>

              <Space size="middle">
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  style={{ background: "#c8102e", borderColor: "#c8102e" }}
                >
                  Export to PDF
                </Button>
                <Button icon={<ArrowLeftOutlined />}>
                  <Link to="/site-map/list">Back to List</Link>
                </Button>
              </Space>
            </div>
          </div>

          {/* ─── The ONLY place where quotation pages are rendered ─── */}
          <div ref={printContainerRef} className={styles.printContainer}>
            {pages.map((page) => (
              <div
                key={page.pageKey}
                className={`${styles.quotationPage} quotation-page-print`} // ← add this
              >
                {/* ─── Centered logo at top of EVERY page ─── */}
                <div className={styles.logoContainer}>
                  <img
                    src={logo}
                    alt="Chhabra Marble Logo"
                    className={styles.centeredLogo}
                  />
                </div>
                {page.type === "room" ? (
                  <>
                    <div className={styles.roomHeader}>
                      <div className={styles.customerInfo}>
                        <strong style={{ color: "#c8102e" }}>
                          Mr. {customer.name || "Ajay Chhabra"}
                        </strong>
                        <br />
                        {customer.address ||
                          "487/65, National Market, Peera Garhi, Delhi, 110087"}
                        <br />
                        <span style={{ color: "#c8102e" }}>
                          {siteMap.siteSizeInBHK || "2000 sq.ft."}
                        </span>
                      </div>
                    </div>

                    <div className={styles.illustrationContainer}>
                      <img
                        src={getBaseIllustration()}
                        alt={`${page.roomName} layout sketch`}
                        className={styles.mainIllustration}
                      />

                      {page.callouts.map((item, idx) => {
                        // Different default positions for screen vs print (CSS will override)
                        let pos = { top: "50%", left: "50%" };
                        if (item.category === "wc" && "toliet")
                          pos = { top: "63%", left: "5%" };
                        if (item.category === "basin")
                          pos = { top: "35%", left: "32%" };
                        if (item.category === "shower")
                          pos = { top: "50%", left: "82%" };

                        const offsetTop = idx * 5.5;
                        const offsetLeft = idx * 4.5;

                        return (
                          <div
                            key={`dot-${item.productId || idx}`}
                            className={styles.redDot}
                            style={{
                              top: `calc(${pos.top} + ${offsetTop}%)`,
                              left: `calc(${pos.left} + ${offsetLeft}%)`,
                            }}
                          />
                        );
                      })}
                    </div>

                    <div className={styles.productGrid}>
                      <h1 className={styles.roomTitle}>
                        {page.floorName.toUpperCase()} –{" "}
                        {page.roomName.toUpperCase()}
                      </h1>

                      <div className={styles.productTableContainer}>
                        <table className={styles.productTable}>
                          <tbody>
                            {Array(Math.ceil(page.callouts.length / 4))
                              .fill()
                              .map((_, rowIndex) => (
                                <tr key={rowIndex}>
                                  {Array(4)
                                    .fill()
                                    .map((_, colIndex) => {
                                      const idx = rowIndex * 4 + colIndex;
                                      const item = page.callouts[idx];
                                      if (!item)
                                        return (
                                          <td
                                            key={colIndex}
                                            className={styles.emptyCell}
                                          />
                                        );
                                      return (
                                        <td
                                          key={colIndex}
                                          className={styles.productCell}
                                        >
                                          <div
                                            className={styles.cellIconWrapper}
                                          >
                                            <ImageWithFallback
                                              src={item.displayImage}
                                              alt={item.displayName}
                                              className={styles.cellIcon}
                                            />
                                          </div>
                                          <div className={styles.cellText}>
                                            <div className={styles.cellName}>
                                              {item.displayName}
                                              {item.quantity > 1 &&
                                                ` × ${item.quantity}`}
                                            </div>
                                            <div
                                              className={styles.cellCodePrice}
                                            >
                                              {item.displayCode || "N/A"} ₹
                                              {item.displayPrice.toLocaleString(
                                                "en-IN",
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                      );
                                    })}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className={styles.roomTotal}>
                      <strong>
                        Room Total: ₹
                        {Number(page.roomTotal).toLocaleString("en-IN") || 0}
                      </strong>
                    </div>
                  </>
                ) : (
                  <div className={styles.concealedSection}>
                    <h1 className={styles.title}>{page.title}</h1>
                    <div className={styles.concealedGrid}>
                      {page.items.map((item, i) => (
                        <div key={i} className={styles.concealedItem}>
                          <ImageWithFallback
                            src={item.displayImage}
                            alt={item.displayName}
                          />
                          <div>
                            <strong>{item.displayName}</strong>
                            <br />
                            Code: {item.displayCode} • ₹
                            {Number(item.displayPrice).toLocaleString(
                              "en-IN",
                            ) || 0}
                            {item.quantity > 1 && ` × ${item.quantity}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Summary Page */}
            <div
              className={`${styles.quotationPage} ${styles.summaryPage} quotation-page-print`}
            >
              <h1 className={styles.projectSummaryTitle}>PROJECT SUMMARY</h1>
              <table className={styles.summaryTable}>
                <thead>
                  <tr>
                    <th>Floor / Area</th>
                    <th>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(floorTotals).map(([name, amt]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{Number(amt).toLocaleString("en-IN") || 0}</td>
                    </tr>
                  ))}
                  <tr className={styles.grandTotal}>
                    <td>
                      <strong>GRAND TOTAL</strong>
                    </td>
                    <td>
                      <strong>
                        ₹ {Number(grandTotal).toLocaleString("en-IN") || 0}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className={styles.inWords}>
                <strong>In Words:</strong> {NumberToWords(grandTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewSiteMapDetails;
