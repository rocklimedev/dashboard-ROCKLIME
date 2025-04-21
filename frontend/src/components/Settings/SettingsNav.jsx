import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const SettingsNav = ({ menuItems }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <ul className="settings-nav">
      {menuItems.map((menu, index) => (
        <li
          key={index}
          className={`submenu ${openMenu === index ? "submenu-open" : ""}`}
        >
          <a href="#" onClick={() => toggleMenu(index)}>
            {menu.icon}
            <span className="ms-2">{menu.title}</span>
          </a>
          {menu.submenu && (
            <ul className={openMenu === index ? "open" : "closed"}>
              {menu.submenu.map((sub, subIndex) => (
                <li key={subIndex}>
                  <Link
                    to={sub.path}
                    className={location.pathname === sub.path ? "active" : ""}
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

export default SettingsNav;
