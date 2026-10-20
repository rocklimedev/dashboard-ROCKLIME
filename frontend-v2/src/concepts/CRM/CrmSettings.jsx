import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Alert, message, Button, Card, Col, Descriptions, Input, Modal, Row, Select, Space, Switch, Tag, Typography } from "antd";
import { ApiOutlined, CheckCircleFilled, CloudSyncOutlined, DisconnectOutlined, KeyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useBiginAuthorizeMutation,
  useBiginDisconnectMutation,
  useBiginSyncMutation,
  useBiginTokenMutation,
  useGetBiginPipelinesQuery,
  useGetBiginStatusQuery,
  useGetCrmMetaQuery,
} from "../../api/crmApi";
import { useGetSettingsQuery, useSaveSettingMutation } from "../../api/settingsApi";
import { useRoles } from "../../utils/useCan";
import { useGetProfileQuery } from "../../api/userApi";
import ZohoIcon from "../../components/Common/ZohoIcon";
import "./crm.css";

const { Title, Text, Paragraph } = Typography;
const ADMIN = ["SUPER_ADMIN", "ADMIN", "DEVELOPER"];
const DCS = [
  { value: "https://accounts.zoho.in", label: "India (zoho.in)" },
  { value: "https://accounts.zoho.com", label: "US (zoho.com)" },
  { value: "https://accounts.zoho.eu", label: "Europe (zoho.eu)" },
  { value: "https://accounts.zoho.com.au", label: "Australia" },
];

/** Personal Connectors page → Zoho; service configuration lives in Manage. */
export default function CrmSettings({ embedded = false }) {
  const { data: profile, isLoading, error } = useGetProfileQuery(undefined, { skip: embedded });
  const [params] = useSearchParams();
  if (embedded) return <ZohoConnector />;
  if (isLoading) return <div className="page-wrapper">Loading account settings…</div>;
  if (error || !profile?.user?.userId) return <Alert type="error" message="Could not load account settings" />;
  return <Navigate replace to={`/u/${profile.user.userId}/connectors${params.size ? `?${params}` : ""}`} />;
}

