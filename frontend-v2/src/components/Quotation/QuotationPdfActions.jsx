import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Segmented,
  Space,
  Spin,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  ShareAltOutlined,
  WhatsAppOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { API_URL } from "../../store/config";
import { fetchPdf, token } from "./quotationPdf";
import { baseApi } from "../../store/baseApi";

const { Text } = Typography;

const STYLES = [
  { value: "detailed", label: "With photos" },
  { value: "compact", label: "Compact" },
];
const STYLE_HELP = {
  detailed: "Room by room with product photos, MRP, discount and rate.",
  compact: "Room by room with product codes instead of photos — smaller file.",
};

/**
 * New-format quotation PDF: preview, download and share a customer link.
 * Figures come from the server, so they always match the saved quotation.
 */
export default function QuotationPdfActions({
  quotationId,
  resourcePath = null,
  documentLabel = "Quotation",
  allowShare = true,
  version = null,
  // optional: let the page own the options (the details page shows the PDF itself)
  style: styleProp,
  onStyleChange,
  cover: coverProp,
  onCoverChange,
  showPreview = true,
  exportOptions,
  pageOrder,
}) {
  const dispatch = useDispatch();
  const [styleState, setStyleState] = useState("detailed");
  const [coverState, setCoverState] = useState(true);
  const style = styleProp ?? styleState;
  const cover = coverProp ?? coverState;
  const setStyle = onStyleChange || setStyleState;
  const setCover = onCoverChange || setCoverState;
  const [busy, setBusy] = useState(null);
  const [preview, setPreview] = useState(null); // { url, name }
  const [share, setShare] = useState(null);

  useEffect(
    () => () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );

  const run = async (kind) => {
    setBusy(kind);
    try {
      const { blob, name } = await fetchPdf(quotationId, { style, cover, version, exportOptions, pageOrder, resourcePath, documentLabel });
      const url = URL.createObjectURL(blob);
      if (kind === "preview") {
        setPreview({ url, name });
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const makeLink = async () => {
    setBusy("share");
    try {
      const r = await fetch(`${API_URL}${resourcePath || `/quotation/${quotationId}`}/share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ style, cover }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Could not create a link");
      setShare(data);
      // Sharing moves a Draft quotation to Sent
      if (!resourcePath) dispatch(baseApi.util.invalidateTags(["Quotations", { type: "Quotations", id: quotationId }]));
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const copy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      message.success("Copied");
    } catch {
      message.info("Select the text and copy it");
    }
  };

  return (
    <>
      <Space wrap size={8}>
        <Tooltip title={STYLE_HELP[style]}>
          <Segmented size="middle" value={style} onChange={setStyle} options={STYLES} />
        </Tooltip>
        <Checkbox checked={cover} onChange={(e) => setCover(e.target.checked)}>
          Cover page
        </Checkbox>
        {showPreview && (
          <Button icon={<EyeOutlined />} loading={busy === "preview"} onClick={() => run("preview")}>
            Preview
          </Button>
        )}
        <Button type="primary" icon={<DownloadOutlined />} loading={busy === "download"} onClick={() => run("download")}>
          PDF
        </Button>
        {allowShare && <Button disabled={!!pageOrder || !!exportOptions?.hidden?.length} title={pageOrder || exportOptions?.hidden?.length ? `Reset export options to share the standard ${documentLabel.toLowerCase()} link` : undefined} icon={<ShareAltOutlined />} loading={busy === "share"} onClick={makeLink}>
          Share
        </Button>}
      </Space>

      <Modal
        open={!!preview}
        onCancel={() => setPreview(null)}
        title={preview?.name}
        width="min(1000px, 96vw)"
        zIndex={2000}
        footer={[
          <Button key="close" onClick={() => setPreview(null)}>
            Close
          </Button>,
          <Button key="dl" type="primary" icon={<DownloadOutlined />} href={preview?.url} download={preview?.name}>
            Download
          </Button>,
        ]}
        styles={{ body: { padding: 0 } }}
      >
        {preview ? (
          <iframe title={`${documentLabel} PDF`} src={preview.url} style={{ width: "100%", height: "78vh", border: 0 }} />
        ) : (
          <Spin />
        )}
      </Modal>

      <Modal
        open={!!share}
        onCancel={() => setShare(null)}
        title="Share with the customer"
        zIndex={2000}
        footer={null}
      >
        {share && (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Text type="secondary">
              Anyone with this link can open the {STYLES.find((s) => s.value === style)?.label.toLowerCase()} PDF
              for {share.expiresInDays} days — no login needed.
            </Text>
            <Space.Compact style={{ width: "100%" }}>
              <Input value={share.url} readOnly />
              <Button icon={<CopyOutlined />} onClick={() => copy(share.url)} />
            </Space.Compact>
            <Input.TextArea value={share.message} rows={4} readOnly />
            <Space wrap>
              <Button
                type="primary"
                icon={<WhatsAppOutlined />}
                href={share.whatsapp}
                target="_blank"
                rel="noreferrer"
                style={{ background: "#25D366", borderColor: "#25D366" }}
              >
                Send on WhatsApp
              </Button>
              <Button icon={<CopyOutlined />} onClick={() => copy(share.message)}>
                Copy message
              </Button>
            </Space>
          </Space>
        )}
      </Modal>
    </>
  );
}
