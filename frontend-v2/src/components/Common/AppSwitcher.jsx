import useApps from '../../apps/useApps';
import './AppSwitcher.styles.css';
import { Link, useLocation } from 'react-router-dom';
import { Button, Dropdown, Tooltip } from 'antd';
import { AppstoreOutlined, HomeOutlined } from '@ant-design/icons';
import { appForPath } from '../../apps/registry';
import '../../apps/apps.css';

/** Header button: every app in a grid, one click to switch. */
export default function AppSwitcher() {
  const location = useLocation();
  const apps = useApps();
  const current = appForPath(location.pathname, apps, location.search);

  const panel = (
    <div className="ant-dropdown-menu fv2-appswitcher-91241a7909">
      <div className="app-switcher">
        <Link
          to="/"
          className={`app-switcher__item ${location.pathname === '/' ? 'is-current' : ''}`}
        >
          <span className="app-switcher__icon fv2-appswitcher-1683dcff6d">
            <HomeOutlined />
          </span>
          Home
        </Link>
        {apps.filter(app => !app.locked).map((app) => (
          <Link
            key={app.key}
            to={app.home}
            className={`app-switcher__item ${current?.key === app.key ? 'is-current' : ''}`}
          >
            <span className="app-switcher__icon" style={{ background: 'transparent' }}>
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
          icon={<AppstoreOutlined className="fv2-appswitcher-7aa2ed41f5" />}
        />
      </Tooltip>
    </Dropdown>
  );
}
