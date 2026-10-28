import useApps from './useApps';
import { Link } from 'react-router-dom';
import { LockFilled } from '@ant-design/icons';
import { useGetBiginStatusQuery } from '../api/crmApi';
import './apps.css';

/** The first screen after login: the apps, as icons with their names. */
export default function AppsHome() {
  const apps = useApps();
  const { data: zoho } = useGetBiginStatusQuery(undefined, {
    skip: !apps.some((app) => app.key === 'crm' && !app.locked),
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000,
  });

  return (
    <div className="page-wrapper apps-home">
      <div className="content">
        <nav className="app-icons" aria-label="Apps">
          {apps.map((app) => {
            const locked = app.locked || (app.key === 'crm' && !zoho?.connected);
            const AppLink = locked ? 'span' : Link;
            return (
              <AppLink
                key={app.key}
                {...(locked ? { role: 'link', 'aria-disabled': true } : { to: app.home })}
                className={`app-icon${locked ? ' app-icon--locked' : ''}`}
                title={
                  locked
                    ? app.locked ? 'This app is locked for your role.' : 'Zoho is disconnected. Please connect from Connectors to continue.'
                    : app.description
                }
                aria-label={locked ? `${app.name} — locked` : app.name}
              >
                <span className="app-icon__visual">
                  <span className="app-icon__logo" style={{ background: 'transparent' }}>
                    {app.icon}
                  </span>
                  {locked && (
                    <span className="app-icon__lock" aria-hidden="true">
                      <LockFilled />
                    </span>
                  )}
                </span>
                <span className="app-icon__name">{app.name}</span>
              </AppLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
