import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Dropdown, Tooltip } from 'antd';
import { AppstoreOutlined, HomeOutlined } from '@ant-design/icons';
import useCan, { useRoles } from '../../utils/useCan';
import { appForPath, visibleApps } from '../../apps/registry';
import '../../apps/apps.css';

/** Header button: every app in a grid, one click to switch. */
export default function AppSwitcher() {
  const location = useLocation();
  const can = useCan();
  const roles = useRoles();
  const apps = useMemo(() => visibleApps(can, roles), [can, roles]);
  const current = appForPath(location.pathname, apps, location.search);

  const panel = (
    <div className="ant-dropdown-menu" style={{ padding: 0 }}>
      <div className="app-switcher">
        <Link
          to="/"
          className={`app-switcher__item ${location.pathname === '/' ? 'is-current' : ''}`}
        >
          <span className="app-switcher__icon" style={{ background: '#262626' }}>
            <HomeOutlined />
          </span>
          Home
        </Link>
        {apps.map((app) => (
          <Link
            key={app.key}
            to={app.home}
            className={`app-switcher__item ${current?.key === app.key ? 'is-current' : ''}`}
          >
            <span className="app-switcher__icon" style={{ background: app.color }}>
              {app.icon}
            </span>
            {app.name}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <Dropdown dropdownRender={() => panel} trigger={['click']} placement="bottomRight">
      <Tooltip title="Apps" placement="bottom">
        <Button
          type="text"
          aria-label="Apps"
          icon={<AppstoreOutlined style={{ fontSize: 19 }} />}
        />
      </Tooltip>
    </Dropdown>
  );
}
