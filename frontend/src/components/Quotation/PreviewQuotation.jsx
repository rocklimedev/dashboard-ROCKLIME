// src/components/Quotation/PreviewQuotation.jsx
import React, { useRef, useMemo } from "react";
import { Modal, Button, Spin, Typography } from "antd";
import { FilePdfFilled, CloseOutlined } from "@ant-design/icons";
import { exportToPDF } from "./hooks/exportHelpers";
import styles from "./quotationnew.module.css";

import logo from "../../assets/img/logo-quotation.png";
import americanStandard from "../../assets/img/american-standard-logo-2.png";
import groheLogo from "../../assets/img/Grohe-Logo.png";
import coverImage from "../../assets/img/quotation_first_page.jpeg";

import { calcTotals, amountInWords } from "./hooks/calcHelpers";
const { Title, Text } = Typography;

const PreviewQuotation = ({
  visible,
  onClose,
  cartItems,
  productsData,
  customer,
  address,
  quotationData,
  gstRate = 18,
  includeGst = true,
  itemDiscounts = {},
  itemDiscountTypes = {},
  itemTaxes = {},
}) => {
  const previewRef = useRef(null);

  const customerName = customer?.name || "Dear Client";
  const customerPhone =
    customer?.mobileNumber || customer?.phone || "XXXXXXXXXX";
  const customerAddress = address
    ? `${address.street || ""}, ${address.city || ""}, ${
        address.state || ""
      } - ${address.pincode || address.zip || ""}`
        .replace(/^,\s*|,*\s*$/g, "")
        .trim()
    : "487/65, National Market, Peera Garhi, Delhi, 110087";

  const brandNames = useMemo(() => {
    const set = new Set();
    cartItems.forEach((item) => {
      const pd = productsData?.find((p) => p.productId === item.productId);
      const brand =
        pd?.brandName ||
        pd?.metaDetails?.find((m) => m.title?.toLowerCase().includes("brand"))
          ?.value;
      if (brand && brand !== "N/A") set.add(brand.trim());
    });
    return set.size ? [...set].join(" / ") : "GROHE / AMERICAN STANDARD";
  }, [cartItems, productsData]);

  const calculated = useMemo(() => {
    let subtotal = 0;
    cartItems.forEach((p) => {
      const mrp = Number(p.price || p.sellingPrice || 0);
      const qty = Number(p.quantity || 1);
      const discount = Number(itemDiscounts[p.productId] || 0);
      const discountType = itemDiscountTypes[p.productId] || "percent";
      let unitAfterDiscount =
        discountType === "percent"
          ? mrp * (1 - discount / 100)
          : mrp - discount;
      subtotal += unitAfterDiscount * qty;
    });

    const extraDiscount = Number(
      quotationData?.discountAmount || quotationData?.extraDiscount || 0
    );
    const extraType =
      quotationData?.discountType ||
      quotationData?.extraDiscountType ||
      "percent";
    let extraDiscountAmt =
      extraType === "percent"
        ? subtotal * (extraDiscount / 100)
        : extraDiscount;
    subtotal -= extraDiscountAmt;
    subtotal = parseFloat(subtotal.toFixed(2));

    const gstAmount = includeGst
      ? parseFloat(((subtotal * gstRate) / 100).toFixed(2))
      : 0;
    let total = subtotal + gstAmount;
    const roundOff = Number(quotationData?.roundOff || 0);
    total += roundOff;
    const finalTotal = Math.round(total);

    return {
      subtotal,
      extraDiscountAmt,
      gstAmount,
      total: finalTotal,
      roundOff,
    };
  }, [
    cartItems,
    itemDiscounts,
    itemDiscountTypes,
    gstRate,
    includeGst,
    quotationData,
  ]);

  const finalAmountInWords = amountInWords(calculated.total);

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    const safeTitle = (quotationData?.document_title || "Quotation_Preview")
      .replace(/[\\/:*?"<>|]/g, "_")
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

    // Page 2: Letterhead
    pages.push(
      <div key="letterhead" className={`${styles.letterheadPage} page`}>
        <div className={styles.letterheadTop}>
          <img
            src={americanStandard}
            alt="American Standard"
            className={styles.brandLogoLeft}
          />
          <img src={groheLogo} alt="GROHE" className={styles.brandLogoRight} />
        </div>

        <h1 className={styles.companyTitle}>CHHABRA MARBLE PVT.LTD</h1>
        <h2 className={styles.subtitle}>Quotation Letter</h2>

        <div className={styles.clientInfoGrid}>
          <div className={styles.label}>Client Name</div>
          <div className={styles.value}>{customerName}</div>
          <div className={styles.label}>Contact Number</div>
          <div className={styles.value}>{customerPhone}</div>
          <div className={styles.label}>Address</div>
          <div className={styles.value}>{customerAddress}</div>
          <div className={styles.label}>ID</div>
          <div className={styles.value}>
            {quotationData.reference_number || "PREVIEW"}
          </div>
        </div>

        <div className={styles.letterheadFooter}>
          <img src={logo} alt="Logo" style={{ height: 80 }} />
          <div style={{ textAlign: "center", fontSize: 16 }}>
            <strong>CHHABRA MARBLE PVT. LTD.</strong>
            <br />
            487/65, National Market, Peera Garhi, Delhi, 110087
            <br />
            Phone: 099110 80605 • Web: www.cmtradingco.com
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
              <div className={styles.clientName}>
                MR {customerName.toUpperCase()}
              </div>
              <div className={styles.clientAddress}>{customerAddress}</div>
            </div>
            <div className={styles.pageDate}>
              {new Date()
                .toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
                .replace(/ /g, " | ")}
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
                  productsData?.find((x) => x.productId === p.productId) || {};
                const img = p.imageUrl || pd.images?.[0] || "";
                const code =
                  pd.metaDetails?.find((m) => m.slug === "companyCode")
                    ?.value || "—";
                const mrp = Number(p.price || p.sellingPrice || 0);
                const qty = Number(p.quantity || 1);
                const discount = Number(itemDiscounts[p.productId] || 0);
                const discountType =
                  itemDiscountTypes[p.productId] || "percent";
                let unitAfterDiscount =
                  discountType === "percent"
                    ? mrp * (1 - discount / 100)
                    : mrp - discount;
                const total = Math.round(unitAfterDiscount * qty);

                return (
                  <tr key={p.productId}>
                    <td className={styles.snoCell}>{i + idx + 1}.</td>
                    <td className={styles.prodNameCell}>{p.name}</td>
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
                    <span>Taxable Value</span>
                    <span>₹{calculated.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {calculated.gstAmount > 0 ? (
                    <>
                      <div className={styles.summaryRow}>
                        <span>CGST @{(gstRate / 2).toFixed(1)}%</span>
                        <span>
                          ₹{(calculated.gstAmount / 2).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>SGST @{(gstRate / 2).toFixed(1)}%</span>
                        <span>
                          ₹{(calculated.gstAmount / 2).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.summaryRow}>
                        <span>CGST @0.0%</span>
                        <span>₹0</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>SGST @0.0%</span>
                        <span>₹0</span>
                      </div>
                    </>
                  )}
                  <div className={styles.summaryRow}>
                    <span>Round off</span>
                    <span>₹{Number(calculated.roundOff).toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span style={{ fontSize: "26px" }}>Total Amount</span>
                    <span style={{ fontSize: "26px" }}>
                      ₹{calculated.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isLastPage && (
            <div style={{ textAlign: "right", marginTop: "10px" }}>Page 2</div>
          )}
        </div>
      );
    }

    // Terms Page
    pages.push(
      <div key="terms" className={`${styles.termsPage} page`}>
        <table
          className={styles.termsTable}
          style={{ width: "100%", border: "1px solid black" }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid black", padding: "8px" }}>
                Terms & Conditions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                <ol style={{ margin: 0, paddingLeft: "20px" }}>
                  <li>
                    Rates/Discounts are as per our above quote. Any changes to
                    the quote may affect the discounts.
                  </li>
                  <li>
                    Delivery will be within 7 to 10 working days from the date
                    of confirmed PO and payment. Availability of some items is
                    subject to company stock.
                  </li>
                  <li>
                    100% advance payment is required to process the order.
                  </li>
                  <li>
                    Delivery and unloading charges will be borne by the buyer.
                  </li>
                  <li>
                    Any damages at the site during or after unloading will be
                    the responsibility of the customer.
                  </li>
                  <li>
                    This quotation is valid for 30 days from the date above.
                  </li>
                  <li>
                    Payment Terms: Full payment is required to confirm the
                    order. Under no circumstances will old rates apply if 100%
                    advance is not received.
                  </li>
                  <li>
                    Partial Advance: In the case of partial advance payments,
                    only the discounts will be locked in, and the MRPs
                    applicable at that time will be charged.
                  </li>
                  <li>
                    If the product is supplied as a special order, the company
                    reserves the right to refuse any returns.
                  </li>
                  <li>
                    The client must provide a lifting schedule for final
                    delivery to ensure goods are ordered and arranged in
                    advance, avoiding partial or delayed deliveries.
                  </li>
                  <li>Brand standard warranty terms are applicable.</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );

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
      footer={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button icon={<FilePdfFilled />} onClick={handleExportPDF}>
            Download PDF
          </Button>
        </div>
      }
      width={900}
      style={{ top: 20 }}
      bodyStyle={{ padding: 0, background: "#f5f5f5" }}
      destroyOnClose
    >
      <div
        ref={previewRef}
        style={{ position: "absolute", left: "-9999px", top: 0 }}
      >
        <div className={styles.printArea}>{renderPages()}</div>
      </div>

      <div
        style={{ padding: "20px", background: "#f5f5f5", minHeight: "80vh" }}
      >
        <div className={styles.printArea}>{renderPages()}</div>
      </div>
    </Modal>
  );
};

export default PreviewQuotation;
