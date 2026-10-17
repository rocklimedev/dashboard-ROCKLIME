import { useMemo } from "react";
import { Link } from "react-router-dom";
import useCan, { useRoles } from "../utils/useCan";
import { visibleApps } from "./registry";
import "./apps.css";

/** The first screen after login: the apps, as icons with their names. */
export default function AppsHome() {
  const can = useCan();
  const roles = useRoles();
  const apps = useMemo(() => visibleApps(can, roles), [can, roles]);

  return (
    <div className="page-wrapper apps-home">
      <div className="content">
        <nav className="app-icons" aria-label="Apps">
          {apps.map((app) => (
            <Link key={app.key} to={app.home} className="app-icon" title={app.description}>
              <span className="app-icon__logo" style={{ background: app.color }}>
                {app.icon}
              </span>
              <span className="app-icon__name">{app.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
