import React, { useRef, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";

import logo from "../../assets/img/logo.png";

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

import { exportToPDF, exportToExcel } from "./hooks/exportHelpers";
import { calcTotals, amountInWords } from "./hooks/calcHelpers";

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

  const { data: usersData } = useGetAllUsersQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: companyData } = useGetCompanyByIdQuery(companyId);
  const company = companyData?.data || {};

  // === ACTIVE VERSION LOGIC ===
  const versions = useMemo(() => {
    const list = Array.isArray(versionsData) ? [...versionsData] : [];

    // Always add current version, even if no historic ones
    if (quotation) {
      list.unshift({
        version: "current",
        quotationId: quotation.quotationId,
        quotationData: quotation,
        quotationItems: JSON.parse(quotation.products || "[]"),
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

  const brandNames = useMemo(() => {
    const set = new Set();
    activeProducts.forEach((p) => {
      const pd = productsData?.find((x) => x.productId === p.productId) || {};
      const brand =
        pd.brandName ||
        pd.metaDetails?.find((m) => m.title.toLowerCase().includes("brand"))
          ?.value ||
        "N/A";
      if (brand !== "N/A" && !/^[0-9a-f-]{36}$/.test(brand)) set.add(brand);
    });
    return set.size ? [...set].join(" / ") : "GROHE / AMERICAN STANDARD";
  }, [activeProducts, productsData]);

  const {
    subtotal,
    gst: gstAmount,
    total: finalTotal,
  } = calcTotals(
    activeProducts,
    activeVersionData.quotation?.gst_value || 0,
    activeVersionData.quotation?.include_gst
  );

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
      console.error(err);
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
                        <img
                          src={logo}
                          alt="Logo"
                          className="logo-img"
                          style={{ height: 60 }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td />
                      <td className="title-cell">Estimate / Quotation</td>
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
                    {activeProducts.length > 0 ? (
                      activeProducts.map((p, i) => {
                        const pd =
                          productsData?.find(
                            (x) => x.productId === p.productId
                          ) || {};
                        const img = pd.images ? JSON.parse(pd.images)[0] : null;
                        const code =
                          pd.metaDetails?.find(
                            (cc) => cc.title === "company_code"
                          )?.value ||
                          p.productCode ||
                          "N/A";

                        const mrp =
                          pd.metaDetails?.find(
                            (m) => m.title === "sellingPrice"
                          )?.value ||
                          p.total ||
                          0;

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
                            <td>₹{Number(mrp).toFixed(2)}</td>
                            <td>
                              {p.discount
                                ? p.discountType === "percent"
                                  ? `${p.discount}%`
                                  : `₹${p.discount}`
                                : "0"}
                            </td>
                            <td>₹{(p.rate || mrp).toFixed(2)}</td>
                            <td>{p.quantity || "1"}</td>
                            <td>₹{Number(p.total).toFixed(2)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center">
                          No products
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Amount in Words */}
                <table className="quotation-table full-width mt-3">
                  <tbody>
                    <tr>
                      <td colSpan="8" className="text-right">
                        <strong>Amount Chargeable (in words)</strong>
                      </td>
                      <td className="text-right">
                        <strong>{amountInWords(finalTotal)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Tax Summary */}
                <table className="quotation-table full-width mt-2">
                  <thead>
                    <tr>
                      <th>HSN/SAC</th>
                      <th>Taxable Value</th>
                      <th>CGST</th>
                      <th>CGST Amt</th>
                      <th>SGST</th>
                      <th>SGST Amt</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const map = new Map();
                      activeProducts.forEach((p) => {
                        const pd =
                          productsData?.find(
                            (x) => x.productId === p.productId
                          ) || {};
                        const hsn = pd.hsnSac || "N/A";
                        const taxable = Number(p.total || 0);
                        const rate =
                          activeVersionData.quotation?.gst_value || 0;
                        const cgst = (taxable * rate) / 200;
                        if (!map.has(hsn))
                          map.set(hsn, { taxable: 0, cgst: 0 });
                        const e = map.get(hsn);
                        e.taxable += taxable;
                        e.cgst += cgst;
                      });
                      return Array.from(map).map(
                        ([hsn, { taxable, cgst }], i) => (
                          <tr key={i}>
                            <td>{hsn}</td>
                            <td>₹{taxable.toFixed(2)}</td>
                            <td>
                              {(
                                activeVersionData.quotation?.gst_value / 2 || 0
                              ).toFixed(1)}
                              %
                            </td>
                            <td>₹{cgst.toFixed(2)}</td>
                            <td>
                              {(
                                activeVersionData.quotation?.gst_value / 2 || 0
                              ).toFixed(1)}
                              %
                            </td>
                            <td>₹{cgst.toFixed(2)}</td>
                            <td>₹{(taxable + cgst * 2).toFixed(2)}</td>
                          </tr>
                        )
                      );
                    })()}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <strong>Total</strong>
                      </td>
                      <td>
                        <strong>₹{subtotal.toFixed(2)}</strong>
                      </td>
                      <td></td>
                      <td>
                        <strong>₹{(gstAmount / 2).toFixed(2)}</strong>
                      </td>
                      <td></td>
                      <td>
                        <strong>₹{(gstAmount / 2).toFixed(2)}</strong>
                      </td>
                      <td>
                        <strong>₹{finalTotal.toFixed(2)}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="text-right">
                        <strong>
                          Tax Amount (in words): {amountInWords(gstAmount)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
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
                        Branch & IFS:{" "}
                        <strong>
                          BHERA ENCLAVE PASCHIM VIHAR & IDFB0020149
                        </strong>
                      </td>
                      <td colSpan="2" className="text-right">
                        <strong>PAN:</strong> AALFE0496K
                        <br />
                        <strong>Declaration:</strong> We declare that this
                        quotation shows the actual price...
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
