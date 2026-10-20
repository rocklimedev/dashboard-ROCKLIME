import { Alert, Button, Result, Space, Spin } from "antd";
import { Link } from "react-router-dom";
import { LockOutlined } from "@ant-design/icons";
import { useGetBiginStatusQuery } from "../../api/crmApi";
import { useGetProfileQuery } from "../../api/userApi";

export default function ZohoConnectionGate({ children }) {
  const { data, isLoading, isFetching, error, refetch } = useGetBiginStatusQuery(undefined, {
    refetchOnMountOrArgChange: true, pollingInterval: 30000,
  });
  const { data: profile } = useGetProfileQuery();
  if (isLoading) return <div className="page-wrapper"><div className="content"><Spin tip="Checking Zoho connection…" /></div></div>;
  if (error) return <div className="page-wrapper"><div className="content"><Alert type="error" showIcon message="Could not verify the Zoho connection" action={<Button loading={isFetching} onClick={refetch}>Retry</Button>} /></div></div>;
  if (!data?.connected) return <div className="page-wrapper"><div className="content">
    <Result icon={<LockOutlined />} title="Zoho is disconnected" subTitle="Please connect Zoho to continue working in CRM. An administrator can connect it from Connectors."
      extra={<Space>
        {profile?.user?.userId && <Link to={`/u/${profile.user.userId}/connectors`}><Button type="primary">Open Connectors</Button></Link>}
        <Button loading={isFetching} onClick={refetch}>Check connection</Button>
      </Space>} />
  </div></div>;
  return children;
}
