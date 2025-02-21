import React from "react";
import { Link } from "react-router-dom";
import masterRoutes from "../../data/routes";

const Sidebar = () => {
  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-inner slimscroll">
        <div id="sidebar-menu" className="sidebar-menu">
          <nav>
            {masterRoutes
              .filter((section) => section.isSidebarActive) // Filter active sections
              .map((section, index) => (
                <div key={index}>
                  <li className="menu-title">
                    <span>{section.name}</span>
                  </li>
                  {section.submenu && section.submenu.length > 0 ? (
                    section.submenu
                      .filter((sub) => sub.isSidebarActive) // Filter active submenus
                      .map((sub, idx) => (
                        <li key={idx} className="submenu">
                          <a href="#">
                            <i className={sub.icon}></i>
                            <span>{sub.name}</span>
                            <span className="menu-arrow"></span>
                          </a>
                          <ul>
                            <li>
                              <Link to={sub.path}>{sub.name}</Link>
                            </li>
                          </ul>
                        </li>
                      ))
                  ) : (
                    <li>
                      <Link to={section.path}>
                        <i className={section.icon}></i>
                        <span>{section.name}</span>
                      </Link>
                    </li>
                  )}
                </div>
              ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;