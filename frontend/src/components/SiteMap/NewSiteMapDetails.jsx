import React, { useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { message, Button, Spin } from "antd";
import { useGetSiteMapByIdQuery } from "../../api/siteMapApi";
import logo from "../../assets/img/logo-quotation.png";
import { exportToPDF } from "./hooks/exportSiteMapPDF";
import styles from "./newsitemap.module.css";
import useProductsData from "../../data/useProductdata";
import coverImage from "../../assets/img/quotation_first_page.png";

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

  // Main data processing — grouped by floor, then classified into 3 areas
  // Add this inside your NewSiteMapDetails component, replace the old pages useMemo

  const { pages, grandTotal, floorTotals } = useMemo(() => {
    if (!siteMap?.items?.length) {
      return { pages: [], grandTotal: 0, floorTotals: {} };
    }

    const floorData = {};
    let grandTotal = 0;

    // First: Group items by floor → room → area
    siteMap.items.forEach((item) => {
      const floorNum = item.floor_number || 1;
      const floorName = floorNameMap[floorNum] || `Floor ${floorNum}`;
      const roomId = item.room_id;
      const roomName = roomMap[roomId] || "Common Area";

      if (!floorData[floorNum]) {
        floorData[floorNum] = {
          name: floorName,
          rooms: new Set(),
          roomItems: {}, // roomName → { shower: [], basin: [], wc: [] }
          total: 0,
        };
      }

      const roomGroup = floorData[floorNum];
      roomGroup.rooms.add(roomName);

      if (!roomGroup.roomItems[roomName]) {
        roomGroup.roomItems[roomName] = { shower: [], basin: [], wc: [] };
      }

      const fullProduct = productMap[item.productId];
      const display = getDisplayData(item, fullProduct);
      const area = getAreaCategory(display.name || item.name);
      const qty = item.quantity || 1;
      const itemTotal = display.price * qty;

      roomGroup.roomItems[roomName][area].push({
        ...item,
        displayName: display.name,
        displayCode: display.code,
        displayPrice: display.price,
        displayImage: display.image,
        quantity: qty,
        roomName,
      });

      roomGroup.total += itemTotal;
      grandTotal += itemTotal;
    });

    const pages = [];
    const floorTotals = {};

    Object.keys(floorData)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((floorNum) => {
        const floor = floorData[floorNum];
        floorTotals[floor.name] = floor.total;

        // Get unique room names in logical order (you can customize priority if needed)
        const roomNames = Array.from(floor.rooms);

        // Assign rooms to 3 columns intelligently
        // Priority: Try to put one toilet/bathroom per column
        const columns = [
          { title: "", items: { shower: [], basin: [], wc: [] } },
          { title: "", items: { shower: [], basin: [], wc: [] } },
          { title: "", items: { shower: [], basin: [], wc: [] } },
        ];

        roomNames.forEach((roomName, idx) => {
          const colIndex = idx % 3;
          columns[colIndex].title = roomName.toUpperCase();
          const roomProducts = floor.roomItems[roomName];
          columns[colIndex].items.shower.push(...roomProducts.shower);
          columns[colIndex].items.basin.push(...roomProducts.basin);
          columns[colIndex].items.wc.push(...roomProducts.wc);
        });

        // Fill empty columns with "NOT APPLICABLE" if needed
        columns.forEach((col) => {
          if (!col.title) col.title = "NOT APPLICABLE";
        });

        // Now create pages (15 items total per page max)
        const allColumnItems = columns.flatMap((col) =>
          [...col.items.shower, ...col.items.basin, ...col.items.wc].map(
            (item) => ({
              ...item,
              columnRoom: col.title,
            })
          )
        );

        const ITEMS_PER_PAGE = 15;
        const chunks = [];
        for (let i = 0; i < allColumnItems.length; i += ITEMS_PER_PAGE) {
          chunks.push(allColumnItems.slice(i, i + ITEMS_PER_PAGE));
        }

        chunks.forEach((chunk, idx) => {
          const pageNum = idx + 1;
          const totalPages = chunks.length;

          // Rebuild column structure for this page chunk
          const pageColumns = columns.map((col) => ({
            title: col.title,
            items: chunk.filter((item) => item.columnRoom === col.title),
          }));

          pages.push({
            title: `SITE MAP - ${floor.name.toUpperCase()}`,
            pageInfo:
              totalPages > 1 ? `Page ${pageNum} of ${totalPages}` : null,
            columns: pageColumns,
            floorTotal: floor.total,
            pageKey: `floor_${floorNum}_page_${pageNum}`,
          });
        });
      });

    return { pages, grandTotal, floorTotals };
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
                      <header className={styles.header}>
                        <h1 className={styles.title}>{page.title}</h1>
                        {page.pageInfo && (
                          <div className={styles.pageInfo}>{page.pageInfo}</div>
                        )}
                        <div className={styles.redLineShort}></div>
                      </header>

                      {/* Dynamic Room Headers */}
                      <div className={styles.labelsRow}>
                        {page.columns.map((col, i) => (
                          <div
                            key={i}
                            className={
                              col.title.includes("NOT APPLICABLE")
                                ? styles.labelEmpty
                                : styles.labelShower // reuse style, or make new ones
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
                                    height: "120px",
                                    objectFit: "contain",
                                  }}
                                />
                                <p className={styles.code}>
                                  Code: {item.displayCode} ₹
                                  {item.displayPrice.toLocaleString("en-IN")}
                                  {item.quantity > 1 && ` × ${item.quantity}`}
                                </p>
                                <p className={styles.name}>
                                  {item.displayName}
                                </p>
                              </div>
                            ))}
                            {/* Optional: show empty state */}
                            {col.items.length === 0 &&
                              col.title !== "NOT APPLICABLE" && (
                                <div className={styles.emptyColumnNote}>
                                  No fittings selected
                                </div>
                              )}
                          </div>
                        ))}
                      </div>

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
