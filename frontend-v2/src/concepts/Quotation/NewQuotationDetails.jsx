// Quotation page: status and follow-ups at the top, then the quotation itself,
// shown as the same PDF the customer receives (the Chhabra Marble format).
import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Button, Space, Typography, Spin, Alert, Select, Tag } from "antd";
import { ArrowLeftOutlined, FileExcelFilled } from "@ant-design/icons";
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
                    onChange={setVersion}
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
                <QuotationPdfActions
                  quotationId={id}
                  version={pdfVersion}
                  style={pdfStyle}
                  onStyleChange={setPdfStyle}
                  cover={pdfCover}
                  onCoverChange={setPdfCover}
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
                refreshKey={`${quotation.updatedAt || ""}-${quotation.status || ""}-${quotation.finalAmount || ""}`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
