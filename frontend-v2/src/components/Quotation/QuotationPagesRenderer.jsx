import React from "react";
import { amountInWords } from "./hooks/calcHelpers";
import logo from "../../assets/img/logo-quotation.png";
import coverImage from "../../assets/img/quotation_first_page.jpeg";
import quotationBgImage from "../../assets/img/quotation_letterhead.jpeg";
import styles from "./quotationnew.module.css"; // ← adjust path if needed

export const QuotationPagesRenderer = ({
  quotation,
  mainProducts,
  optionalProducts,
  customerName,
  customerPhone,
  customerAddress,
  displaySubtotal,
  displayProductDiscount,
  backendExtraDiscount,
  backendFinalAmount,
  backendRoundOff,
  finalAmountInWords,
  getShouldShowColumn = () => true,
}) => {
  const shouldShowColumn = getShouldShowColumn;

  const renderProductTable = (items, isOptional = false, startSno = 0) => {
    let localSno = startSno;

    return (
      <table className={styles.productTable}>
        <colgroup>
          {shouldShowColumn("sno") && <col className={styles.sno} />}
          {shouldShowColumn("name") && <col className={styles.name} />}
          {shouldShowColumn("code") && <col className={styles.code} />}
          {shouldShowColumn("image") && <col className={styles.image} />}
          {shouldShowColumn("unit") && <col className={styles.unit} />}
          {shouldShowColumn("mrp") && <col className={styles.mrp} />}
          {shouldShowColumn("discount") && <col className={styles.discount} />}
          {shouldShowColumn("total") && <col className={styles.total} />}
        </colgroup>

        <thead>
          <tr>
            {shouldShowColumn("sno") && <th>S.No</th>}
            {shouldShowColumn("name") && <th>Product Name</th>}
            {shouldShowColumn("code") && <th>Code</th>}
            {shouldShowColumn("image") && <th>Image</th>}
            {shouldShowColumn("unit") && <th>Unit</th>}
            {shouldShowColumn("mrp") && <th>MRP</th>}
            {shouldShowColumn("discount") && <th>Discount</th>}
            {shouldShowColumn("total") && <th>Total</th>}
          </tr>
        </thead>

        <tbody>
          {items.map((p) => {
            const matchingItem =
              quotation?.products?.find((it) => it.productId === p.productId) ||
              quotation?.items?.find((it) => it.productId === p.productId) ||
              p;

            const code =
              matchingItem?.companyCode ||
              matchingItem?.productCode ||
              p.companyCode ||
              "—";

            const img = matchingItem?.imageUrl || p.imageUrl || "";

            const mrp = Number(matchingItem?.price ?? p.price ?? 0);
            const qty = Number(matchingItem?.quantity ?? p.quantity ?? 1);
            const lineTotal = Number(matchingItem?.total ?? p.total ?? 0);

            const discValue = Number(matchingItem?.discount ?? 0);
            const discType = (
              matchingItem?.discountType ?? "percent"
            ).toLowerCase();

            let displayDiscount = "—";
            if (discValue > 0) {
              displayDiscount =
                discType === "percent"
                  ? `${discValue}%`
                  : `₹${discValue.toFixed(0)}`;
            }

            localSno++;

            return (
              <tr key={p.productId || `item-${localSno}`}>
                {shouldShowColumn("sno") && (
                  <td className={styles.snoCell}>
                    {isOptional ? localSno - startSno : localSno}.
                  </td>
                )}
                {shouldShowColumn("name") && (
                  <td className={styles.prodNameCell}>
                    {matchingItem?.name || p.name || "—"}
                  </td>
                )}
                {shouldShowColumn("code") && <td>{code}</td>}
                {shouldShowColumn("image") && (
                  <td>
                    {img ? (
                      <img
                        src={img}
                        alt={matchingItem?.name || p.name || "Product"}
                        className={styles.prodImg}
                        crossOrigin="anonymous"
                      />
                    ) : null}
                  </td>
                )}
                {shouldShowColumn("unit") && <td>{qty}</td>}
                {shouldShowColumn("mrp") && (
                  <td>₹{mrp.toLocaleString("en-IN")}</td>
                )}
                {shouldShowColumn("discount") && (
                  <td className={styles.discountCell}>{displayDiscount}</td>
                )}
                {shouldShowColumn("total") && (
                  <td className={styles.totalCell}>
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const pages = [];
  const MAX_PRODUCTS_NORMAL = 10;
  const MAX_PRODUCTS_WITH_SUMMARY = 8;

  // ── Cover ────────────────────────────────────────
  pages.push(
    <div key="cover" className={`${styles.coverPage} page`}>
      <img
        src={coverImage}
        alt="Cover"
        className={styles.coverBg}
        crossOrigin="anonymous"
      />
      <div className={styles.coverContent}>
        <div className={styles.dynamicCustomerName}>
          {customerName.toUpperCase()}
        </div>
      </div>
    </div>,
  );

  // ── Letterhead ───────────────────────────────────
  pages.push(
    <div key="letterhead" className={`${styles.letterheadPage} page`}>
      <img
        src={quotationBgImage}
        alt="Background"
        className={styles.letterheadBg}
        crossOrigin="anonymous"
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
        <img src={logo} alt="Logo" crossOrigin="anonymous" />
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
  // MAIN PRODUCTS PAGES
  let remainingMain = [...mainProducts];
  let globalSno = 0;

  while (remainingMain.length > 0) {
    const isVeryLastChunk = remainingMain.length <= MAX_PRODUCTS_WITH_SUMMARY;
    const canFitSummaryHere = isVeryLastChunk && optionalProducts.length === 0;

    let itemsThisPage;
    let showSummaryThisPage = false;

    if (canFitSummaryHere) {
      itemsThisPage = remainingMain;
      showSummaryThisPage = true;
    } else {
      itemsThisPage = remainingMain.slice(0, MAX_PRODUCTS_NORMAL);
      showSummaryThisPage = false;
    }

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

        {renderProductTable(itemsThisPage, false, globalSno)}

        {showSummaryThisPage && (
          <div className={styles.finalSummaryWrapper}>
            <div className={styles.finalSummarySection}>
              <div className={styles.summaryLeft}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
                </div>
                {displayProductDiscount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Total Discount</span>
                    <span>
                      -₹
                      {Math.round(displayProductDiscount).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                )}
                {backendExtraDiscount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Extra Discount</span>
                    <span>
                      -₹
                      {Math.round(backendExtraDiscount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Taxable Value</span>
                  <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className={styles.summaryRight}>
                <div className={styles.totalAmount}>
                  <strong>Total Amount:</strong>
                  <strong>
                    {" "}
                    ₹{backendFinalAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div className={styles.amountInWords}>{finalAmountInWords}</div>
                {backendRoundOff !== 0 && (
                  <div className={styles.roundOffNote}>
                    (Round off: {backendRoundOff >= 0 ? "+" : "-"}₹
                    {Math.abs(backendRoundOff).toFixed(2)})
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>,
    );

    globalSno += itemsThisPage.length;
    remainingMain = remainingMain.slice(itemsThisPage.length);
  }

  // OPTIONAL ITEMS PAGE
  if (optionalProducts.length > 0) {
    pages.push(
      <div key="optional-page" className={`${styles.productPage} page`}>
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

        <div
          style={{
            textAlign: "center",
            fontSize: "26px",
            fontWeight: "bold",
            color: "#E31E24",
            margin: "40px 0 20px",
          }}
        >
          Optional / Suggested Accessories
        </div>

        <div
          style={{
            textAlign: "center",
            fontStyle: "italic",
            color: "#555",
            marginBottom: "32px",
            fontSize: "15px",
          }}
        >
          These items are <strong>not included</strong> in the quoted total.
          <br />
          They are recommended add-ons or compatible variants.
        </div>

        {renderProductTable(optionalProducts, true, globalSno)}

        <div
          style={{
            textAlign: "right",
            marginTop: "32px",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Total Value of Optional Items:{" "}
          <span style={{ color: "#E31E24" }}>
            ₹
            {optionalProducts
              .reduce((sum, p) => sum + Number(p.total || 0), 0)
              .toLocaleString("en-IN")}
          </span>
        </div>
      </div>,
    );
  }

  // SUMMARY ONLY (when optional items exist)
  if (mainProducts.length > 0 && optionalProducts.length > 0) {
    pages.push(
      <div key="summary-only" className={`${styles.productPage} page`}>
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

        <div
          style={{
            textAlign: "center",
            margin: "40px 0 60px",
            fontSize: "24px",
            fontWeight: "bold",
            color: "#E31E24",
          }}
        >
          Quotation Summary
        </div>

        <div className={styles.finalSummaryWrapper}>
          <div className={styles.finalSummarySection}>
            <div className={styles.summaryLeft}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
              </div>
              {displayProductDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Total Discount</span>
                  <span>
                    -₹
                    {Math.round(displayProductDiscount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {backendExtraDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Extra Discount</span>
                  <span>
                    -₹
                    {Math.round(backendExtraDiscount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Taxable Value</span>
                <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className={styles.summaryRight}>
              <div className={styles.totalAmount}>
                <strong>Total Amount:</strong>
                <strong> ₹{backendFinalAmount.toLocaleString("en-IN")}</strong>
              </div>
              <div className={styles.amountInWords}>{finalAmountInWords}</div>
              {backendRoundOff !== 0 && (
                <div className={styles.roundOffNote}>
                  (Round off: {backendRoundOff >= 0 ? "+" : "-"}₹
                  {Math.abs(backendRoundOff).toFixed(2)})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>,
    );
  }

  return pages;
};