function ZohoConnector() {
  const [params, setParams] = useSearchParams();
  const roles = useRoles();
  const isAdmin = roles.some((r) => ADMIN.includes(r));
  const { data: st, refetch } = useGetBiginStatusQuery();
  const { data: meta } = useGetCrmMetaQuery();
  const { data: settings } = useGetSettingsQuery();
  const [saveSetting, { isLoading: saving }] = useSaveSettingMutation();
  const { data: pipelines, error: pipeErr } = useGetBiginPipelinesQuery(undefined, { skip: !st?.connected });
  const [authorize, { isLoading: authorizing }] = useBiginAuthorizeMutation();
  const [connectToken, { isLoading: connecting }] = useBiginTokenMutation();
  const [sync, { isLoading: syncing }] = useBiginSyncMutation();
  const [disconnect] = useBiginDisconnectMutation();
  const [dc, setDc] = useState("https://accounts.zoho.in");
  const [tokenOpen, setTokenOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState("");
  const crm = settings?.data?.crm;
  const [draft, setDraft] = useState(null);
  const cfg = draft || crm;

  // back from Zoho
  useEffect(() => {
    const r = params.get("bigin");
    if (!r) return;
    if (r === "connected") message.success("Zoho Bigin connected");
    else message.error(params.get("message") || "Could not connect Zoho Bigin");
    const next = new URLSearchParams(params);
    next.delete("bigin");
    next.delete("message");
    setParams(next, { replace: true });
    refetch();
  }, [params, setParams, message, refetch]);

  const stageOptions = useMemo(() => {
    const list = pipelines?.[cfg?.biginSubPipeline] || Object.values(pipelines || {})[0] || ["Qualification", "Needs Analysis", "Proposal/Price Quote", "Negotiation/Review", "Closed Won", "Closed Lost"];
    return list.map((s) => ({ value: s, label: s }));
  }, [pipelines, cfg?.biginSubPipeline]);

  const connect = async () => {
    try {
      const { url } = await authorize(dc).unwrap();
      window.location.href = url;
    } catch (e) {
      message.error(e?.data?.message || "Could not start the Zoho sign-in");
    }
  };

  const save = async () => {
    try {
      await saveSetting({ key: "crm", ...draft }).unwrap();
      setDraft(null);
      message.success("CRM settings saved");
    } catch (e) {
      message.error(e?.data?.message || "Could not save");
    }
  };

  const set = (patch) => setDraft({ ...(draft || crm), ...patch });
  const r = st?.lastSyncResult;

  return (
    <div>
      <Card>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space size={16}>
            <ZohoIcon />
            <div>
              <Title level={5} style={{ margin: 0 }}>ZOHO</Title>
              <Text type="secondary">Manage Zoho services, connections and configuration.</Text>
            </div>
          </Space>
          <Button onClick={() => setManageOpen(true)}>Manage</Button>
        </Space>
      </Card>

      <Modal title="Manage Zoho" open={manageOpen} width={850} footer={null} onCancel={() => setManageOpen(false)}>

      <Card title="Bigin" className="crm-bigin-card">
        <div className="crm-bigin">
          <div style={{ display: "flex", alignItems: "center" }}>
            <ZohoIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {st?.connected ? (
              <>
                <Title level={5} style={{ margin: 0 }}>
                  <CheckCircleFilled style={{ color: "#389e0d" }} /> Connected{st.orgName ? ` to ${st.orgName}` : ""}
                </Title>
                <Text type="secondary">
                  {st.lastSyncAt ? `Last sync ${dayjs(st.lastSyncAt).format("D MMM YYYY, h:mm a")}` : "Not synced yet"}
                  {r ? ` · ${r.created} new, ${r.updated} updated, ${r.pushed} sent${r.failed ? `, ${r.failed} failed` : ""}` : ""}
                </Text>
              </>
            ) : (
              <>
                <Title level={5} style={{ margin: 0 }}>
                  Not connected
                </Title>
                <Text type="secondary">An administrator connects Bigin once; every salesperson's deals then go to Bigin.</Text>
              </>
            )}
          </div>
          <Space wrap>
            {st?.connected ? (
              <>
                <Button
                  type="primary"
                  icon={<CloudSyncOutlined />}
                  loading={syncing}
                  onClick={() =>
                    sync({ full: true })
                      .unwrap()
                      .then(({ result: x }) => message.success(`Bigin: ${x.created} new, ${x.updated} updated, ${x.pushed} sent`))
                      .catch((e) => message.error(e?.data?.message || "Sync failed"))
                  }
                >
                  Full sync now
                </Button>
                {isAdmin && (
                  <Button
                    danger
                    icon={<DisconnectOutlined />}
                    onClick={() =>
                      Modal.confirm({
                        title: "Disconnect Zoho Bigin?",
                        content: "Deals stay in CM ERP and in Bigin; changes stop being copied.",
                        okText: "Disconnect",
                        okButtonProps: { danger: true },
                        onOk: () => disconnect().unwrap().then(() => message.success("Disconnected")),
                      })
                    }
                  >
                    Disconnect
                  </Button>
                )}
              </>
            ) : isAdmin ? (
              <>
                <Select value={dc} onChange={setDc} options={DCS} style={{ width: 170 }} />
                <Button type="primary" icon={<ApiOutlined />} loading={authorizing} disabled={!st?.configured} onClick={connect}>
                  Connect Zoho Bigin
                </Button>
                <Button icon={<KeyOutlined />} disabled={!st?.configured} onClick={() => setTokenOpen(true)}>
                  Use a refresh token
                </Button>
              </>
            ) : (
              <Tag>Ask an administrator to connect</Tag>
            )}
          </Space>
        </div>
        {st && !st.configured && (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message="One-time setup on the server"
            description={
              <div>
                <Paragraph style={{ marginBottom: 6 }}>
                  In <a href="https://api-console.zoho.in" target="_blank" rel="noreferrer">api-console.zoho.in</a> create a <b>Server-based Application</b> (or open the client INOS uses) and add this redirect URI:
                </Paragraph>
                <Paragraph copyable code style={{ marginBottom: 6 }}>
                  {st.redirectUri}
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  Then put <Text code>ZOHO_CLIENT_ID</Text> and <Text code>ZOHO_CLIENT_SECRET</Text> in <Text code>backend/.env</Text> and restart the backend.
                </Paragraph>
              </div>
            }
          />
        )}
        {st?.connected && pipeErr && <Alert style={{ marginTop: 16 }} type="warning" showIcon message={`Could not read Bigin pipelines: ${pipeErr?.data?.message || "error"}`} />}
      </Card>

      {cfg && (
        <Card title="How deals go to Bigin" style={{ marginTop: 16 }} extra={draft && isAdmin && <Button type="primary" loading={saving} onClick={save}>Save</Button>}>
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Text strong>Bigin pipeline</Text>
              <Select
                style={{ width: "100%", marginTop: 4 }}
                disabled={!isAdmin}
                value={cfg.biginSubPipeline}
                onChange={(v) => set({ biginSubPipeline: v })}
                options={(pipelines ? Object.keys(pipelines) : [cfg.biginSubPipeline]).map((p) => ({ value: p, label: p }))}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>Sync every 15 minutes</Text>
              <div style={{ marginTop: 8 }}>
                <Switch disabled={!isAdmin} checked={cfg.autoSync} onChange={(v) => set({ autoSync: v })} /> <Text type="secondary">Changes made in Bigin come back on their own</Text>
              </div>
            </Col>
          </Row>
          <Descriptions column={{ xs: 1, md: 2 }} size="small" bordered style={{ marginTop: 16 }} title={<Text strong>CM stage → Bigin stage</Text>}>
            {(meta?.stages || []).map((s) => (
              <Descriptions.Item key={s.id} label={<Tag color={s.color}>{s.label}</Tag>}>
                <Select size="small" style={{ width: "100%" }} disabled={!isAdmin} value={cfg.stageMap?.[s.id]} onChange={(v) => set({ stageMap: { ...cfg.stageMap, [s.id]: v } })} options={stageOptions} />
              </Descriptions.Item>
            ))}
          </Descriptions>
          <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
            A deal created here is sent to Bigin with its contact (found by mobile or email, or created). Deleting a deal here deletes it in Bigin. A deal Won here through an order is not moved back by Bigin.
          </Paragraph>
        </Card>
      )}

      {cfg && (
        <Card title="Lead sources" style={{ marginTop: 16 }}>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            disabled={!isAdmin}
            value={cfg.sources}
            onChange={(v) => set({ sources: v })}
            tokenSeparators={[","]}
          />
          <div style={{ marginTop: 12 }}>
            <Text>A deal is "stuck" after </Text>
            <Select size="small" disabled={!isAdmin} value={cfg.stuckAfterDays} onChange={(v) => set({ stuckAfterDays: v })} options={[5, 7, 10, 14, 21, 30].map((n) => ({ value: n, label: `${n} days` }))} />
            <Text> in one stage.</Text>
          </div>
        </Card>
      )}
      {draft && isAdmin && <Button type="primary" loading={saving} onClick={save} style={{ marginTop: 16 }}>Save configuration</Button>}
      </Modal>

      <Modal
        open={tokenOpen}
        title="Connect with a Self Client refresh token"
        okText="Connect"
        confirmLoading={connecting}
        onCancel={() => setTokenOpen(false)}
        onOk={async () => {
          try {
            await connectToken({ refreshToken, accountsUrl: dc }).unwrap();
            message.success("Zoho Bigin connected");
            setTokenOpen(false);
            setRefreshToken("");
          } catch (e) {
            message.error(e?.data?.message || "Zoho refused the token");
          }
        }}
      >
        <Paragraph type="secondary">
          In the Zoho API console open Self Client → Generate Code with scope <Text code>ZohoBigin.modules.ALL,ZohoBigin.settings.ALL,ZohoBigin.users.READ,ZohoBigin.org.READ</Text>, swap it for a refresh token and paste it here.
        </Paragraph>
        <Input.Password value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)} placeholder="1000.xxxxxxxx" autoComplete="off" />
      </Modal>
    </div>
  );
}
