// src/components/Quotation/PreviewQuotation.jsx
import React, { useRef, useMemo } from "react";
import { Modal, Button, Typography } from "antd";
import { FilePdfFilled, CloseOutlined } from "@ant-design/icons";

import logo from "../../assets/img/logo-quotation.png";
import coverImage from "../../assets/img/quotation_first_page.jpeg";
import quotationBgImage from "../../assets/img/quotation_letterhead.jpeg"; // ← ADD THIS

import { exportToPDF } from "./hooks/exportHelpers";
import { calcTotals, amountInWords } from "./hooks/calcHelpers";
import styles from "./quotationnew.module.css";

const { Title } = Typography;

const PreviewQuotation = ({
  visible,
  onClose,
  cartItems = [],
  productsData = [],
  customer = {},
  address = {},
  quotationData = {},
  gstRate = 18,
  includeGst = true,
  itemDiscounts = {},
  itemDiscountTypes = {},
}) => {
  const previewRef = useRef(null);

  const customerName = customer?.name || "Dear Client";
  const customerPhone = customer?.mobileNumber || customer?.phone || "—";
  const customerAddress =
    address && (address.street || address.city)
      ? `${address.street || ""}, ${address.city || ""}, ${
          address.state || ""
        } - ${address.pincode || address.postalCode || address.zip || ""}`
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

  // Reuse same calc logic as NewQuotationsDetails
  const {
    subtotal,
    extraDiscountAmt,
    amountAfterDiscount,
    gst: gstAmount,
    total: finalTotal,
  } = useMemo(() => {
    const priceMap = cartItems.reduce((map, p) => {
      map[p.productId] = {
        sellingPrice: Number(p.price || p.sellingPrice || 0),
        name: p.name,
      };
      return map;
    }, {});

    return calcTotals(
      cartItems,
      gstRate,
      includeGst,
      priceMap,
      quotationData?.extraDiscount || 0,
      quotationData?.extraDiscountType || "amount",
      quotationData?.roundOff || 0
    );
  }, [cartItems, gstRate, includeGst, quotationData]);

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
      `${safeTitle}_Preview.pdf`
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
      </div>
    );

    // Page 2: Letterhead – aligned with NewQuotationsDetails
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
      </div>
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
                    <td>₹{mrp.toLocaleString("en-IN")}</td>
                    <td className={styles.discountCell}>
                      {discountType === "percent"
                        ? `${discount}%`
                        : `₹${discount}`}
                    </td>
                    <td className={styles.totalCell}>
                      ₹{total.toLocaleString("en-IN")}
                    </td>
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
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {extraDiscountAmt > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Extra Discount</span>
                      <span>-₹{extraDiscountAmt.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className={styles.summaryRow}>
                    <span>Taxable Value</span>
                    <span>₹{amountAfterDiscount.toLocaleString("en-IN")}</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>GST @{gstRate}%</span>
                    <span>₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>Round off</span>
                    <span>
                      ₹{Number(quotationData?.roundOff || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className={styles.summaryRight}>
                  <div className={styles.totalAmount}>
                    <span>Total Amount</span>
                    <span>
                      ₹{Math.round(finalTotal).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={styles.amountInWords}>
                    {finalAmountInWords}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
        }}
      >
        <div className={styles.printArea}>{renderPages()}</div>
      </div>
    </Modal>
  );
};

export default PreviewQuotation;
