import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Col, Descriptions, Modal, Row, Select, Space, Switch, Tag, Typography, message } from "antd";
import { ApiOutlined, CloudSyncOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useGetZohoStatusQuery, useZohoAuthorizeMutation, useZohoDisconnectMutation } from "../../api/zohoApi";
import { useGetBiginStatusQuery, useGetBiginPipelinesQuery, useGetCrmMetaQuery, useBiginSyncMutation } from "../../api/crmApi";
import { useGetSettingsQuery, useSaveSettingMutation } from "../../api/settingsApi";
import { baseApi } from "../../store/baseApi";
import useCan, { useRoles } from "../../utils/useCan";
import ZohoIcon from "../../components/Common/ZohoIcon";

const { Title, Text, Paragraph } = Typography;
const centres = [["in", "India"], ["com", "US"], ["eu", "Europe"], ["com.au", "Australia"]].map(([domain, label]) => ({ value: `https://accounts.zoho.${domain}`, label }));

function BiginSettings({ isAdmin }) {
  const { data: status } = useGetBiginStatusQuery();
  const { data: meta } = useGetCrmMetaQuery();
  const { data: settings, error: settingsError } = useGetSettingsQuery();
  const { data: pipelines, error: pipelineError } = useGetBiginPipelinesQuery(undefined, { skip: !status?.connected });
  const [save, { isLoading: saving }] = useSaveSettingMutation();
  const [sync, { isLoading: syncing }] = useBiginSyncMutation();
  const [draft, setDraft] = useState(null);
  const cfg = draft || settings?.data?.crm;
  const set = patch => setDraft(current => ({ ...(current || settings?.data?.crm), ...patch }));
  const stageOptions = useMemo(() => (pipelines?.[cfg?.biginSubPipeline] || Object.values(pipelines || {})[0] || []).map(value => ({ value, label: value })), [pipelines, cfg?.biginSubPipeline]);
  return <Card title="Bigin" style={{ marginTop: 16 }} extra={<Tag color={status?.connected ? "green" : "default"}>{status?.connected ? "Connected" : "Disconnected"}</Tag>}>
    {!status?.connected && <Alert type="info" showIcon message="An administrator can connect company Bigin using Connect Zoho on the connector card." />}
    {status?.connected && <Button icon={<CloudSyncOutlined />} loading={syncing} onClick={async () => { try { const { result } = await sync({ full: true }).unwrap(); message.success(`Bigin: ${result.created} new, ${result.updated} updated, ${result.pushed} sent`); } catch (error) { message.error(error?.data?.message || "Sync failed"); } }}>Full sync now</Button>}
    {pipelineError && <Alert style={{ marginTop: 12 }} type="warning" message={pipelineError?.data?.message || "Could not load Bigin pipelines"} />}
    {settingsError && <Alert type="error" message="Could not load configuration" />}
    {cfg && <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 16 }}>
      <Row gutter={[16, 12]}>
        <Col xs={24} md={12}><Text strong>Bigin pipeline</Text><Select style={{ width: "100%", marginTop: 4 }} disabled={!isAdmin || !status?.connected} value={cfg.biginSubPipeline} onChange={value => set({ biginSubPipeline: value })} options={Object.keys(pipelines || {}).map(value => ({ value, label: value }))} /></Col>
        <Col xs={24} md={12}><Text strong>Sync every 15 minutes</Text><div style={{ marginTop: 8 }}><Switch disabled={!isAdmin} checked={cfg.autoSync} onChange={value => set({ autoSync: value })} /></div></Col>
      </Row>
      <Descriptions size="small" bordered column={1} title="CM stage → Bigin stage">{(meta?.stages || []).map(stage => <Descriptions.Item key={stage.id} label={<Tag color={stage.color}>{stage.label}</Tag>}><Select style={{ width: "100%" }} disabled={!isAdmin || !status?.connected} value={cfg.stageMap?.[stage.id]} onChange={value => set({ stageMap: { ...cfg.stageMap, [stage.id]: value } })} options={stageOptions} /></Descriptions.Item>)}</Descriptions>
      <div><Text strong>Lead sources</Text><Select mode="tags" style={{ width: "100%", marginTop: 4 }} disabled={!isAdmin} value={cfg.sources} onChange={value => set({ sources: value })} tokenSeparators={[","]} /></div>
      <div><Text>A deal is stuck after </Text><Select size="small" disabled={!isAdmin} value={cfg.stuckAfterDays} onChange={value => set({ stuckAfterDays: value })} options={[5, 7, 10, 14, 21, 30].map(value => ({ value, label: `${value} days` }))} /><Text> in one stage.</Text></div>
      {draft && isAdmin && <Button type="primary" loading={saving} onClick={async () => { try { await save({ key: "crm", ...draft }).unwrap(); setDraft(null); message.success("Zoho configuration saved"); } catch (error) { message.error(error?.data?.message || "Could not save configuration"); } }}>Save configuration</Button>}
    </Space>}
  </Card>;
}

