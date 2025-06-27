import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronsLeft, X } from "react-feather";
import masterRoutes from "../../data/routes";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import customerImg from "../../assets/img/customer/customer15.jpg";
import "./sidebar.css";
const SidebarNew = ({
  isSidebarOpen,
  toggleSidebar,
  layoutMode = "vertical",
}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [horizontalOpenMenu, setHorizontalOpenMenu] = useState(null);
  const [twoColOpenMenu, setTwoColOpenMenu] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");

  const toggleDropdown = (index) => {
    setOpenMenu((prevIndex) => (prevIndex === index ? null : index));
  };

  const toggleHorizontalDropdown = (index) => {
    setHorizontalOpenMenu((prevIndex) => (prevIndex === index ? null : index));
  };

  const toggleTwoColDropdown = (tabId, index) => {
    setTwoColOpenMenu((prev) => ({
      ...prev,
      [tabId]: prev[tabId] === index ? null : index,
    }));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const VerticalSidebar = () => (
    <div className={`sidebar ${isSidebarOpen ? "active" : ""}`} id="sidebar">
      <div className="sidebar-logo">
        <Link to="/" className="logo logo-normal">
          <img src={logo} alt="Logo" />
        </Link>

        <Link to="/" className="logo-small">
          <img src={logo_small} alt="Logo" />
        </Link>
        {/* <button
          className="sidebar-close-btn"
          onClick={() => {
            toggleSidebar(false);
          }}
          aria-label="Close sidebar"
        >
          <X size={16} color="#000" />
        </button> */}
        <a
          id="toggle_btn"
          href="#"
          onClick={(e) => {
            e.preventDefault();

            toggleSidebar(!isSidebarOpen);
          }}
        >
          <ChevronsLeft size={16} color="#000" />
        </a>
      </div>

      <div className="sidebar-inner slimscroll">
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
                    >
                      {section.icon || <i className="ti ti-circle"></i>}
                      <span>{section.name}</span>
                      <span className="menu-arrow"></span>
                    </a>
                  ) : (
                    <Link to={section.path}>
                      {section.icon || <i className="ti ti-circle"></i>}
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
                                {sub.icon || <i className="ti ti-circle"></i>}
                                <span>{sub.name}</span>
                                <span className="menu-arrow inside-submenu"></span>
                              </a>
                            ) : (
                              <Link to={sub.path}>
                                {sub.icon || <i className="ti ti-circle"></i>}
                                {sub.name}
                              </Link>
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
                                      <Link to={subSub.path}>
                                        {subSub.icon || (
                                          <i className="ti ti-circle"></i>
                                        )}
                                        {subSub.name}
                                      </Link>
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
            <li className="submenu-open">
              <h6 className="submenu-hdr">Extras</h6>
              <ul>
                <li>
                  <a href="https://static.cmtradingco.com/" target="_blank">
                    <i className="ti ti-box"></i>
                    <span> Product Images</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return <>{layoutMode === "vertical" && <VerticalSidebar />}</>;
};

export default SidebarNew;
