import React, { useState } from "react";
import { Link } from "react-router-dom";
import masterRoutes from "../../data/routes";

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleDropdown = (index) => {
    setOpenMenu((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-logo active">
        <a href="index.html" className="logo logo-normal">
          <img src="assets/img/logo.svg" alt="Logo" />
        </a>
        <a href="index.html" className="logo logo-white">
          <img src="assets/img/logo-white.svg" alt="Logo" />
        </a>
        <a href="index.html" className="logo-small">
          <img src="assets/img/logo-small.png" alt="Logo" />
        </a>
        <a id="toggle_btn" href="#">
          <i data-feather="chevrons-left" className="feather-16"></i>
        </a>
      </div>

      <div className="modern-profile p-3 pb-0">
        <div className="text-center rounded bg-light p-3 mb-4 user-profile">
          <div className="avatar avatar-lg online mb-3">
            <img
              src="assets/img/customer/customer15.jpg"
              alt="Profile"
              className="img-fluid rounded-circle"
            />
          </div>
          <h6 className="fs-14 fw-bold mb-1">Adrian Herman</h6>
          <p className="fs-12 mb-0">System Admin</p>
        </div>
        <div className="sidebar-nav mb-3">
          <ul className="nav nav-tabs nav-tabs-solid nav-tabs-rounded nav-justified bg-transparent">
            <li className="nav-item">
              <a className="nav-link active border-0" href="#">
                Menu
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link border-0" href="chat.html">
                Chats
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link border-0" href="email.html">
                Inbox
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="sidebar-header p-3 pb-0 pt-2">
        <div className="text-center rounded bg-light p-2 mb-4 sidebar-profile d-flex align-items-center">
          <div className="avatar avatar-md online">
            <img
              src="assets/img/customer/customer15.jpg"
              alt="Profile"
              className="img-fluid rounded-circle"
            />
          </div>
          <div className="text-start sidebar-profile-info ms-2">
            <h6 className="fs-14 fw-bold mb-1">Adrian Herman</h6>
            <p className="fs-12">System Admin</p>
          </div>
        </div>
      </div>

      {/* Make sidebar scrollable */}
      <div className="sidebar-inner slimscroll" style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
        <div id="sidebar-menu" className="sidebar-menu">
          <ul>
            {masterRoutes
              .filter((section) => section.isSidebarActive)
              .map((section, index) => (
                <li key={index} className={section.submenu?.length ? "submenu" : ""}>
                  {section.submenu?.length > 0 ? (
                    <a
                      href="#"
                      className={openMenu === index ? "subdrop active" : ""}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDropdown(index);
                      }}
                    >
                      {section.icon}
                      <span>{section.name}</span>
                      <span className="menu-arrow"></span>
                    </a>
                  ) : (
                    <Link to={section.path}>
                      {section.icon}
                      <span>{section.name}</span>
                    </Link>
                  )}

                  {section.submenu?.length > 0 && (
                    <ul className={openMenu === index ? "submenu-open" : "submenu-closed"}>
                      {section.submenu
                        .filter((sub) => sub.isSidebarActive)
                        .map((sub, subIdx) => (
                          <li key={subIdx}>
                            <Link to={sub.path}>
                              {sub.icon} {sub.name}
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
