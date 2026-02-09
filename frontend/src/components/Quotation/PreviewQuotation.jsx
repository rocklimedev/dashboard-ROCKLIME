// src/components/Quotation/PreviewQuotation.jsx
import React, { useRef, useMemo } from "react";
import { Modal, Button, Typography, Tag } from "antd";
import { FilePdfFilled, CloseOutlined } from "@ant-design/icons";

import logo from "../../assets/img/logo-quotation.png";
import coverImage from "../../assets/img/quotation_first_page.jpeg";
import quotationBgImage from "../../assets/img/quotation_letterhead.jpeg";

import { exportToPDF } from "./hooks/exportHelpers";
import { calcTotals, amountInWords } from "./hooks/calcHelpers";
import styles from "./quotationnew.module.css";

const { Title, Text } = Typography;

const formatINR = (value) => {
  const num = Number(value);
  return isNaN(num)
    ? "—"
    : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PreviewQuotation = ({
  visible,
  onClose,
  cartItems = [], // now only main items (from parent)
  productsData = [],
  customer = {},
  address = {},
  quotationData = {},
  gstRate = 0, // usually 0 or passed from parent
  includeGst = false,
  itemDiscounts = {},
  itemDiscountTypes = {},
}) => {
  const previewRef = useRef(null);

  // Normalize quotation data (bridge between form & calculation)
  const normalizedQuotation = useMemo(
    () => ({
      ...quotationData,
      extraDiscount:
        quotationData.extraDiscount ?? quotationData.discountAmount ?? 0,
      extraDiscountType: (
        quotationData.extraDiscountType ??
        quotationData.discountType ??
        "percent"
      )
        .toLowerCase()
        .trim(),
    }),
    [quotationData],
  );

  const customerName = customer?.name || "Dear Client";
  const customerPhone = customer?.mobileNumber || customer?.phone || "—";
  const customerAddress =
    address?.street || address?.city
      ? `${address.street || ""}, ${address.city || ""}, ${address.state || ""} - ${address.pincode || address.postalCode || address.zip || ""}`
          .replace(/^,\s*|,*\s*$/g, "")
          .trim()
      : "—";

  const brandNames = useMemo(() => {
    const set = new Set();
    cartItems.forEach((item) => {
      const pd = productsData.find((p) => p.productId === item.productId);
      const brand =
        pd?.brandName ||
        pd?.metaDetails?.find((m) => m.title?.toLowerCase().includes("brand"))
          ?.value;
      if (brand && brand !== "N/A") set.add(brand.trim());
    });
    return set.size ? [...set].join(" / ") : "GROHE / AMERICAN STANDARD";
  }, [cartItems, productsData]);

  // ────────────────────────────────────────────────────────────────
  // Totals – using only main items (cartItems already filtered)
  // ────────────────────────────────────────────────────────────────
  const {
    subtotal = 0, // gross before any discount
    totalProductDiscount = 0, // item-level discounts sum
    extraDiscountAmt = 0, // global discount amount
    taxableValue: amountAfterDiscount = 0,
    roundOffApplied = 0,
    total: finalTotal = 0,
  } = useMemo(() => {
    const priceMap = cartItems.reduce((map, p) => {
      map[p.productId] = {
        sellingPrice: Number(p.price || p.sellingPrice || 0),
        name: p.name,
      };
      return map;
    }, {});

    let extraDiscValue = Number(normalizedQuotation.extraDiscount ?? 0);
    let extraDiscType = normalizedQuotation.extraDiscountType;

    // Normalize type
    if (["fixed", "amount", "rs", "rupees", "₹"].includes(extraDiscType)) {
      extraDiscType = "amount";
    } else {
      extraDiscType = "percent";
    }

    return calcTotals(
      cartItems,
      priceMap,
      extraDiscValue,
      extraDiscType,
      Number(quotationData?.roundOff) || 0,
      itemDiscounts,
      itemDiscountTypes,
    );
  }, [
    cartItems,
    normalizedQuotation,
    itemDiscounts,
    itemDiscountTypes,
    quotationData?.roundOff,
  ]);

  const finalAmountInWords = amountInWords(Math.round(finalTotal));

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    const safeTitle = (quotationData?.document_title || "Quotation")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .substring(0, 50);
    await exportToPDF(
      previewRef,
      "preview",
      "current",
      quotationData,
      `${safeTitle}_Preview.pdf`,
    );
  };

  const renderPages = () => {
    const pages = [];
    const itemsPerPage = 10;

    // Page 1: Cover
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

    // Page 2: Letterhead
    pages.push(
      <div key="letterhead" className={`${styles.letterheadPage} page`}>
        <img
          src={quotationBgImage}
          alt="Letterhead Background"
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
            {quotationData.reference_number || "PREVIEW"}
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

    // Product Pages
    for (let i = 0; i < cartItems.length; i += itemsPerPage) {
      const items = cartItems.slice(i, i + itemsPerPage);
      const isLastPage = i + itemsPerPage >= cartItems.length;

      pages.push(
        <div key={`product-${i}`} className={`${styles.productPage} page`}>
          <div className={styles.pageTopHeader}>
            <div>
              <div className={styles.clientName}>Mr {customerName}</div>
              <div className={styles.clientAddress}>{customerAddress}</div>
            </div>
            <div className={styles.pageDate}>
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          <table className={styles.productTable}>
            <colgroup>
              <col className={styles.sno} />
              <col className={styles.name} />
              <col className={styles.code} />
              <col className={styles.image} />
              <col className={styles.unit} />
              <col className={styles.mrp} />
              <col className={styles.discount} />
              <col className={styles.total} />
            </colgroup>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product Name</th>
                <th>Code</th>
                <th>Product Image</th>
                <th>Unit</th>
                <th>MRP</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, idx) => {
                const pd =
                  productsData.find((x) => x.productId === p.productId) || {};
                const img = p.imageUrl || pd.images?.[0] || "";
                const code =
                  p.companyCode ||
                  pd.companyCode ||
                  pd.metaDetails?.find((m) => m.slug === "companyCode")
                    ?.value ||
                  "—";
                const mrp = Number(p.price || p.sellingPrice || 0);
                const qty = Number(p.quantity || 1);
                const discount = Number(itemDiscounts[p.productId] || 0);
                const discountType =
                  itemDiscountTypes[p.productId] || "percent";

                const unitPrice =
                  discountType === "percent"
                    ? mrp * (1 - discount / 100)
                    : mrp - discount;
                const total = Math.round(unitPrice * qty);

                return (
                  <tr key={p.productId || idx}>
                    <td className={styles.snoCell}>{i + idx + 1}.</td>
                    <td className={styles.prodNameCell}>
                      {p.name || pd.name || "—"}
                      {p.isOption && (
                        <Tag
                          color="orange"
                          style={{ marginLeft: 8, fontSize: "0.8em" }}
                        >
                          {p.optionType || "Optional"}
                        </Tag>
                      )}
                    </td>
                    <td>{code}</td>
                    <td>
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className={styles.prodImg}
                        />
                      ) : null}
                    </td>
                    <td>{qty}</td>
                    <td>{formatINR(mrp)}</td>
                    <td className={styles.discountCell}>
                      {discountType === "percent"
                        ? `${discount}%`
                        : `₹${discount}`}
                    </td>
                    <td className={styles.totalCell}>{formatINR(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {isLastPage && (
            <div className={styles.finalSummaryWrapper}>
              <div className={styles.finalSummarySection}>
                <div className={styles.summaryLeft}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>

                  {totalProductDiscount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Product Discount</span>
                      <span style={{ color: "#cf1322" }}>
                        -{formatINR(totalProductDiscount)}
                      </span>
                    </div>
                  )}

                  {extraDiscountAmt > 0 && (
                    <div className={styles.summaryRow}>
                      <span>
                        Extra Discount
                        {normalizedQuotation.extraDiscountType === "percent" &&
                        normalizedQuotation.extraDiscount
                          ? ` (${normalizedQuotation.extraDiscount}%)`
                          : ""}
                      </span>
                      <span style={{ color: "#cf1322" }}>
                        -{formatINR(extraDiscountAmt)}
                      </span>
                    </div>
                  )}

                  <div className={styles.summaryRow}>
                    <span>Taxable Value</span>
                    <span>{formatINR(amountAfterDiscount)}</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>Round Off</span>
                    <span>
                      {roundOffApplied >= 0 ? "+" : ""}
                      {formatINR(Math.abs(roundOffApplied))}
                    </span>
                  </div>
                </div>

                <div className={styles.summaryRight}>
                  <div className={styles.totalAmount}>
                    <span>Total Amount</span>
                    <span>
                      ₹{Number(Math.round(finalTotal)).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={styles.amountInWords}>
                    {finalAmountInWords}
                  </div>
                </div>
              </div>

              {/* Optional: hint if there are optional items not included */}
              {cartItems.some((item) => item.isOption) && (
                <div
                  style={{
                    marginTop: 16,
                    fontSize: 13,
                    color: "#555",
                    textAlign: "center",
                  }}
                >
                  <em>
                    Note: Optional / add-on items are listed but excluded from
                    the final total.
                  </em>
                </div>
              )}
            </div>
          )}
        </div>,
      );
    }

    return pages;
  };

  return (
    <Modal
      title={
        <Title level={3} style={{ margin: 0, color: "#aa0f1f" }}>
          Quotation Preview
        </Title>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      style={{ top: 20 }}
      bodyStyle={{ padding: 0, background: "#f5f5f5" }}
      destroyOnClose
      footer={[
        <Button key="close" onClick={onClose} icon={<CloseOutlined />}>
          Close
        </Button>,
        <Button
          key="pdf"
          type="primary"
          icon={<FilePdfFilled />}
          onClick={handleExportPDF}
        >
          Export PDF
        </Button>,
      ]}
    >
      <div
        ref={previewRef}
        style={{ position: "absolute", left: "-9999px", top: 0 }}
      >
        <div className={styles.printArea}>{renderPages()}</div>
      </div>

      <div
        style={{
          padding: "40px 20px",
          background: "#f5f5f5",
          minHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div className={styles.printArea}>{renderPages()}</div>
      </div>
    </Modal>
  );
};

export default PreviewQuotation;