export default function ZohoConnector() {
  const can = useCan();
  const roles = useRoles();
  const isAdmin = roles.some(role => ["ADMIN", "SUPER_ADMIN", "DEVELOPER"].includes(role));
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const [manageOpen, setManageOpen] = useState(false);
  const [centre, setCentre] = useState("https://accounts.zoho.in");
  const { data: status, error, isFetching, refetch } = useGetZohoStatusQuery(undefined, { refetchOnMountOrArgChange: true });
  const [authorize, { isLoading: connecting }] = useZohoAuthorizeMutation();
  const [disconnect, { isLoading: disconnecting }] = useZohoDisconnectMutation();
  useEffect(() => {
    const result = params.get("zoho");
    if (!result) return;
    if (result === "connected") message.success("Zoho connected");
    else message.error("Zoho could not be connected. Please try again.");
    const next = new URLSearchParams(params);
    next.delete("zoho");
    setParams(next, { replace: true });
    dispatch(baseApi.util.invalidateTags(["Zoho", "Cliq", "Crm"]));
  }, [params, setParams, dispatch]);
  const connect = async () => {
    try { const result = await authorize(status?.connected ? status.accountsUrl : centre).unwrap(); window.location.assign(result.url); }
    catch (error) { message.error(error?.data?.message || "Could not start Zoho sign-in"); }
  };
  return <>
    <Card>
      <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
        <Space size={16}><ZohoIcon /><div><Title level={5} style={{ margin: 0 }}>ZOHO</Title><Text type="secondary">One connection for Zoho services.</Text><div><Tag color={status?.connected ? "green" : "default"}>{status?.connected ? "Connected" : "Disconnected"}</Tag></div></div></Space>
        <Space wrap>
          {!status?.connected && <Select aria-label="Zoho data centre" value={centre} onChange={setCentre} options={centres} style={{ width: 130 }} />}
          <Button type="primary" icon={<ApiOutlined />} disabled={!status?.configured || !!error} loading={connecting} onClick={connect}>{status?.connected ? "Reconnect Zoho" : "Connect Zoho"}</Button>
          <Button onClick={() => setManageOpen(true)}>Manage</Button>
          {status?.connected && <Button danger loading={disconnecting} onClick={() => Modal.confirm({ title: "Disconnect Zoho?", content: status.ownsBigin ? "This disconnects your Cliq account and stops company Bigin sync. CRM will be locked until Zoho is reconnected." : "This disconnects Zoho services for your account.", okText: "Disconnect", okButtonProps: { danger: true }, onOk: async () => { try { await disconnect().unwrap(); message.success("Zoho disconnected"); } catch (error) { message.error(error?.data?.message || "Could not disconnect Zoho"); throw error; } } })}>Disconnect</Button>}
        </Space>
      </Space>
      {error && <Alert style={{ marginTop: 12 }} type="error" message="Could not load Zoho connection" action={<Button loading={isFetching} onClick={refetch}>Retry</Button>} />}
      {status && !status.configured && <Alert style={{ marginTop: 12 }} type="info" message="Configure the Zoho OAuth client on the server before connecting." />}
    </Card>
    <Modal title="Manage Zoho" open={manageOpen} onCancel={() => setManageOpen(false)} width={850} footer={null}>
      <Card title="Zoho authorization"><Paragraph>Authorize once from the Zoho card. Cliq uses your account; an administrator's connection also authorizes company Bigin.</Paragraph><Text type="secondary">OAuth callback: </Text><Text code copyable>{status?.redirectUri || "—"}</Text></Card>
      <Card title="Cliq" style={{ marginTop: 16 }} extra={<Tag color={status?.services?.cliq ? "green" : "default"}>{status?.services?.cliq ? "Connected" : "Disconnected"}</Tag>}><Text type="secondary">Your chats, channels and people are available from the navbar chat icon after connecting Zoho.</Text></Card>
      {can("crm", "view") && <BiginSettings isAdmin={isAdmin} />}
    </Modal>
  </>;
}
