import { Button, Result, Space, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function AccessDenied({ permission }) {
  const location = useLocation();
  const navigate = useNavigate();
  const required = permission || location.state?.requiredPermission;

  return (
    <div className="page-wrapper">
      <div className="content">
        <Result
          status="403"
          title="Sorry, you can't access this page"
          subTitle="Your user or role does not have the required permission. Please contact your administrator to request access."
          extra={
            <Space wrap>
              <Button onClick={() => navigate(-1)}>Go back</Button>
              <Link to="/">
                <Button type="primary">All apps</Button>
              </Link>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
            <Typography.Text>
              Page: <Typography.Text code>{location.pathname}</Typography.Text>
            </Typography.Text>
            <Typography.Text strong>
              Required {required?.adminOnly ? 'role' : 'permission'}:{' '}
              {required?.adminOnly
                ? 'ADMIN, SUPER_ADMIN or DEVELOPER'
                : required?.module
                  ? `${required.module} → ${required.action || required.api || 'view'}`
                  : 'Please ask your administrator to review your page permissions.'}
            </Typography.Text>
          </Space>
        </Result>
      </div>
    </div>
  );
}
