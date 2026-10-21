import { Button, Card, Col, Empty, Row } from 'antd';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/Common/PageHeader';
import useCan, { useRoles } from '../../utils/useCan';
import { visibleApps } from '../../apps/registry';

export default function SettingsHome() {
  const can = useCan();
  const roles = useRoles();
  const sections = visibleApps(can, roles).find((app) => app.key === 'settings')?.items || [];
  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Settings"
          subtitle="Manage company documents, users, roles and maintenance"
        />
        <Row gutter={[16, 16]}>
          {sections.map((section) => (
            <Col xs={24} md={12} key={section.to}>
              <Card
                title={
                  <>
                    {section.icon} {section.label}
                  </>
                }
              >
                <Link to={section.to}>
                  <Button>Open {section.label}</Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
        {!sections.length && (
          <Empty description="No administration sections are available for your role. Contact your administrator to request access." />
        )}
      </div>
    </div>
  );
}
