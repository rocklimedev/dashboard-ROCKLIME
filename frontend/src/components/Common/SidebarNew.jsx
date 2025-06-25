import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronsLeft, X } from "react-feather"; // Add X icon for closing
import masterRoutes from "../../data/routes";
import logo from "../../assets/img/logo.png";
import "./sidebar.css";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleDropdown = (index) => {
    setOpenMenu((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className={`sidebar ${isSidebarOpen ? "active" : ""}`} id="sidebar">
      <div className="sidebar-logo">
        <Link to="/" className="logo logo-normal">
          <img src={logo} alt="Logo" />
        </Link>
        <Link to="/" className="logo logo-white">
          <img src={logo} alt="Logo" />
        </Link>
        <Link to="/" className="logo-small">
          <img src={logo} alt="Logo" />
        </Link>
        <button
          className="sidebar-close-btn"
          onClick={() => toggleSidebar(false)}
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      <div
        className="sidebar-inner slimscroll"
        style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
      >
        <div id="sidebar-menu" className="sidebar-menu">
          <ul>
            {masterRoutes
              .filter((section) => section.isSidebarActive)
              .map((section, index) => (
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
                      style={{ color: "#000" }}
                    >
                      <span style={{ color: "#000" }}>{section.icon}</span>
                      <span>{section.name}</span>
                      <span className="menu-arrow"></span>
                    </a>
                  ) : (
                    <Link to={section.path}>
                      <span style={{ color: "#000" }}>{section.icon}</span>
                      <span>{section.name}</span>
                    </Link>
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
                          <li key={subIdx}>
                            <Link to={sub.path}>
                              <span style={{ color: "#000" }}>{sub.icon}</span>{" "}
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            <li className="submenu-open">
              <h6 className="submenu-hdr">Extras</h6>
              <a href="https://static.cmtradingco.com/" target="_blank">
                <i data-feather="box"></i>
                <span> Product Images</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
