import { useEffect, useMemo } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronsLeft } from "react-feather";
import { ArrowLeftOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import useCan, { useRoles } from "../../utils/useCan";
import { appForPath, visibleApps } from "../../apps/registry";

const LAST_APP = "cm.app";
const readLast = () => {
  try {
    return sessionStorage.getItem(LAST_APP);
  } catch {
    return null;
  }
};

/**
 * The sidebar of the app you are in: its name and its menu, nothing else.
 * "All apps" goes back to the apps home; the header's app switcher jumps
 * straight to another app. Pages shared by two apps (an order opened from
 * Operations) keep the app you came from.
 */
export default function AppSidebar({ isSidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const can = useCan();
  const roles = useRoles();
  const { auth } = useAuth();
  const personal = location.pathname.startsWith("/u/");
  const userId = auth?.user?.userId;
  const apps = useMemo(() => visibleApps(can, roles), [can, roles]);
  const current = personal ? {
    key: "personal", name: "My account",
    items: userId ? [
      { label: "My profile", to: `/u/${userId}`, icon: <UserOutlined /> },
      { label: "Account settings", to: `/u/${userId}/settings`, icon: <SettingOutlined /> },
    ] : [],
  } : appForPath(location.pathname, apps, location.search, readLast());

  useEffect(() => {
    if (!current || personal) return;
    try {
      sessionStorage.setItem(LAST_APP, current.key);
    } catch {
      /* private mode */
    }
  }, [current, personal]);

  const here = `${location.pathname}${location.search}`;
  const items = current?.items || [];
  const itemActive = (to) => {
    if (to.includes("?")) return here === to;
    // a plain link is active on its page unless a "?tab=" link of the same page matches better
    if (location.pathname !== to) return false;
    return !items.some((i) => i.to.includes("?") && i.to === here);
  };

  return (
    <div className={`sidebar cm-app-sidebar d-flex flex-column ${isSidebarOpen ? "active" : ""}`} id="sidebar">
      <div className={`sidebar-logo ${isSidebarOpen ? "active" : ""}`}>
        <NavLink to="/" className="logo logo-normal">
          <img src={logo} alt="Chhabra Marble" />
        </NavLink>
        <NavLink to="/" className="logo-small">
          <img src={logo_small} alt="CM" />
        </NavLink>
        <NavLink to="/" className="logo logo-white">
          <img src={logo} alt="Chhabra Marble" />
        </NavLink>
        <a
          id="toggle_btn"
          href="#"
          aria-label="Collapse menu"
          onClick={(e) => {
            e.preventDefault();
            toggleSidebar(!isSidebarOpen);
          }}
        >
          <ChevronsLeft size={16} />
        </a>
      </div>

      <div className="sidebar-inner slimscroll flex-grow-1" style={{ overflowY: "auto" }}>
        <Link to="/" className="cm-app-sidebar__back" title="All apps">
          <ArrowLeftOutlined /> <span>All apps</span>
        </Link>
        {current && (
          <Link to={current.home} className="cm-app-sidebar__app">
            <span className="cm-app-sidebar__icon" style={{ background: current.color }}>
              {current.icon}
            </span>
            <span className="cm-app-sidebar__name">{current.name}</span>
          </Link>
        )}
        <div id="sidebar-menu" className="sidebar-menu">
          <ul>
            {items.map((it) => (
              <li key={it.to}>
                {it.section && <div className="cm-app-sidebar__section">{it.section}</div>}
                <Link to={it.to} className={itemActive(it.to) ? "active" : ""} title={!isSidebarOpen ? it.label : undefined}>
                  {it.icon}
                  <span>{it.label}</span>
                </Link>
              </li>
            ))}
            {!current &&
              apps.map((app) => (
                <li key={app.key}>
                  <Link to={app.home}>
                    <span style={{ color: app.color, display: "inline-flex" }}>{app.icon}</span>
                    <span>{app.name}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
