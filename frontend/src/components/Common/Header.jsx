import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetNotificationsQuery } from "../../api/notificationApi";
import { Dropdown, Button, Menu } from "antd";
import { FaUserCircle, FaSearch, FaBell } from "react-icons/fa";
import { SettingOutlined } from "@ant-design/icons";
import { BiFullscreen, BiLogOut } from "react-icons/bi";
import { toast } from "sonner";
import Avatar from "react-avatar";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import { CgShoppingCart } from "react-icons/cg";
import { useLogoutMutation } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { FaEllipsisV } from "react-icons/fa";
import { SunFilled } from "@ant-design/icons";
import { MoonFilled } from "@ant-design/icons";
const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { logout } = useAuth();
  const { data: cart } = useGetCartQuery(user?.user?.userId, {
    skip: !user?.user?.userId,
  });
  const { data: notifications } = useGetNotificationsQuery(user?.user?.userId, {
    skip: !user?.user?.userId,
  });

  const notificationCount = notifications?.filter((n) => !n.read).length || 0;
  const cartItemCount = cart?.cart?.items?.length || 0;

  // DARK MODE STATE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Apply dark mode on mount & change
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const userMenu = (
    <Menu className="shadow-sm rounded menu-drop-user" style={{ zIndex: 1100 }}>
      <Menu.Item
        key="profile-header"
        className="d-flex align-items-center p-3 profileset"
      >
        <div>
          <h6 className="fw-medium mb-0">
            @{user?.user?.username || "John Smilga"}
          </h6>
          <p className="mb-0">{user?.user?.roles?.join(", ") || "Admin"}</p>
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="profile"
        onClick={() => navigate(`/u/${user?.user?.userId}`)}
      >
        <FaUserCircle className="me-2" /> My Profile
      </Menu.Item>
      <Menu.Item key="settings" onClick={() => navigate("/settings")}>
        <SettingOutlined className="me-2" /> Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout} disabled={isLoggingOut}>
        <BiLogOut className="me-2" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Menu.Item>
    </Menu>
  );

  const mobileMenuItems = [
    {
      key: "profile",
      label: "My Profile",
      icon: <FaUserCircle className="me-2" />,
      onClick: () => navigate(`/u/${user?.user?.userId}`),
    },
    {
      key: "settings",
      label: "Settings",
      icon: <i className="ti ti-settings-2 me-2" />,
      onClick: () => navigate("/settings"),
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: <FaBell className="me-2" />,
      onClick: () => navigate("/notifications"),
    },
    {
      key: "cart",
      label: "Cart",
      icon: <CgShoppingCart className="me-2" />,
      onClick: () => navigate("/cart"),
    },
    {
      key: "fullscreen",
      label: isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
      icon: <BiFullscreen className="me-2" />,
      onClick: handleFullscreenToggle,
    },
    {
      key: "darkmode",
      label: darkMode ? "Light Mode" : "Dark Mode",
      icon: darkMode ? <SunFilled /> : <MoonFilled />,
      onClick: toggleDarkMode,
    },
    {
      key: "logout",
      label: isLoggingOut ? "Logging out..." : "Logout",
      icon: <BiLogOut className="me-2" />,
      onClick: handleLogout,
      disabled: isLoggingOut,
    },
  ];

  return (
    <div className="header">
      <div className="main-header">
        <div className="header-left active">
          <Link to="/" className="logo logo-normal">
            <img src={logo} alt="Logo" />
          </Link>
          <Link to="/" className="logo logo-white">
            <img src={logo_small} alt="Logo" />
          </Link>
          <Link to="/" className="logo-small">
            <img src={logo_small} alt="Logo" />
          </Link>
        </div>

        <a
          className="mobile_btn"
          onClick={() =>
            window.innerWidth < 992 && toggleSidebar(!isSidebarOpen)
          }
          id="mobile_btn"
        >
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </a>

        <ul className="nav user-menu">
          <li className="nav-item nav-searchinputs">
            {/* <div className="top-nav-search">
              <Button
                type="link"
                className="responsive-search d-md-none"
                aria-label="Search"
              >
                <FaSearch />
              </Button>
              <div className="d-none d-md-block">
                 <SearchDropdown /> 
              </div>
            </div> */}
          </li>
          {/* Fullscreen */}
          <li className="nav-item nav-item-box">
            <Button
              type="link"
              onClick={handleFullscreenToggle}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <BiFullscreen />
            </Button>
          </li>

          {/* Notifications */}
          <li className="nav-item nav-item-box">
            <Link to="/notifications" style={{ position: "relative" }}>
              <FaBell />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </Link>
          </li>

          {/* Cart */}
          <li className="nav-item nav-item-box">
            <Link to="/cart" style={{ position: "relative" }}>
              <CgShoppingCart />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>
          </li>

          {/* DARK MODE TOGGLE (Desktop) */}
          <li className="nav-item nav-item-box d-none d-lg-flex">
            <Button
              type="link"
              onClick={toggleDarkMode}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <SunFilled /> : <MoonFilled />}
            </Button>
          </li>

          {/* User Dropdown */}
          <li className="nav-item dropdown main-drop profile-nav">
            {isProfileLoading ? (
              <span className="text-muted">Loading...</span>
            ) : profileError ? (
              <span className="text-danger">Error</span>
            ) : (
              <Dropdown overlay={userMenu} trigger={["click"]}>
                <a
                  href="#"
                  className="nav-link userset"
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="user-info p-0">
                    <span className="user-letter avatar-container">
                      <Avatar
                        name={user?.user?.name || "User"}
                        src={user?.user?.profileImage}
                        size="40"
                        round={true}
                        className="circular-avatar"
                        color="#e31e24"
                      />
                    </span>
                  </span>
                </a>
              </Dropdown>
            )}
          </li>
        </ul>

        {/* Mobile Menu */}
        <div
          className="mobile-user-menu"
          style={{ position: "relative", zIndex: 1100 }}
        >
          <Dropdown
            menu={{ items: mobileMenuItems }}
            trigger={["click"]}
            placement="bottom"
            overlayClassName="mobile-dropdown"
          >
            <Button
              type="text"
              icon={<FaEllipsisV />}
              className="mobile-menu-button"
            />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Header;
