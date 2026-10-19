// Quotation page: status and follow-ups at the top, then the quotation itself,
// shown as the same PDF the customer receives (the Chhabra Marble format).
import { useCallback, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Button, Space, Typography, Spin, Alert, Select, Tag, Dropdown, Checkbox, Divider } from "antd";
import { ArrowLeftOutlined, FileExcelFilled, SettingOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import logo from "../../assets/img/logo-quotation.png";
import { useGetQuotationByIdQuery, useGetQuotationVersionsQuery, useCloneQuotationMutation } from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { exportToExcel } from "../../components/Quotation/hooks/exportHelpers";
import QuotationPdfActions from "../../components/Quotation/QuotationPdfActions";
import QuotationPdfFrame from "../../components/Quotation/QuotationPdfFrame";
import { QuotationPipelineBar } from "../../components/Quotation/QuotationPipeline";
import { orderStateFromQuotation } from "../../components/Quotation/convertToOrder";
import useCan from "../../utils/useCan";

dayjs.extend(relativeTime);
const { Title, Text } = Typography;

const asList = (data) => {
  let v = data;
  for (let i = 0; i < 3 && typeof v === "string"; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v : [];
};
const titleFor = (gender) => ({ male: "Mr.", female: "Ms." })[(gender || "").toLowerCase()] || "";

export default function NewQuotationsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  const [version, setVersion] = useState("current");
  const [pdfStyle, setPdfStyle] = useState("detailed");
  const [pdfCover, setPdfCover] = useState(true);
  const [exportOptions, setExportOptions] = useState({ hidden: [] });
  const [pages, setPages] = useState([]);
  const [pageOrder, setPageOrder] = useState(null);
  const onPagesChange = useCallback((next) => setPages(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next), []);
  const resetPages = () => { setPageOrder(null); setPages([]); };
  const selectedPages = pageOrder ?? pages.map(p => p.id);
  const movePage = (index, direction) => {
    const next = [...selectedPages];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setPageOrder(next);
  };
  const [isExporting, setIsExporting] = useState(false);

  const { data: quotation, isLoading: qLoading, error: qError } = useGetQuotationByIdQuery(id);
  const { data: versionsData } = useGetQuotationVersionsQuery(id);
  const [cloneQuotation] = useCloneQuotationMutation();

  // saved versions, newest first; "current" is the live quotation
  const versions = useMemo(
    () => (Array.isArray(versionsData) ? [...versionsData] : []).sort((a, b) => (b.version || 0) - (a.version || 0)),
    [versionsData],
  );
  const versionObj = versions.find((v) => v.version === version);
  const shown = versionObj?.quotationData ? { ...quotation, ...versionObj.quotationData } : quotation || {};
  const items = versionObj ? asList(versionObj.quotationItems) : asList(quotation?.products || quotation?.items);

  const { data: customerResponse } = useGetCustomerByIdQuery(shown.customerId, { skip: !shown.customerId });
  const { data: addressResponse } = useGetAddressByIdQuery(shown.shipTo, { skip: !shown.shipTo });
  const customer = customerResponse?.data;
  const address = addressResponse || {};
  const customerName = customer?.name ? customer.displayName || `${customer.title || titleFor(customer.gender)} ${customer.name}`.trim() : "";

  const handleExcel = async () => {
    setIsExporting(true);
    try {
      const products = items
        .filter((p) => p.isOptionFor == null)
        .map((p) => ({ ...p, companyCode: p.companyCode || p.productCode || "—" }))
        .sort((a, b) => Number(a.priority ?? 9999) - Number(b.priority ?? 9999));
      await exportToExcel({
        products,
        brandNames: "",
        customerName: customerName || "Dear Client",
        quotation: shown,
        address: [address.street, address.city, address.state].filter(Boolean).join(", ") + (address.postalCode ? ` - ${address.postalCode}` : ""),
        logo,
        id,
        activeVersion: version,
        exportOptions,
      });
      message.success("Excel exported");
    } catch {
      message.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (qLoading) return <Spin size="large" style={{ marginTop: 100, display: "block", textAlign: "center" }} />;
  if (qError || !quotation) return <Alert message="Quotation not found" type="error" showIcon style={{ margin: 40 }} />;

  const pdfVersion = version !== "current" ? version : null;

  return (
    <>
      <Helmet>
        <title>
          {quotation.reference_number || "Quotation"} · {customerName || quotation.document_title || ""}
        </title>
      </Helmet>
      <div className="page-wrapper">
        <div className="content" style={{ padding: 0 }}>
          <div style={{ padding: "14px 24px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 260 }}>
                <Space size={8} align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {quotation.reference_number || "Quotation"}
                  </Title>
                  {version !== "current" && <Tag color="blue">Version {version}</Tag>}
                </Space>
                <div style={{ marginTop: 2 }}>
                  <Text type="secondary">{[customerName, quotation.document_title].filter(Boolean).join(" · ") || "No customer"}</Text>
                </div>
              </div>
              <Space size={10} wrap align="center">
                {versions.length > 0 && (
                  <Select
                    value={version}
                    onChange={(value) => { setVersion(value); resetPages(); }}
                    style={{ width: 190 }}
                    options={[
                      { value: "current", label: "Current version" },
                      ...versions.map((v) => ({
                        value: v.version,
                        label: `Version ${v.version}${v.updatedAt ? ` · ${dayjs(v.updatedAt).fromNow()}` : ""}`,
                      })),
                    ]}
                  />
                )}
                <Dropdown trigger={["click"]} placement="bottomRight" dropdownRender={() => (
                  <div style={{ background: "white", padding: 16, width: 340, maxHeight: "70vh", overflowY: "auto", borderRadius: 10, boxShadow: "0 8px 24px #0002" }}>
                    <Text strong>Export fields (PDF & Excel)</Text>
                    <div style={{ marginTop: 8 }}>
                      {[["image", "Image"], ["name", "Product name"], ["code", "Company code"], ["sno", "S.No"], ["qty", "Quantity"], ["mrp", "MRP"], ["price", "Unit price"], ["discount", "Discount"], ["total", "Amount"], ["roomTotals", "Room totals"]].map(([key, label]) => (
                        <div key={key}><Checkbox checked={!exportOptions.hidden.includes(key)} onChange={e => {
                          const checked = e.target.checked;
                          resetPages();
                          setExportOptions(current => ({ hidden: checked ? current.hidden.filter(k => k !== key) : [...current.hidden, key] }));
                        }}>{label}</Checkbox></div>
                      ))}
                    </div>
                    <Divider style={{ margin: "12px 0" }} />
                    <Text strong>PDF pages — include & order</Text>
                    <div><Text type="secondary">Room pages appear after the preview loads. Excluding pages does not change quotation totals.</Text></div>
                    {[...pages].sort((a, b) => {
                      const ai = selectedPages.indexOf(a.id), bi = selectedPages.indexOf(b.id);
                      return (ai < 0 ? pages.length + a.id : ai) - (bi < 0 ? pages.length + b.id : bi);
                    }).map(page => {
                      const index = selectedPages.indexOf(page.id);
                      return <div key={page.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                        <Checkbox style={{ flex: 1 }} checked={index >= 0} disabled={index >= 0 && selectedPages.length === 1} onChange={e => setPageOrder(e.target.checked ? [...selectedPages, page.id] : selectedPages.filter(i => i !== page.id))}>{page.id + 1}. {page.label}{index >= 0 ? ` (export ${index + 1})` : ""}</Checkbox>
                        <Button size="small" aria-label={`Move ${page.label} up`} icon={<ArrowUpOutlined />} disabled={index <= 0} onClick={() => movePage(index, -1)} />
                        <Button size="small" aria-label={`Move ${page.label} down`} icon={<ArrowDownOutlined />} disabled={index < 0 || index === selectedPages.length - 1} onClick={() => movePage(index, 1)} />
                      </div>;
                    })}
                    <Button type="link" block onClick={() => { setExportOptions({ hidden: [] }); resetPages(); setPdfCover(true); }}>Reset defaults</Button>
                  </div>
                )}><Button icon={<SettingOutlined />}>Export options</Button></Dropdown>
                <QuotationPdfActions
                  quotationId={id}
                  version={pdfVersion}
                  style={pdfStyle}
                  onStyleChange={(value) => { setPdfStyle(value); resetPages(); }}
                  cover={pdfCover}
                  onCoverChange={(value) => { setPdfCover(value); resetPages(); }}
                  exportOptions={exportOptions}
                  pageOrder={pageOrder}
                  showPreview={false}
                />
                <Button loading={isExporting} onClick={handleExcel} icon={<FileExcelFilled />}>
                  Excel
                </Button>
                <Button onClick={() => navigate("/quotations/list")} icon={<ArrowLeftOutlined />}>
                  Back
                </Button>
              </Space>
            </div>
          </div>

          <div style={{ padding: "0 24px" }}>
            <QuotationPipelineBar
              quotation={quotation}
              canEdit={can("quotations", "edit")}
              canConvert={can("orders", "write")}
              onConvert={() => navigate("/order/add", { state: orderStateFromQuotation(quotation) })}
              onEdit={() => navigate(`/quotation/${id}/edit`, { state: { quotation } })}
              onDuplicate={
                can("quotations", "write")
                  ? async () => {
                      try {
                        const r = await cloneQuotation(id).unwrap();
                        const newId = r?.clonedQuotation?.quotationId;
                        message.success("Copy created as a draft");
                        if (newId) navigate(`/quotation/${newId}`);
                      } catch (e) {
                        message.error(e?.data?.message || "Could not duplicate");
                      }
                    }
                  : undefined
              }
            />
          </div>

          {/* The quotation exactly as the customer receives it */}
          <div style={{ padding: "16px 24px 32px", background: "#f6f6f6" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <QuotationPdfFrame
                quotationId={id}
                version={pdfVersion}
                style={pdfStyle}
                cover={pdfCover}
                exportOptions={exportOptions}
                pageOrder={pageOrder}
                onPagesChange={onPagesChange}
                refreshKey={`${quotation.updatedAt || ""}-${quotation.status || ""}-${quotation.finalAmount || ""}`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
