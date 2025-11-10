import React, { useRef, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";

import logo from "../../assets/img/logo-quotation.png";

import {
  useGetQuotationByIdQuery,
  useGetQuotationVersionsQuery,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetCompanyByIdQuery } from "../../api/companyApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import "./quotation.css";
import useProductsData from "../../data/useProductdata";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { exportToPDF, exportToExcel } from "./hooks/exportHelpers";
import { calcTotals, amountInWords } from "./hooks/calcHelpers";
import { Helmet } from "react-helmet";

const companyId = "401df7ef-f350-4bc4-ba6f-bf36923af252";

const QuotationsDetails = () => {
  const { id } = useParams();
  const [activeVersion, setActiveVersion] = useState("current");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const quotationRef = useRef(null);

  // === DATA FETCHING ===
  const {
    data: quotation,
    isLoading: qLoading,
    error: qError,
  } = useGetQuotationByIdQuery(id);

  const {
    data: versionsData,
    isLoading: vLoading,
    error: vError,
  } = useGetQuotationVersionsQuery(id);
  const { data: brandsData } = useGetAllBrandsQuery(); // <-- NEW

  const { data: usersData } = useGetAllUsersQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: companyData } = useGetCompanyByIdQuery(companyId);
  const company = companyData?.data || {};
  const productDetailsMap = useMemo(() => {
    const map = {};
    if (!quotation || !quotation.products) return map;

    const items = Array.isArray(quotation.products)
      ? quotation.products
      : safeParseProducts(quotation.products);

    items.forEach((p) => {
      if (p.productId) {
        map[p.productId] = {
          sellingPrice: Number(p.sellingPrice || p.price || 0),
          name: p.name,
        };
      }
    });

    return map;
  }, [quotation?.products]);
  const safeParseProducts = (products) => {
    if (Array.isArray(products)) return products;
    if (typeof products === "string") {
      try {
        return JSON.parse(products);
      } catch (e) {
        console.error("Failed to parse products JSON", e);
        return [];
      }
    }
    return [];
  };
  // === ACTIVE VERSION LOGIC ===
  const versions = useMemo(() => {
    const list = Array.isArray(versionsData) ? [...versionsData] : [];

    // Helper to safely parse products

    // Always add current version
    if (quotation) {
      const parsedItems = safeParseProducts(quotation.products);

      list.unshift({
        version: "current",
        quotationId: quotation.quotationId,
        quotationData: quotation,
        quotationItems: parsedItems,
        updatedBy: quotation.createdBy,
        updatedAt: quotation.updatedAt || new Date(),
      });
    }

    // Sort: current first, then by version descending
    return list.sort((a, b) =>
      a.version === "current" ? -1 : b.version - a.version
    );
  }, [quotation, versionsData]);
  const activeVersionData = useMemo(() => {
    const v = versions.find((x) => x.version === activeVersion);

    // If version not found (shouldn't happen), fallback to current
    const fallback = versions.find((x) => x.version === "current") || {};

    const selected = v || fallback;

    return {
      quotation: selected.quotationData || quotation || {},
      products: selected.quotationItems || [],
      updatedBy: selected.updatedBy,
      updatedAt: selected.updatedAt,
    };
  }, [activeVersion, versions, quotation]);
  const activeProducts = activeVersionData.products || [];

  // === CUSTOMER & ADDRESS ===
  const { data: customer } = useGetCustomerByIdQuery(
    activeVersionData.quotation?.customerId,
    { skip: !activeVersionData.quotation?.customerId }
  );

  const { data: address } = useGetAddressByIdQuery(
    activeVersionData.quotation?.shipTo,
    { skip: !activeVersionData.quotation?.shipTo }
  );

  // === PRODUCT DATA ===
  const {
    productsData,
    errors: productErrors,
    loading: prodLoading,
  } = useProductsData(activeProducts);

  // === UTILS ===
  const getUserName = (uid) => {
    if (!uid) return company.name || "CHHABRA MARBLE";
    const user = usersData?.users?.find(
      (u) => u.userId?.trim() === uid?.trim()
    );
    return user?.name || company.name || "CHHABRA MARBLE";
  };

  const getCustomerName = (cid) => {
    if (!cid) return "Unknown";
    const c = customersData?.data?.find((x) => x.customerId === cid);
    return c?.name || "Unknown";
  };

  // ----- REPLACE the whole brandNames useMemo -----
  const brandNames = useMemo(() => {
    const set = new Set();

    activeProducts.forEach((p) => {
      const pd = productsData?.find((x) => x.productId === p.productId) ?? {};

      // 1. brandName field (new)
      // 2. meta with title containing “brand”
      // 3. lookup via brandId
      let brand =
        pd.brandName ??
        pd.metaDetails?.find((m) => m.title?.toLowerCase().includes("brand"))
          ?.value;

      if (!brand && pd.brandId) {
        const rec = brandsData?.find((b) => b.id === pd.brandId);
        brand = rec?.brandName;
      }

      if (brand && brand !== "N/A" && !/^[0-9a-f-]{36}$/.test(brand)) {
        set.add(brand.trim());
      }
    });

    return set.size ? [...set].join(" / ") : "GROHE / AMERICAN STANDARD";
  }, [activeProducts, productsData, brandsData]); // <-- brandsData in deps
  // ----- 1. call calcTotals with the new params -----
  const gstRate = Number(
    activeVersionData.quotation?.gst || // <-- API field
      activeVersionData.quotation?.gst_value || // fallback for UI form
      0
  );
  const includeGst = activeVersionData.quotation?.include_gst ?? true;

  const {
    subtotal,
    extraDiscountAmt,
    gst: gstAmount,
    total: finalTotal,
  } = calcTotals(
    activeProducts,
    gstRate,
    includeGst,
    productDetailsMap,
    activeVersionData.quotation?.extraDiscount || 0,
    activeVersionData.quotation?.extraDiscountType || "amount",
    activeVersionData.quotation?.roundOff || 0
  );
  console.log(gstAmount);
  // === EXPORT HANDLER ===
  const handleExport = async () => {
    if (!id || !quotation) return toast.error("Quotation missing");

    setIsExporting(true);
    try {
      const safeQuotation = {
        customerName:
          getCustomerName(activeVersionData.quotation?.customerId) || "‑",
        quotation_date:
          activeVersionData.quotation?.quotation_date ||
          new Date().toISOString(),
        gst_value: activeVersionData.quotation?.gst_value ?? 0,
        include_gst: activeVersionData.quotation?.include_gst ?? false,
      };

      if (exportFormat === "pdf") {
        await exportToPDF(quotationRef, id, activeVersion);
      } else {
        await exportToExcel(
          activeVersionData.products,
          productsData,
          brandNames,
          safeQuotation,
          brandsData,
          address
            ? `${address.street || ""}, ${address.city || ""}, ${
                address.state || ""
              }, ${address.postalCode || ""}, ${address.country || ""}`
            : "N/A",
          logo,
          company.bankDetails || {
            bankName: "IDFC FIRST BANK",
            accountNumber: "10179373657",
            ifscCode: "IDFB0020149",
            branch: "BHERA ENCLAVE PASCHIM VIHAR",
          },
          id,
          activeVersion
        );
      }
      toast.success(`Exported as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // === LOADING & ERROR ===
  if (qLoading || vLoading || prodLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (qError) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <div className="alert alert-danger" role="alert">
            Failed to load quotation
          </div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <p>Quotation not found.</p>
        </div>
      </div>
    );
  }

  // === RENDER ===
  return (
    <div className="page-wrapper">
      <Helmet>
        <title>
          {quotation?.document_title} - {quotation?.reference_number}
        </title>
      </Helmet>
      <div className="content">
        <div className="row">
          <div className="col-sm-10 mx-auto">
            <Link
              to="/quotations/list"
              className="back-icon d-flex align-items-center fs-12 fw-medium mb-3 d-inline-flex"
            >
              <span className="d-flex justify-content-center align-items-center rounded-circle me-2">
                <i className="fas fa-arrow-left"></i>
              </span>
              Back to List
            </Link>

            <div className="card">
              {/* === QUOTATION CONTENT === */}
              <div className="quotation-container" ref={quotationRef}>
                {/* Header */}
                <table className="quotation-table full-width">
                  <tbody>
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        <img src={logo} alt="Logo" className="logo-img" />
                      </td>
                    </tr>
                    <tr>
                      <td className="title-cell">Quotation</td>
                      <td className="brand-cell">{brandNames}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Customer Info */}
                <table className="quotation-table full-width mt-2">
                  <tbody>
                    <tr>
                      <td className="label-cell" style={{ width: "15%" }}>
                        M/s
                      </td>
                      <td style={{ width: "55%" }}>
                        {getCustomerName(
                          activeVersionData.quotation?.customerId
                        )}
                      </td>
                      <td className="label-cell" style={{ width: "15%" }}>
                        Date
                      </td>
                      <td style={{ width: "15%" }}>
                        {new Date(
                          activeVersionData.quotation?.quotation_date
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">Address</td>
                      <td colSpan="3">
                        {address
                          ? `${address.street || ""}, ${address.city || ""}, ${
                              address.state || ""
                            }, ${address.postalCode || ""}, ${
                              address.country || ""
                            }`
                          : "N/A"}
                      </td>
                    </tr>
                    {activeVersion !== "current" && (
                      <tr>
                        <td className="label-cell">Version</td>
                        <td colSpan="3">
                          Version {activeVersion} - Updated by{" "}
                          {getUserName(activeVersionData.updatedBy)} on{" "}
                          {new Date(
                            activeVersionData.updatedAt
                          ).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Products Table */}
                <table className="quotation-table full-width mt-3">
                  <thead>
                    <tr>
                      <th rowSpan="2">S.No</th>
                      <th rowSpan="2">Image</th>
                      <th rowSpan="2">Product Name</th>
                      <th rowSpan="2">Code</th>
                      <th colSpan="5">Amount</th>
                    </tr>
                    <tr>
                      <th>MRP</th>
                      <th>Discount</th>
                      <th>Rate</th>
                      <th>Unit</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProducts.map((p, i) => {
                      const pd =
                        productsData?.find(
                          (x) => x.productId === p.productId
                        ) || {};
                      const img = pd.images ? JSON.parse(pd.images)[0] : null;
                      const code =
                        pd.metaDetails?.find((cc) => cc.slug === "companyCode")
                          ?.value ||
                        p.productCode ||
                        "N/A";

                      const qty = p.quantity || 1;

                      // === USE sellingPrice from products string ===
                      const productDetail =
                        productDetailsMap[p.productId] || {};
                      const mrp = productDetail.sellingPrice || 0; // ← REAL MRP

                      // === Use p.total as line total BEFORE extra discount ===
                      const lineTotalBeforeDiscount = Number(p.total || 0);

                      // === Calculate discount amount ===
                      const subtotal = mrp * qty;
                      const discountAmt = subtotal - lineTotalBeforeDiscount;

                      const rate = mrp - discountAmt / qty;

                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            {img ? (
                              <img
                                src={img}
                                alt=""
                                className="product-img"
                                style={{ height: 50 }}
                              />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{p.name || pd.name || "—"}</td>
                          <td>{code}</td>
                          <td>₹{mrp.toFixed(2)}</td>
                          <td>₹{discountAmt.toFixed(2)}</td>
                          <td>₹{rate.toFixed(2)}</td>
                          <td>{qty}</td>
                          <td>₹{lineTotalBeforeDiscount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Tax Summary */}
                {/* === FINAL AMOUNT BREAKDOWN (Same Style as HSN Table) === */}
                {/* Tax Summary with GST Breakdown */}
                <table className="quotation-table full-width mt-3">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Taxable Value</th>
                      <th>CGST</th>
                      <th>CGST Amt</th>
                      <th>SGST</th>
                      <th>SGST Amt</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Subtotal (before discount & GST) */}
                    <tr>
                      <td>
                        <strong>Subtotal</strong>
                      </td>
                      <td>₹{subtotal.toFixed(2)}</td>
                      <td colSpan="4"></td>
                      <td>₹{subtotal.toFixed(2)}</td>
                    </tr>

                    {/* Extra Discount */}
                    {(() => {
                      const extraDisc = parseFloat(
                        activeVersionData.quotation?.extraDiscount || "0"
                      );
                      const extraDiscType =
                        activeVersionData.quotation?.extraDiscountType ||
                        "amount";

                      return extraDisc > 0 ? (
                        <tr>
                          <td>
                            <strong>
                              Extra Discount (
                              {extraDiscType === "percent"
                                ? `${extraDisc.toFixed(2)}%`
                                : `₹${extraDisc.toFixed(2)}`}
                              )
                            </strong>
                          </td>
                          <td colSpan="5"></td>
                          <td className="text-danger">
                            <strong>-₹{extraDiscountAmt.toFixed(2)}</strong>
                          </td>
                        </tr>
                      ) : null;
                    })()}

                    {/* GST Rows */}
                    {gstAmount > 0 && (
                      <>
                        {/* Taxable Amount after discount */}
                        <tr>
                          <td>
                            <strong>Taxable Amount</strong>
                            <br />
                            <small>(After Extra Discount)</small>
                          </td>
                          <td>₹{(subtotal - extraDiscountAmt).toFixed(2)}</td>
                          <td colSpan="4"></td>
                          <td>₹{(subtotal - extraDiscountAmt).toFixed(2)}</td>
                        </tr>

                        {/* CGST Row */}
                        <tr>
                          <td>
                            <strong>CGST</strong> @{" "}
                            {(
                              activeVersionData.quotation?.gst_value / 2 || 0
                            ).toFixed(1)}
                            %
                          </td>
                          <td></td>
                          <td>
                            {(
                              activeVersionData.quotation?.gst_value / 2 || 0
                            ).toFixed(1)}
                            %
                          </td>
                          <td>₹{(gstAmount / 2).toFixed(2)}</td>
                          <td></td>
                          <td></td>
                          <td>₹{(gstAmount / 2).toFixed(2)}</td>
                        </tr>

                        {/* SGST Row */}
                        <tr>
                          <td>
                            <strong>SGST</strong> @{" "}
                            {(
                              activeVersionData.quotation?.gst_value / 2 || 0
                            ).toFixed(1)}
                            %
                          </td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td>
                            {(
                              activeVersionData.quotation?.gst_value / 2 || 0
                            ).toFixed(1)}
                            %
                          </td>
                          <td>₹{(gstAmount / 2).toFixed(2)}</td>
                          <td>₹{(gstAmount / 2).toFixed(2)}</td>
                        </tr>

                        {/* Total GST */}
                        <tr>
                          <td>
                            <strong>Total GST</strong>
                          </td>
                          <td colSpan="5"></td>
                          <td>
                            <strong>₹{gstAmount.toFixed(2)}</strong>
                          </td>
                        </tr>
                      </>
                    )}

                    {/* Round-off */}
                    {activeVersionData.quotation?.roundOff != null && (
                      <tr>
                        <td>
                          <strong>Round-off</strong>
                        </td>
                        <td colSpan="5"></td>
                        <td>
                          <strong>
                            {(Number(activeVersionData.quotation?.roundOff) >= 0
                              ? "+"
                              : "") +
                              "₹" +
                              Math.abs(
                                Number(activeVersionData.quotation?.roundOff)
                              ).toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                    )}

                    {/* Final Amount */}
                    <tr className="table-success">
                      <td>
                        <strong>Final Amount</strong>
                        {activeVersionData.quotation?.include_gst === false && (
                          <>
                            <br />
                            <small className="text-muted">(Excl. GST)</small>
                          </>
                        )}
                      </td>
                      <td colSpan="5"></td>
                      <td>
                        <strong style={{ fontSize: "1.1rem" }}>
                          ₹{finalTotal.toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* Amount in Words */}
                <table className="quotation-table full-width mt-3">
                  <tbody>
                    <tr>
                      <td colSpan="8" className="text-right">
                        <strong>Final Amount (in words)</strong>
                      </td>
                      <td className="text-right">
                        <strong>
                          {amountInWords(
                            Number(
                              activeVersionData.quotation?.finalAmount ||
                                finalTotal
                            )
                          )}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* Bank & Declaration */}
                <table className="quotation-table full-width mt-3">
                  <tbody>
                    <tr>
                      <td colSpan="2">
                        <strong>Company's Bank Details</strong>
                        <br />
                        A/c Holder: <strong>EMBARK ENTERPRISES</strong>
                        <br />
                        Bank: <strong>IDFC FIRST BANK</strong>
                        <br />
                        A/c No: <strong>10179373657</strong>
                        <br />
                        Branch & IFSC:{" "}
                        <strong>
                          BHERA ENCLAVE PASCHIM VIHAR & IDFB0020149
                        </strong>
                      </td>
                      <td colSpan="2" className="text-right">
                        <strong>PAN:</strong> AALFE0496K
                        <br />
                        <strong>Declaration:</strong> We declare that this
                        quotation shows the actual price.
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="4" className="text-right pt-5">
                        for <strong>EMBARK ENTERPRISES</strong>
                        <br />
                        <br />
                        <br />
                        Authorised Signatory
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="quotation-table full-width mt-3">
                  <tbody>
                    <tr>
                      <td>
                        <strong>Terms & Conditions:</strong> Refer attached
                        document.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* === VERSION TABS (Using original tab style) === */}
              <div className="nav-tabs-custom mt-3">
                <ul className="nav nav-tabs">
                  {versions.map((v) => (
                    <li
                      key={v.version}
                      className={activeVersion === v.version ? "active" : ""}
                    >
                      <a
                        href="#!"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveVersion(v.version);
                        }}
                        className="nav-link"
                      >
                        {v.version === "current"
                          ? "Current"
                          : `Version ${v.version}`}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* === EXPORT CONTROLS (Using original classes) === */}
              <div className="d-flex justify-content-center align-items-center my-4">
                <div className="d-flex align-items-center me-2">
                  <select
                    className="form-select me-2"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    disabled={isExporting}
                  >
                    <option value="pdf">Export as PDF</option>
                    <option value="excel">Export as Excel</option>
                  </select>
                  <button
                    className="btn btn-primary d-flex justify-content-center align-items-center"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    <i className="fas fa-file-export me-1"></i>
                    {isExporting ? "Exporting..." : "Export"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationsDetails;
