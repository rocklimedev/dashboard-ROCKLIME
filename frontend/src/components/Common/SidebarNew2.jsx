import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronsLeft } from "react-feather";
import masterRoutes from "../../data/routes";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import { DownCircleOutlined } from "@ant-design/icons";
import { BiLogOut } from "react-icons/bi";
import { useAuth } from "../../context/AuthContext"; // <-- your hook
import { useLogoutMutation } from "../../api/authApi";
import { toast } from "sonner";
const SidebarNew = ({
  isSidebarOpen,
  toggleSidebar,
  layoutMode = "vertical",
}) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const { auth } = useAuth(); // <-- role comes from here
  const { logout } = useAuth();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  const toggleDropdown = (index) => {
    setOpenMenu((prev) => (prev === index ? null : index));
  };

  const handleRouteClick = () => setOpenMenu(null);

  // --------------------------------------------------------------
  // 1. Allowed roles for the “Master Table” section
  // --------------------------------------------------------------
  const MASTER_TABLE_ALLOWED_ROLES = ["SUPER_ADMIN", "DEVELOPER", "ADMIN"];
  const canSeeMasterTable =
    auth?.role && MASTER_TABLE_ALLOWED_ROLES.includes(auth.role);
  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };
  // --------------------------------------------------------------
  // 2. Filter masterRoutes – hide Master Table if not allowed
  // --------------------------------------------------------------
  const visibleRoutes = masterRoutes.filter((section) => {
    if (section.name === "Master Table") {
      return canSeeMasterTable;
    }
    return section.isSidebarActive;
  });

  const VerticalSidebar = () => (
    <div
      className={`sidebar d-flex flex-column ${isSidebarOpen ? "active" : ""}`}
      id="sidebar"
    >
      {/* ---------- LOGO ---------- */}
      <div className={`sidebar-logo ${isSidebarOpen ? "active" : ""}`}>
        <NavLink to="/" className="logo logo-normal">
          <img src={logo} alt="Logo" />
        </NavLink>
        <NavLink to="/" className="logo-small">
          <img src={logo_small} alt="Logo" />
        </NavLink>
        <NavLink to="/" className="logo logo-white">
          <img src={logo} alt="Logo" />
        </NavLink>

        <a
          id="toggle_btn"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (window.innerWidth < 768) toggleSidebar(!isSidebarOpen);
          }}
        >
          <ChevronsLeft size={16} />
        </a>
      </div>

      {/* ---------- MENU SECTION ---------- */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <div className="sidebar-inner slimscroll flex-grow-1">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              {visibleRoutes.map((section, index) => (
                <li
                  key={index}
                  className={section.submenu?.length ? "submenu" : ""}
                >
                  {section.submenu?.length > 0 ? (
                    <a
                      href="#"
                      className={openMenu === index ? "subdrop active" : ""}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDropdown(index);
                      }}
                    >
                      {section.icon || <DownCircleOutlined />}
                      <span>{section.name}</span>
                      <span className="menu-arrow"></span>
                    </a>
                  ) : (
                    <NavLink
                      to={section.path}
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={handleRouteClick}
                    >
                      {section.icon || <DownCircleOutlined />}
                      <span>{section.name}</span>
                    </NavLink>
                  )}

                  {section.submenu?.length > 0 && (
                    <ul
                      className={
                        openMenu === index ? "submenu-open" : "submenu-closed"
                      }
                    >
                      {section.submenu
                        .filter((sub) => sub.isSidebarActive)
                        .map((sub, subIdx) => (
                          <li
                            key={subIdx}
                            className={sub.submenu?.length ? "submenu" : ""}
                          >
                            {sub.submenu?.length > 0 ? (
                              <a
                                href="#"
                                className={
                                  openMenu === `${index}-${subIdx}`
                                    ? "subdrop active"
                                    : ""
                                }
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleDropdown(`${index}-${subIdx}`);
                                }}
                              >
                                {sub.icon || <DownCircleOutlined />}
                                <span>{sub.name}</span>
                                <span className="menu-arrow inside-submenu"></span>
                              </a>
                            ) : (
                              <NavLink
                                to={sub.path}
                                className={({ isActive }) =>
                                  isActive ? "active" : ""
                                }
                                onClick={handleRouteClick}
                              >
                                {sub.icon || <DownCircleOutlined />}
                                <span>{sub.name}</span>
                              </NavLink>
                            )}

                            {sub.submenu?.length > 0 && (
                              <ul
                                className={
                                  openMenu === `${index}-${subIdx}`
                                    ? "submenu-open"
                                    : "submenu-closed"
                                }
                              >
                                {sub.submenu
                                  .filter((subSub) => subSub.isSidebarActive)
                                  .map((subSub, subSubIdx) => (
                                    <li key={subSubIdx}>
                                      <NavLink
                                        to={subSub.path}
                                        className={({ isActive }) =>
                                          isActive ? "active" : ""
                                        }
                                        onClick={handleRouteClick}
                                      >
                                        {subSub.icon || <DownCircleOutlined />}
                                        <span>{subSub.name}</span>
                                      </NavLink>
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---------- LOGOUT BUTTON AT BOTTOM ---------- */}
        <div className="sidebar-menu">
          <ul>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className={`d-flex align-items-center gap-2 text-danger ${
                  isSidebarOpen ? "" : "justify-content-center"
                }`}
                style={{
                  cursor: "pointer",
                  fontWeight: 500,
                  borderRadius: "8px",
                  padding: isSidebarOpen ? "10px 12px" : "10px",
                  transition: "background 0.2s ease",
                }}
                title={!isSidebarOpen ? "Logout" : ""}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8d7da")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <BiLogOut size={20} />
                {isSidebarOpen && (
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                )}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return <>{layoutMode === "vertical" && <VerticalSidebar />}</>;
};

export default SidebarNew;
