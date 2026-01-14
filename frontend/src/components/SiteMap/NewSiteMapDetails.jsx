import React, { useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { message, Button, Spin } from "antd";
import { useGetSiteMapByIdQuery } from "../../api/siteMapApi";
import logo from "../../assets/img/logo-quotation.png";
import { exportToPDF } from "./hooks/exportSiteMapPDF";
import styles from "./newsitemap.module.css";
import useProductsData from "../../data/useProductdata";
import coverImage from "../../assets/img/quotation_first_page.jpeg";

// Indian Number to Words (unchanged)
const NumberToWords = (num) => {
  // ... your existing function (keep as-is)
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

// Smart area classification
const getAreaCategory = (name = "") => {
  const n = name.toLowerCase();
  if (
    /shower|head|rain|overhead|ceiling|hand ?shower|divertor|hose|rain shower/i.test(
      n
    )
  )
    return "shower";
  if (
    /basin|mixer|faucet|pillar cock|tap|towel|ring|holder|waste|bottle trap/i.test(
      n
    )
  )
    return "basin";
  if (
    /wc|toilet|flush|health faucet|jet spray|european wc|cistern|urinal/i.test(
      n
    )
  )
    return "wc";
  return "basin"; // fallback
};

// Extract product display data
const getDisplayData = (item, fullProduct) => {
  if (!fullProduct) {
    return {
      name: item.name || "Unknown",
      code: "N/A",
      price: item.price || 0,
      image: item.imageUrl || "/placeholder.jpg",
    };
  }

  const code =
    fullProduct.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] ||
    fullProduct.metaDetails?.find((m) => m.slug === "companyCode")?.value ||
    fullProduct.product_code ||
    "N/A";

  const price = Number(
    fullProduct.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] ||
      fullProduct.metaDetails?.find((m) => m.slug === "sellingPrice")?.value ||
      fullProduct.price ||
      0
  );

  const image =
    fullProduct.images?.[0]?.url ||
    fullProduct.images?.[0] ||
    item.imageUrl ||
    "/placeholder.jpg";

  return { name: fullProduct.name || item.name, code, price, image };
};

// Image with fallback
const ImageWithFallback = ({ src, alt, ...props }) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  React.useEffect(() => setImgSrc(src), [src]);

  return (
    <img
      src={imgSrc || "/placeholder.jpg"}
      alt={alt}
      loading="lazy"
      onError={() =>
        imgSrc !== "/placeholder.jpg" && setImgSrc("/placeholder.jpg")
      }
      {...props}
    />
  );
};

