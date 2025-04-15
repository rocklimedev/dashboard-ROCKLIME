import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronsLeft } from "react-feather"; // Feather icon component
import masterRoutes from "../../data/routes";
import logo from "../../assets/img/logo.png";
import "./sidebar.css";
const Sidebar = ({ isSidebarOpen }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleDropdown = (index) => {
    setOpenMenu((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className={`sidebar ${isSidebarOpen ? "active" : ""}`} id="sidebar">
      <div className="sidebar-logo">
        <a href="/" className="logo logo-normal">
          <img src={logo} alt="Logo" />
        </a>
        <a href="/" className="logo logo-white">
          <img src={logo} alt="Logo" />
        </a>
        <a href="/" className="logo-small">
          <img src={logo} alt="Logo" />
        </a>
        <a id="toggle_btn" href="#">
          <ChevronsLeft size={16} color="#000" />
        </a>
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
                      style={{ color: "#000" }} // Force icon color here if needed
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
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
