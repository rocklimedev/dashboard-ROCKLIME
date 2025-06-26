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
        <Link to="/" className="logo logo-white">
          <img src={logo_small} alt="Logo" />
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

      <div className="modern-profile p-3 pb-0">
        <div className="text-center rounded bg-light p-3 mb-4 user-profile">
          <div className="avatar avatar-lg online mb-3">
            <img
              src={customerImg}
              alt="User"
              className="img-fluid rounded-circle"
            />
          </div>
          <h6 className="fs-14 fw-bold mb-1">Adrian Herman</h6>
          <p className="fs-12 mb-0">System Admin</p>
        </div>
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

  const HorizontalSidebar = () => (
    <div className="sidebar sidebar-horizontal" id="horizontal-menu">
      <div id="sidebar-menu-3" className="sidebar-menu">
        <div className="main-menu">
          <ul className="nav-menu">
            {masterRoutes
              .filter((section) => section.isSidebarActive)
              .map((section, index) => (
                <li key={index} className="submenu">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleHorizontalDropdown(index);
                    }}
                  >
                    {section.icon || <i className="ti ti-circle"></i>}
                    <span>{section.name}</span>
                    <span className="menu-arrow"></span>
                  </a>
                  {section.submenu?.length > 0 && (
                    <ul
                      className={
                        horizontalOpenMenu === index
                          ? "submenu-open"
                          : "submenu-closed"
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleHorizontalDropdown(
                                    `${index}-${subIdx}`
                                  );
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
                                  horizontalOpenMenu === `${index}-${subIdx}`
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

  const TwoColumnSidebar = () => (
    <div
      className={`two-col-sidebar ${isSidebarOpen ? "active" : ""}`}
      id="two-col-sidebar"
    >
      <div className="sidebar sidebar-twocol">
        <div className="twocol-mini">
          <div className="sidebar-left slimscroll">
            <div
              className="nav flex-column align-items-center nav-pills"
              id="sidebar-tabs"
              role="tablist"
              aria-orientation="vertical"
            >
              {masterRoutes
                .filter((section) => section.isSidebarActive)
                .map((section, index) => {
                  // Generate tabId if not provided
                  const tabId =
                    section.tabId ||
                    `tab-${section.name
                      .toLowerCase()
                      .replace(/\s+/g, "-")}-${index}`;
                  return (
                    <a
                      key={index}
                      href="#"
                      className={`nav-link ${
                        activeTab === tabId ? "active" : ""
                      }`}
                      title={section.name}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTabChange(tabId);
                      }}
                      data-bs-toggle="tab"
                      data-bs-target={`#${tabId}`}
                    >
                      {section.icon || <i className="ti ti-circle"></i>}
                    </a>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="sidebar-right">
          <div className="sidebar-logo">
            <Link to="/" className="logo logo-normal">
              <img src={logo} alt="Logo" />
            </Link>
            <Link to="/" className="logo logo-white">
              <img src={logo_small} alt="Logo" />
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
          </div>

          <div className="sidebar-scroll">
            <div className="text-center rounded bg-light p-3 mb-3 border">
              <div className="avatar avatar-lg online mb-3">
                <img
                  src={customerImg}
                  alt="User"
                  className="img-fluid rounded-circle"
                />
              </div>
              <h6 className="fs-14 fw-bold mb-1">Adrian Herman</h6>
              <p className="fs-12 mb-0">System Admin</p>
            </div>

            <div className="tab-content" id="v-pills-tabContent">
              {masterRoutes
                .filter((section) => section.isSidebarActive)
                .map((section, sectionIdx) => {
                  // Generate tabId if not provided
                  const tabId =
                    section.tabId ||
                    `tab-${section.name
                      .toLowerCase()
                      .replace(/\s+/g, "-")}-${sectionIdx}`;
                  return (
                    <div
                      key={sectionIdx}
                      className={`tab-pane fade ${
                        activeTab === tabId ? "show active" : ""
                      }`}
                      id={tabId}
                    >
                      <ul>
                        <li className="menu-title">
                          <span>{section.name.toUpperCase()}</span>
                        </li>
                        {section.submenu
                          ?.filter((sub) => sub.isSidebarActive)
                          .map((sub, subIdx) => (
                            <li
                              key={subIdx}
                              className={sub.submenu?.length ? "submenu" : ""}
                            >
                              {sub.submenu?.length > 0 ? (
                                <a
                                  href="#"
                                  className={
                                    twoColOpenMenu[tabId] === subIdx
                                      ? "subdrop active"
                                      : ""
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleTwoColDropdown(tabId, subIdx);
                                  }}
                                >
                                  {sub.icon || <i className="ti ti-circle"></i>}
                                  <span>{sub.name}</span>
                                  <span className="menu-arrow"></span>
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
                                    twoColOpenMenu[tabId] === subIdx
                                      ? "submenu-open"
                                      : "submenu-closed"
                                  }
                                >
                                  {sub.submenu
                                    .filter((subSub) => subSub.isSidebarActive)
                                    .map((subSub, subSubIdx) => (
                                      <li
                                        key={subSubIdx}
                                        className={
                                          subSub.submenu?.length
                                            ? "submenu"
                                            : ""
                                        }
                                      >
                                        {subSub.submenu?.length > 0 ? (
                                          <a
                                            href="#"
                                            className={
                                              twoColOpenMenu[
                                                `${tabId}-${subIdx}`
                                              ] === subSubIdx
                                                ? "subdrop active"
                                                : ""
                                            }
                                            onClick={(e) => {
                                              e.preventDefault();
                                              toggleTwoColDropdown(
                                                `${tabId}-${subIdx}`,
                                                subSubIdx
                                              );
                                            }}
                                          >
                                            {subSub.icon || (
                                              <i className="ti ti-circle"></i>
                                            )}
                                            <span>{subSub.name}</span>
                                            <span className="menu-arrow inside-submenu"></span>
                                          </a>
                                        ) : (
                                          <Link to={subSub.path}>
                                            {subSub.icon || (
                                              <i className="ti ti-circle"></i>
                                            )}
                                            {subSub.name}
                                          </Link>
                                        )}
                                        {subSub.submenu?.length > 0 && (
                                          <ul
                                            className={
                                              twoColOpenMenu[
                                                `${tabId}-${subIdx}`
                                              ] === subSubIdx
                                                ? "submenu-open"
                                                : "submenu-closed"
                                            }
                                          >
                                            {subSub.submenu
                                              .filter(
                                                (subSubSub) =>
                                                  subSubSub.isSidebarActive
                                              )
                                              .map(
                                                (subSubSub, subSubSubIdx) => (
                                                  <li key={subSubSubIdx}>
                                                    <Link to={subSubSub.path}>
                                                      {subSubSub.icon || (
                                                        <i className="ti ti-circle"></i>
                                                      )}
                                                      {subSubSub.name}
                                                    </Link>
                                                  </li>
                                                )
                                              )}
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
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {layoutMode === "horizontal" && <HorizontalSidebar />}
      {layoutMode === "two-column" && <TwoColumnSidebar />}
      {layoutMode === "vertical" && <VerticalSidebar />}
    </>
  );
};

export default SidebarNew;
