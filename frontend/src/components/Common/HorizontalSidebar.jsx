import React, { useState } from "react";
import { Link } from "react-router-dom";
import masterRoutes from "../../data/routes";

const HorizontalSidebar = ({ isSidebarOpen }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleDropdown = (index) => {
    setOpenMenu((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div
      className={`sidebar sidebar-horizontal ${isSidebarOpen ? "active" : ""}`}
      id="horizontal-menu"
    >
      <div id="sidebar-menu-3" className="sidebar-menu">
        <div className="main-menu">
          <ul className="nav-menu">
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
                                <span>{sub.name}</span>
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
                                        <span>{subSub.name}</span>
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
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HorizontalSidebar;
