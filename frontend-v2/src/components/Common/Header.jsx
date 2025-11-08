import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetNotificationsQuery } from "../../api/notificationApi";
import { Dropdown, Button, Menu, Badge } from "antd";
import { FaUserCircle, FaSearch, FaBell, FaEllipsisV } from "react-icons/fa";
import { SettingOutlined } from "@ant-design/icons";
import { BiFullscreen, BiLogOut } from "react-icons/bi";
import { toast } from "sonner";
import Avatar from "react-avatar";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import { CgShoppingCart } from "react-icons/cg";
import { useLogoutMutation } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { SunFilled, MoonFilled } from "@ant-design/icons";

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // === Queries ===
  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();

  const userId = user?.user?.userId;

  const { data: cart } = useGetCartQuery(userId, {
    skip: !userId,
  });

  const { data: notifications } = useGetNotificationsQuery(userId, {
    skip: !userId,
  });

  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  // === State ===
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // === Dark Mode Effect ===
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [darkMode]);

  // === Handlers (Memoized) ===
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
      logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  }, [logoutMutation, logout, navigate]);

  // === Counters ===
  const notificationCount = useMemo(() => {
    return notifications?.filter((n) => !n.read).length || 0;
  }, [notifications]);

  const cartItemCount = useMemo(() => {
    return cart?.cart?.items?.length || 0;
  }, [cart]);

  // === Desktop User Menu ===
  const userMenu = useMemo(
    () => (
      <Menu
        className="shadow-sm rounded menu-drop-user"
        style={{ zIndex: 1100 }}
      >
        <Menu.Item
          key="profile-header"
          className="d-flex align-items-center p-3 profileset"
          disabled
        >
          <div>
            <h6 className="fw-medium mb-0">
              @{user?.user?.username || "John Smilga"}
            </h6>
          </div>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          key="profile"
          onClick={() => navigate(`/u/${userId}`)}
          icon={<FaUserCircle className="me-2" />}
        >
          Profile
        </Menu.Item>
        <Menu.Item
          key="settings"
          onClick={() => navigate("/settings")}
          icon={<SettingOutlined className="me-2" />}
        >
          Settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          key="logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
          icon={<BiLogOut className="me-2" />}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Menu.Item>
      </Menu>
    ),
    [
      user?.user?.username,
      user?.user?.roles,
      userId,
      navigate,
      handleLogout,
      isLoggingOut,
    ]
  );

  // === Mobile Menu Items (Memoized) ===
  const mobileMenuItems = useMemo(
    () => [
      {
        key: "profile",
        label: "My Profile",
        icon: <FaUserCircle className="me-2" />,
        onClick: () => navigate(`/u/${userId}`),
      },
      {
        key: "settings",
        label: "Settings",
        icon: <SettingOutlined className="me-2" />,
        onClick: () => navigate("/settings"),
      },
      {
        key: "notifications",
        label: (
          <div className="d-flex justify-content-between align-items-center w-100">
            <span>Notifications</span>
            {notificationCount > 0 && (
              <Badge count={notificationCount} size="small" showZero={false} />
            )}
          </div>
        ),
        icon: <FaBell className="me-2" />,
        onClick: () => navigate("/notifications"),
      },
      {
        key: "cart",
        label: (
          <div className="d-flex justify-content-between align-items-center w-100">
            <span>Cart</span>
            {cartItemCount > 0 && (
              <Badge count={cartItemCount} size="small" showZero={false} />
            )}
          </div>
        ),
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
    ],
    [
      userId,
      navigate,
      notificationCount,
      cartItemCount,
      isFullscreen,
      darkMode,
      isLoggingOut,
      handleFullscreenToggle,
      toggleDarkMode,
      handleLogout,
    ]
  );

  return (
    <div className="header">
      <div className="main-header">
        {/* Logo */}
        <div className="header-left active">
          <Link to="/" className="logo logo-normal">
            <img src={logo} alt="Logo" />
          </Link>
          <Link to="/" className="logo logo-white">
            <img src={logo} alt="Logo" />
          </Link>
          <Link to="/" className="logo-small">
            <img src={logo} alt="Logo" />
          </Link>
        </div>

        {/* Mobile Toggle */}
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

        {/* Desktop Nav */}
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

          {/* Notifications with Badge */}
          <li className="nav-item nav-item-box">
            <Link to="/notifications" style={{ position: "relative" }}>
              <Badge
                count={notificationCount}
                size="small"
                offset={[-5, 5]}
                showZero={false}
              >
                <FaBell style={{ fontSize: 18 }} />
              </Badge>
            </Link>
          </li>

          {/* Cart with Badge */}
          <li className="nav-item nav-item-box">
            <Link to="/cart" style={{ position: "relative" }}>
              <Badge
                count={cartItemCount}
                size="small"
                offset={[-5, 5]}
                showZero={false}
              >
                <CgShoppingCart style={{ fontSize: 20 }} />
              </Badge>
            </Link>
          </li>

          {/* Dark Mode (Desktop) */}
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
              <Dropdown
                overlay={userMenu}
                trigger={["click"]}
                getPopupContainer={(trigger) => trigger.parentElement}
              >
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
            getPopupContainer={(trigger) => trigger.parentElement}
          >
            <Button
              type="text"
              icon={<FaEllipsisV />}
              className="mobile-menu-button"
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Header;
