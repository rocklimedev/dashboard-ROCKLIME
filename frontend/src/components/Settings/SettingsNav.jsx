import React, { useState } from "react";

const SettingsNav = ({ menuItems }) => {
  const [openMenus, setOpenMenus] = useState({});

  // Toggle submenu open/close state
  const toggleMenu = (index) => {
    setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <ul className="settings-nav">
      {menuItems.map((item, index) => (
        <li
          key={index}
          className={`submenu ${openMenus[index] ? "submenu-open" : ""}`}
        >
          <a
            href="javascript:void(0);"
            onClick={() => toggleMenu(index)}
            className={openMenus[index] ? "active subdrop" : ""}
          >
            <i className={item.icon}></i>
            <span className="fs-14 fw-medium ms-2">{item.title}</span>
            <span className="menu-arrow"></span>
          </a>
          <ul style={{ display: openMenus[index] ? "block" : "none" }}>
            {item.subItems.map((subItem, subIndex) => (
              <li key={subIndex}>
                <a href={subItem.link}>{subItem.label}</a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};

export default SettingsNav;