const NewSiteMapDetails = () => {
  const { id } = useParams();
  const siteMapRef = useRef(null);
  const { data: response, isLoading: loadingSiteMap } =
    useGetSiteMapByIdQuery(id);

  const siteMap = response?.data || null;
  const customer = siteMap?.Customer || {};

  const { productsData, loading: loadingProducts } = useProductsData(
    siteMap?.items || []
  );

  // Maps
  const productMap = useMemo(() => {
    const map = {};
    productsData.forEach((p) => p.productId && (map[p.productId] = p));
    return map;
  }, [productsData]);

  const floorNameMap = useMemo(() => {
    const map = {};
    (siteMap?.floorDetails || []).forEach((f) => {
      map[f.floor_number] = f.floor_name || `Floor ${f.floor_number}`;
    });
    return map;
  }, [siteMap?.floorDetails]);

  const roomMap = useMemo(() => {
    const map = {};
    siteMap?.floorDetails?.forEach((floor) => {
      floor.rooms?.forEach((room) => {
        map[room.room_id] = room.room_name || "Common Area";
      });
    });
    return map;
  }, [siteMap?.floorDetails]);

  const { pages, grandTotal, floorTotals, allConcealedItems } = useMemo(() => {
    if (!siteMap?.items?.length) {
      return {
        pages: [],
        grandTotal: 0,
        floorTotals: {},
        allConcealedItems: [],
      };
    }

    const floorData = {};
    const allConcealedItems = []; // ← collect all concealed here
    let grandTotal = 0;

    siteMap.items.forEach((item) => {
      const floorNum = item.floor_number || 1;
      const floorName = floorNameMap[floorNum] || `Floor ${floorNum}`;
      const roomId = item.room_id;
      const roomName = roomMap[roomId] || "Common Area";

      if (!floorData[floorNum]) {
        floorData[floorNum] = {
          name: floorName,
          rooms: new Set(),
          roomItems: {}, // only visible items
          total: 0,
        };
      }

      const floor = floorData[floorNum];
      floor.rooms.add(roomName);

      const fullProduct = productMap[item.productId];
      const display = getDisplayData(item, fullProduct);
      const qty = item.quantity || 1;
      const itemTotal = display.price * qty;

      const baseItem = {
        ...item,
        displayName: display.name,
        displayCode: display.code,
        displayPrice: display.price,
        displayImage: display.image,
        quantity: qty,
        roomName,
        floorName, // ← useful for concealed page
      };

      // Separate concealed items
      if (item.productType === "Concealed Works" || item.isConcealed) {
        allConcealedItems.push(baseItem);
      } else {
        // Normal visible fittings
        const area = getAreaCategory(display.name || item.name);
        if (!floor.roomItems[roomName]) {
          floor.roomItems[roomName] = { shower: [], basin: [], wc: [] };
        }
        floor.roomItems[roomName][area].push(baseItem);
      }

      // Always add to floor total (visible or concealed)
      floor.total += itemTotal;
      grandTotal += itemTotal;
    });

    const pages = [];
    const floorTotals = {};

    // Build normal floor pages (only visible items)
    Object.keys(floorData)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((floorNum) => {
        const floor = floorData[floorNum];
        floorTotals[floor.name] = floor.total;

        const roomNames = Array.from(floor.rooms);

        const columns = [
          { title: "", items: [] },
          { title: "", items: [] },
          { title: "", items: [] },
        ];

        roomNames.forEach((roomName, idx) => {
          const colIdx = idx % 3;
          columns[colIdx].title = roomName.toUpperCase();

          const roomProducts = floor.roomItems[roomName] || {
            shower: [],
            basin: [],
            wc: [],
          };
          const all = [
            ...roomProducts.shower,
            ...roomProducts.basin,
            ...roomProducts.wc,
          ].map((it) => ({ ...it, columnRoom: columns[colIdx].title }));

          columns[colIdx].items.push(...all);
        });

        columns.forEach((col) => {
          if (!col.title) col.title = "NOT APPLICABLE";
        });

        const allVisible = columns.flatMap((c) => c.items);
        const ITEMS_PER_PAGE = 15;
        const chunks = [];
        for (let i = 0; i < allVisible.length; i += ITEMS_PER_PAGE) {
          chunks.push(allVisible.slice(i, i + ITEMS_PER_PAGE));
        }

        chunks.forEach((chunk, idx) => {
          const pageNum = idx + 1;
          const pageColumns = columns.map((col) => ({
            title: col.title,
            items: chunk.filter((it) => it.columnRoom === col.title),
          }));

          pages.push({
            title: `SITE MAP - ${floor.name.toUpperCase()}`,
            pageInfo:
              chunks.length > 1 ? `Page ${pageNum} of ${chunks.length}` : null,
            columns: pageColumns,
            floorTotal: floor.total,
            pageKey: `floor_${floorNum}_page_${pageNum}`,
          });
        });
      });

    // ONE single concealed page at the end
    if (allConcealedItems.length > 0) {
      pages.push({
        title: "CONCEALED WORKS - COMPLETE PROJECT",
        isConcealedPage: true,
        concealedItems: allConcealedItems,
        pageKey: "all_concealed_works",
      });
    }

    return { pages, grandTotal, floorTotals, allConcealedItems };
  }, [siteMap?.items, productMap, floorNameMap, roomMap]);
  const handleExportPDF = async () => {
    if (!siteMapRef.current) return message.error("Content not ready");
    try {
      await exportToPDF(siteMapRef, siteMap);
      message.success("Site Map PDF exported successfully!");
    } catch (e) {
      console.error(e);
      message.error("Export failed");
    }
  };

  if (loadingSiteMap || loadingProducts) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <p className="mt-3">Loading site map...</p>
      </div>
    );
  }

  if (!siteMap)
    return <div className="text-center py-5">Site map not found</div>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-lg-10 mx-auto">
            <Link to="/site-map/list" className={styles.backButton}>
              Back
            </Link>

            <div className="card mt-3">
              <div className="card-body">
                <div className="text-end mb-4">
                  <Button type="primary" size="large" onClick={handleExportPDF}>
                    Export SiteMap PDF
                  </Button>
                </div>

                <div ref={siteMapRef} className={styles.printArea}>
                  {/* COVER PAGE */}
                  <div className={`${styles.coverPage} quotation-page-print`}>
                    <div className={styles.logoCenter}>
                      <img src={logo} alt="Logo" className={styles.mainLogo} />
                      <h1 className={styles.mockupBig}>SITE MAP</h1>
                      <p>
                        <strong>M/s :</strong>{" "}
                        {customer.name || "________________________"}
                      </p>
                      <p>
                        <strong>Address :</strong>{" "}
                        {customer.address || "________________________"}
                      </p>
                      {siteMap.siteSizeInBHK && (
                        <p>
                          <strong>Project :</strong> {siteMap.siteSizeInBHK} BHK
                        </p>
                      )}
                    </div>
                    <div className={styles.coverFooter}>
                      <div className={styles.redLineLong}></div>
                      <div className={styles.brandLogos}>
                        <img src={logo} alt="Logo" />
                      </div>
                    </div>
                  </div>

                  {/* FLOOR PAGES - 3 COLUMN LAYOUT PRESERVED */}
                  {pages.map((page) => (
                    <div
                      key={page.pageKey}
                      className={`${styles.mockupPage} quotation-page-print`}
                    >
                      {/* ============ NORMAL FLOOR PAGES (3-column) ============ */}
                      {!page.isConcealedPage ? (
                        <>
                          <header className={styles.header}>
                            <h1 className={styles.title}>{page.title}</h1>
                            {page.pageInfo && (
                              <div className={styles.pageInfo}>
                                {page.pageInfo}
                              </div>
                            )}
                            <div className={styles.redLineShort}></div>
                          </header>

                          <div className={styles.labelsRow}>
                            {page.columns.map((col, i) => (
                              <div
                                key={i}
                                className={
                                  col.title.includes("NOT APPLICABLE")
                                    ? styles.labelEmpty
                                    : styles.labelShower
                                }
                                style={{
                                  fontWeight: 700,
                                  color: col.title.includes("NOT")
                                    ? "#999"
                                    : "#d4380d",
                                }}
                              >
                                {col.title}
                              </div>
                            ))}
                          </div>

                          <div className={styles.grid}>
                            {page.columns.map((col, colIdx) => (
                              <div key={colIdx} className={styles.column}>
                                {col.items.map((item) => (
                                  <div
                                    key={item.productId + item.roomName}
                                    className={styles.productCard}
                                  >
                                    <ImageWithFallback
                                      src={item.displayImage}
                                      alt={item.displayName}
                                      style={{
                                        width: "100%",
                                        height: "90px",
                                        objectFit: "contain",
                                      }}
                                    />
                                    <p className={styles.code}>
                                      Code: {item.displayCode} ₹
                                      {item.displayPrice.toLocaleString(
                                        "en-IN"
                                      )}
                                      {item.quantity > 1 &&
                                        ` × ${item.quantity}`}
                                    </p>
                                    <p className={styles.name}>
                                      {item.displayName}
                                    </p>
                                  </div>
                                ))}
                                {col.items.length === 0 &&
                                  col.title !== "NOT APPLICABLE" && (
                                    <div className={styles.emptyColumnNote}>
                                      No fittings selected
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        /* ============ SINGLE CONCEALED WORKS PAGE – CARD STYLE ============ */
                        <>
                          <header className={styles.header}>
                            <h1 className={styles.title}>CONCEALED WORKS</h1>
                            <div className={styles.redLineShort}></div>
                          </header>

                          <div style={{ padding: "20px 40px" }}>
                            <h2
                              style={{
                                textAlign: "center",
                                color: "#d4380d",
                                fontSize: "28px",
                                margin: "20px 0 40px",
                                fontWeight: 600,
                              }}
                            >
                              CONCEALED WORKS – COMPLETE PROJECT
                            </h2>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: "20px",
                                justifyItems: "center",
                              }}
                            >
                              {page.concealedItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={styles.productCard}
                                  style={{ width: "100%", maxWidth: "320px" }}
                                >
                                  <ImageWithFallback
                                    src={
                                      item.displayImage || "/placeholder.jpg"
                                    }
                                    alt={item.displayName}
                                    style={{
                                      width: "100%",
                                      height: "110px",
                                      objectFit: "contain",
                                    }}
                                  />
                                  <p className={styles.code}>
                                    Code: {item.displayCode} ₹
                                    {item.displayPrice.toLocaleString("en-IN")}
                                    {item.quantity > 1 && ` × ${item.quantity}`}
                                  </p>
                                  <p
                                    className={styles.name}
                                    style={{ fontWeight: 600 }}
                                  >
                                    {item.displayName}
                                  </p>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "#666",
                                      marginTop: "8px",
                                      lineHeight: "1.4",
                                    }}
                                  >
                                    <strong>Floor:</strong> {item.floorName}{" "}
                                    <br />
                                    <strong>Room:</strong> {item.roomName}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {page.concealedItems.length === 0 && (
                              <p
                                style={{
                                  textAlign: "center",
                                  color: "#999",
                                  fontSize: "18px",
                                  marginTop: "50px",
                                }}
                              >
                                No concealed works in this project
                              </p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Footer on every page */}
                      <footer className={styles.footer}>
                        <div className={styles.redLineLong}></div>
                        <div className={styles.brandLogos}>
                          <img
                            src={logo}
                            alt="Logo"
                            className={styles.mainLogo}
                          />
                        </div>
                      </footer>
                    </div>
                  ))}
                  {/* SUMMARY PAGE */}
                  <div
                    className={`${styles.thankYouPage} quotation-page-print`}
                  >
                    <h1>Summary</h1>
                    <div className={styles.summary}>
                      <table>
                        <thead>
                          <tr>
                            <th>PARTICULARS</th>
                            <th>AMOUNT (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(floorTotals).map(([name, amt]) => (
                            <tr key={name}>
                              <td>{name.toUpperCase()}</td>
                              <td>{amt.toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                          <tr className={styles.grandTotalRow}>
                            <td>
                              <strong>GRAND TOTAL</strong>
                            </td>
                            <td>
                              <strong>
                                ₹ {grandTotal.toLocaleString("en-IN")}
                              </strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p className={styles.inWords}>
                        <strong>Amount in Words:</strong>{" "}
                        {NumberToWords(grandTotal)}
                      </p>
                    </div>
                    <footer className={styles.footer}>
                      <div className={styles.redLineLong}></div>
                      <div className={styles.brandLogos}>
                        <img src={logo} alt="Logo" />
                      </div>
                    </footer>
                  </div>

                  {/* THANK YOU PAGE */}
                  <div
                    className={`${styles.thankYouPage} quotation-page-print`}
                  >
                    <h1>THANK YOU</h1>
                    <footer className={styles.footer}>
                      <div className={styles.redLineLong}></div>
                      <div className={styles.brandLogos}>
                        <img src={logo} alt="Logo" />
                      </div>
                    </footer>
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

export default NewSiteMapDetails;
