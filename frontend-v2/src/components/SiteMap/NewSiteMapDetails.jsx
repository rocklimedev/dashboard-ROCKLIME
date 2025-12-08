import React, { useRef, useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { message, Button, Spin } from "antd";
import { useGetSiteMapByIdQuery } from "../../api/siteMapApi";
import logo from "../../assets/img/logo-quotation.png";
import { exportToPDF } from "./hooks/exportSiteMapPDF";
import styles from "./newsitemap.module.css";
import useProductsData from "../../data/useProductdata";

// Indian Number to Words
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

// Classify product area
const classifyArea = (name = "") => {
  const n = name.toLowerCase();
  if (
    [
      "shower",
      "head",
      "rain",
      "hand shower",
      "divertor",
      "overhead",
      "hose",
      "ceiling",
    ].some((k) => n.includes(k))
  )
    return "shower";
  if (
    [
      "basin",
      "mixer",
      "faucet",
      "pillar cock",
      "towel",
      "ring",
      "holder",
      "waste",
      "bottle trap",
      "tap",
    ].some((k) => n.includes(k))
  )
    return "basin";
  if (
    [
      "wc",
      "toilet",
      "flush plate",
      "health faucet",
      "jet spray",
      "european wc",
      "cistern",
    ].some((k) => n.includes(k))
  )
    return "wc";
  return "basin";
};

// Extract real code, price, image from full product
const getDisplayData = (item, fullProduct) => {
  if (!fullProduct) {
    return {
      code: item.code || "N/A",
      price: item.price || 0,
      image: item.imageUrl || "/placeholder.jpg",
      name: item.name || "Unknown Product",
    };
  }

  const companyCode =
    fullProduct.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] ||
    fullProduct.metaDetails?.find((m) => m.slug === "companyCode")?.value ||
    fullProduct.product_code ||
    "N/A";

  const sellingPrice = Number(
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

  return {
    code: companyCode,
    price: sellingPrice,
    image,
    name: fullProduct.name || item.name,
  };
};

// Reusable Image with Fallback — THIS FIXES THE FLICKERING
const ImageWithFallback = ({
  src,
  alt,
  fallback = "/placeholder.jpg",
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src); // Reset when src changes
  }, [src]);

  return (
    <img
      src={imgSrc || fallback}
      alt={alt}
      loading="lazy"
      {...props}
      onError={() => {
        if (imgSrc !== fallback) {
          setImgSrc(fallback);
        }
      }}
      style={{
        width: "100%",
        height: "120px",
        objectFit: "contain",
        background: "#f8f8f8",
        borderRadius: "4px",
        transition: "opacity 0.3s ease",
        opacity: imgSrc ? 1 : 0.5,
        ...props.style,
      }}
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

  const {
    productsData,
    loading: loadingProducts,
    errors,
  } = useProductsData(siteMap?.items || []);

  // Stable product map
  const productMap = useMemo(() => {
    const map = {};
    productsData.forEach((p) => {
      if (p.productId) map[p.productId] = p;
    });
    return map;
  }, [productsData]);

  // Stable floor names
  const floorDetailsMap = useMemo(() => {
    const map = {};
    (siteMap?.floorDetails || []).forEach((f) => {
      map[f.floor_number] = f.floor_name || `Floor ${f.floor_number}`;
    });
    return map;
  }, [siteMap?.floorDetails]);

  // Stable keys to prevent unnecessary re-renders
  const itemsKey = useMemo(() => {
    if (!siteMap?.items?.length) return "empty";
    return siteMap.items
      .map((i) => `${i.productId || i.id}-${i.floor_number}-${i.quantity || 1}`)
      .sort()
      .join("|");
  }, [siteMap?.items]);

  const productsKey = useMemo(() => {
    return productsData
      .map((p) => `${p.productId}-${p.price || 0}`)
      .sort()
      .join("|");
  }, [productsData]);

  const floorsKey = useMemo(() => {
    return (siteMap?.floorDetails || [])
      .map((f) => `${f.floor_number}-${f.floor_name || ""}`)
      .join("|");
  }, [siteMap?.floorDetails]);

  // Main computation — now fully stable and flicker-free
  const { mockupPages, grandTotal, floorTotals } = useMemo(() => {
    if (!siteMap?.items?.length) {
      return { mockupPages: [], grandTotal: 0, floorTotals: {} };
    }

    const grouped = {};
    let totalAmount = 0;
    let counter = 0;

    siteMap.items.forEach((item) => {
      const floorNum = item.floor_number || 1;
      const key = `floor_${floorNum}`;

      if (!grouped[key]) {
        grouped[key] = {
          name: floorDetailsMap[floorNum] || `Floor ${floorNum}`,
          shower: [],
          basin: [],
          wc: [],
          total: 0,
        };
      }

      const fullProduct = productMap[item.productId];
      const display = getDisplayData(item, fullProduct);
      const area = classifyArea(item.name || display.name);
      const qty = item.quantity || 1;
      const itemTotal = display.price * qty;

      grouped[key][area].push({
        ...item,
        area,
        quantity: qty,
        displayCode: display.code,
        displayPrice: display.price,
        displayImage: display.image,
        displayName: display.name,
        __uniqueId: `${item.productId || item.id}_${floorNum}_${counter++}`,
      });

      grouped[key].total += itemTotal;
      totalAmount += itemTotal;
    });

    const mockupPages = [];
    const floorTotals = {};

    Object.keys(grouped)
      .sort((a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1]))
      .forEach((key) => {
        const data = grouped[key];
        floorTotals[data.name] = data.total;

        const allItems = [...data.shower, ...data.basin, ...data.wc];
        const title = `SITE MAP - ${data.name.toUpperCase()}`;
        const ITEMS_PER_PAGE = 15;

        for (let i = 0; i < allItems.length; i += ITEMS_PER_PAGE) {
          const chunk = allItems.slice(i, i + ITEMS_PER_PAGE);
          const pageNum = Math.floor(i / ITEMS_PER_PAGE) + 1;
          const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

          mockupPages.push({
            title,
            pageInfo:
              totalPages > 1 ? `Page ${pageNum} of ${totalPages}` : null,
            showerItems: chunk.filter((x) => x.area === "shower").slice(0, 5),
            basinItems: chunk.filter((x) => x.area === "basin").slice(0, 5),
            wcItems: chunk.filter((x) => x.area === "wc").slice(0, 5),
            floorTotal: data.total,
            floorName: data.name,
            pageKey: `${key}_page_${pageNum}`, // Stable key
          });
        }
      });

    return { mockupPages, grandTotal: totalAmount, floorTotals };
  }, [itemsKey, productsKey, floorsKey, productMap, floorDetailsMap]);

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
        <p className="mt-3">Loading site map and products...</p>
      </div>
    );
  }

  if (!siteMap) {
    return <div className="text-center py-5">Site map not found</div>;
  }

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
                        <img
                          src={logo}
                          alt="Logo"
                          className={styles.mainLogo}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MOCKUP PAGES */}
                  {mockupPages.map((page) => (
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

                      <div className={styles.labelsRow}>
                        <div className={styles.labelShower}>SHOWER AREA</div>
                        <div className={styles.labelBasin}>BASIN AREA</div>
                        <div className={styles.labelWc}>WC AREA</div>
                      </div>

                      <div className={styles.grid}>
                        {["shower", "basin", "wc"].map((area) => (
                          <div key={area} className={styles.column}>
                            {page[`${area}Items`]?.map((item) => (
                              <div
                                key={item.__uniqueId}
                                className={styles.productCard}
                              >
                                <ImageWithFallback
                                  src={item.displayImage}
                                  alt={item.displayName}
                                  fallback="/placeholder.jpg"
                                />
                                <p className={styles.code}>
                                  Code: {item.displayCode}
                                </p>
                                <p className={styles.name}>
                                  {item.displayName}
                                </p>
                                <p className={styles.price}>
                                  ₹{item.displayPrice.toLocaleString("en-IN")}
                                  {item.quantity > 1 && ` × ${item.quantity}`}
                                </p>
                              </div>
                            ))}
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
                        <img
                          src={logo}
                          alt="Logo"
                          className={styles.mainLogo}
                        />
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
                        <img
                          src={logo}
                          alt="Logo"
                          className={styles.mainLogo}
                        />
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
