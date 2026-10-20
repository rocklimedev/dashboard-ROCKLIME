import { Alert, Typography } from "antd";
import CrmSettings from "../CRM/CrmSettings";
import useCan from "../../utils/useCan";

export default function Connectors() {
  const can = useCan();
  return <div className="page-wrapper"><div className="content">
    <Typography.Title level={3}>Connectors</Typography.Title>
    <Typography.Paragraph type="secondary">Manage external services and their configuration.</Typography.Paragraph>
    {can("crm", "view") ? <CrmSettings embedded /> : <Alert type="info" showIcon message="No connectors available for your permissions." />}
  </div></div>;
}
