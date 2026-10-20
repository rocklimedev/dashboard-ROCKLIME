import { Typography } from "antd";
import ZohoConnector from "../Zoho/ZohoConnector";

export default function Connectors() {
  return <div className="page-wrapper"><div className="content">
    <Typography.Title level={3}>Connectors</Typography.Title>
    <Typography.Paragraph type="secondary">Manage external services and their configuration.</Typography.Paragraph>
    <ZohoConnector />
  </div></div>;
}
