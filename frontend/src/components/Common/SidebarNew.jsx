import React, { useState } from "react";
import { Link } from "react-router-dom";
import masterRoutes from "../../data/routes";

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState(null);

  // Toggle dropdown menu
  const toggleDropdown = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-inner slimscroll">
        <div id="sidebar-menu" className="sidebar-menu">
          <nav >
            <ul class="list-inline-item list-unstyled links">
              
              {masterRoutes
                .filter((section) => section.isSidebarActive) // Filter active sections
                .map((section, index) => (
                    
                  <li key={index} className={section.submenu?.length ? "submenu" : ""}>
                    {/* If section has submenu, handle dropdown */}
                    {section.submenu?.length > 0 ? (
                      <a
                        href="#"
                        className={openMenu === index ? "active" : ""}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleDropdown(index);
                        }}
                      >
                        <i className={section.icon}></i>
                        <span>{section.name}</span>
                        <span className="menu-arrow"></span>
                      </a>
                    ) : (
                      <Link to={section.path}>
                        <i className={section.icon}></i>
                        <span>{section.name}</span>
                      </Link>
                    )}

                    {/* Submenu List */}
                    {section.submenu?.length > 0 && (
                      <ul className={openMenu === index ? "submenu-open" : "submenu-closed"}>
                        {section.submenu
                          .filter((sub) => sub.isSidebarActive)
                          .map((sub, subIdx) => (
                            <li key={subIdx}>
                              <Link to={sub.path}>
                                <i className={sub.icon}></i> {sub.name}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    )}
                  </li>
                ))}
            </ul>
          </nav>
          
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
