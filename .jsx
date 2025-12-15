import React, { useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  message,
  Button,
  Spin,
  Table,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Empty,
} from "antd";
import { useGetSiteMapByIdQuery } from "../../api/siteMapApi";
import logo from "../../assets/img/logo-quotation.png";
import { exportToPDF } from "./hooks/exportSiteMapPDF";
import useProductsData from "../../data/useProductdata";
import styles from "./newsitemap.module.css"; // Keep your custom CSS for print/PDF layout

const { Title, Text } = Typography;

// Indian Number to Words (unchanged)
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

// Smart area classification (unchanged)
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
  return "basin";
};

// Extract product display data (unchanged)
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

// Image with fallback (now using Antd Card)
const ProductCard = ({ item }) => (
  <Card
    hoverable
    cover={
      <img
        alt={item.displayName}
        src={item.displayImage || "/placeholder.jpg"}
        style={{ height: 120, objectFit: "contain", background: "#f8f8f8" }}
        onError={(e) => {
          e.target.src = "/placeholder.jpg";
        }}
      />
    }
    bodyStyle={{ padding: "12px", textAlign: "center" }}
  >
    <Text strong style={{ color: "#e30613", fontSize: "12px" }}>
      Code: {item.displayCode} ₹{item.displayPrice.toLocaleString("en-IN")}
      {item.quantity > 1 && ` × ${item.quantity}`}
    </Text>
    <br />
    <Text style={{ fontSize: "13px", display: "block", marginTop: "8px" }}>
      {item.displayName}
    </Text>
    {item.floorName && item.roomName && (
      <Text
        type="secondary"
        style={{ fontSize: "12px", display: "block", marginTop: "8px" }}
      >
        <strong>Floor:</strong> {item.floorName}
        <br />
        <strong>Room:</strong> {item.roomName}
      </Text>
    )}
  </Card>
);

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
      <Spin
        tip="Loading site map..."
        style={{ display: "block", margin: "100px auto" }}
      />
    );
  }

  if (!siteMap)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Site map not found
      </div>
    );

  const summaryColumns = [
    { title: "PARTICULARS", dataIndex: "name", key: "name" },
    { title: "AMOUNT (₹)", dataIndex: "amount", key: "amount", align: "right" },
  ];

  const summaryData = [
    ...Object.entries(floorTotals).map(([name, amt]) => ({
      key: name,
      name: name.toUpperCase(),
      amount: amt.toLocaleString("en-IN"),
    })),
    {
      key: "grand",
      name: <strong>GRAND TOTAL</strong>,
      amount: <strong>₹ {grandTotal.toLocaleString("en-IN")}</strong>,
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f0f2f5" }}>
      <Row justify="center">
        <Col xs={24} lg={20} xl={16}>
          <Link to="/site-map/list">← Back</Link>

          <Card style={{ marginTop: "16px" }}>
            <Row justify="end" style={{ marginBottom: "24px" }}>
              <Button type="primary" size="large" onClick={handleExportPDF}>
                Export SiteMap PDF
              </Button>
            </Row>

            <div ref={siteMapRef} className={styles.printArea}>
              {/* COVER PAGE – using Antd for screen, custom CSS for print */}
              <div className={styles.coverPage}>
                <div className={styles.logoCenter}>
                  <img src={logo} alt="Logo" className={styles.mainLogo} />
                  <Title level={1} style={{ color: "#e30613" }}>
                    SITE MAP
                  </Title>
                  <Text strong>M/s :</Text>{" "}
                  <Text>{customer.name || "________________________"}</Text>
                  <br />
                  <Text strong>Address :</Text>{" "}
                  <Text>{customer.address || "________________________"}</Text>
                  <br />
                  {siteMap.siteSizeInBHK && (
                    <>
                      <Text strong>Project :</Text>{" "}
                      <Text>{siteMap.siteSizeInBHK} BHK</Text>
                    </>
                  )}
                </div>
                <div className={styles.coverFooter}>
                  <div className={styles.redLineLong} />
                  <div className={styles.brandLogos}>
                    <img src={logo} alt="Logo" />
                  </div>
                </div>
              </div>

              {/* FLOOR & CONCEALED PAGES */}
              {pages.map((page) => (
                <div key={page.pageKey} className={styles.mockupPage}>
                  <Title
                    level={2}
                    style={{ color: "#e30613", textAlign: "center" }}
                  >
                    {!page.isConcealedPage
                      ? page.title
                      : "CONCEALED WORKS – COMPLETE PROJECT"}
                  </Title>
                  <Divider style={{ background: "#e30613" }} />

                  {!page.isConcealedPage ? (
                    <>
                      <Row
                        gutter={[16, 16]}
                        justify="center"
                        style={{ marginBottom: "24px" }}
                      >
                        {page.columns.map((col, i) => (
                          <Col key={i} span={8}>
                            <Title
                              level={3}
                              style={{
                                color: col.title.includes("NOT")
                                  ? "#ccc"
                                  : "#e30613",
                                textAlign: "center",
                              }}
                            >
                              {col.title}
                            </Title>
                          </Col>
                        ))}
                      </Row>

                      <Row gutter={[24, 24]}>
                        {page.columns.map((col, colIdx) => (
                          <Col key={colIdx} span={8}>
                            {col.items.length > 0 ? (
                              <Row gutter={[16, 24]}>
                                {col.items.map((item) => (
                                  <Col
                                    key={item.productId + item.roomName}
                                    span={24}
                                  >
                                    <ProductCard item={item} />
                                  </Col>
                                ))}
                              </Row>
                            ) : col.title !== "NOT APPLICABLE" ? (
                              <Empty description="No fittings selected" />
                            ) : null}
                          </Col>
                        ))}
                      </Row>
                    </>
                  ) : (
                    <Row gutter={[24, 32]} justify="center">
                      {page.concealedItems.length > 0 ? (
                        page.concealedItems.map((item, idx) => (
                          <Col key={idx} xs={24} sm={12} md={8} lg={6}>
                            <ProductCard item={item} />
                          </Col>
                        ))
                      ) : (
                        <Empty description="No concealed works in this project" />
                      )}
                    </Row>
                  )}

                  <div className={styles.footer}>
                    <div className={styles.redLineLong} />
                    <div className={styles.brandLogos}>
                      <img src={logo} alt="Logo" className={styles.mainLogo} />
                    </div>
                  </div>
                </div>
              ))}

              {/* SUMMARY PAGE */}
              <div className={styles.thankYouPage}>
                <Title level={1}>Summary</Title>
                <Table
                  columns={summaryColumns}
                  dataSource={summaryData}
                  pagination={false}
                  bordered
                  style={{ maxWidth: "800px", margin: "40px auto" }}
                />
                <Text
                  style={{
                    display: "block",
                    textAlign: "center",
                    fontSize: "18px",
                    marginTop: "40px",
                  }}
                >
                  <strong>Amount in Words:</strong> {NumberToWords(grandTotal)}
                </Text>
                <div className={styles.footer}>
                  <div className={styles.redLineLong} />
                  <div className={styles.brandLogos}>
                    <img src={logo} alt="Logo" />
                  </div>
                </div>
              </div>

              {/* THANK YOU PAGE */}
              <div className={styles.thankYouPage}>
                <Title level={1} style={{ fontSize: "90px", color: "#e30613" }}>
                  THANK YOU
                </Title>
                <div className={styles.footer}>
                  <div className={styles.redLineLong} />
                  <div className={styles.brandLogos}>
                    <img src={logo} alt="Logo" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NewSiteMapDetails;
