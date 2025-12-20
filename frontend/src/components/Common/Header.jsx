import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetNotificationsQuery } from "../../api/notificationApi";
import { Dropdown, Button, Menu, Badge, Input, Spin } from "antd";
import {
  BellOutlined,
  EllipsisOutlined,
  ShoppingCartOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  SunFilled,
  MoonFilled,
} from "@ant-design/icons";
import SearchOverlay from "./SearchOverlay";
import { message } from "antd";
import Avatar from "react-avatar";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import { useLogoutMutation } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import PermissionsGate from "../../context/PermissionGate";
import { useRef } from "react";
import { useSearchAllQuery } from "../../api/searchApi";
import { SearchOutlined } from "@ant-design/icons";
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
  const userRoles = user?.user?.roles || [];
  const hasAdminOrDevAccess =
    userRoles.includes("SUPER_ADMIN") || userRoles.includes("DEVELOPER");

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
  // === Search State ===
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const searchRef = useRef(null);
  // === RTK Query Hook for Search ===
  const {
    data: searchData,
    isLoading: searchLoading,
    isFetching: searchFetching,
    error: searchError,
  } = useSearchAllQuery(
    { query: searchQuery, limit: 8 }, // limit results per model
    {
      skip: !searchQuery.trim(), // Skip query if empty
    }
  );
  const searchResults = searchData?.results || null;

  // === Show overlay when typing or results exist ===
  useEffect(() => {
    if (searchQuery.trim() && (searchResults || searchLoading)) {
      setShowSearchOverlay(true);
    } else {
      setShowSearchOverlay(false);
    }
  }, [searchQuery, searchResults, searchLoading]);
  // === Close on click outside ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchOverlay(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === Close handler ===
  const closeSearchOverlay = () => {
    setShowSearchOverlay(false);
    // Optionally clear search after navigation
    // setSearchQuery("");
  };
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
      message.error("Logout failed. Please try again.");
    }
  }, [logoutMutation, logout, navigate]);

  // === Counters ===
  const notificationCount = useMemo(() => {
    return notifications?.filter((n) => !n.read).length || 0;
  }, [notifications]);

  const cartItemCount = useMemo(() => {
    return cart?.cart?.items?.length || 0;
  }, [cart]);

  useEffect(() => {
    const savedQuery = localStorage.getItem("lastSearchQuery");
    if (savedQuery) {
      setSearchQuery(savedQuery);
      setShowSearchOverlay(true); // Show results immediately
    }
  }, []);
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
          icon={<UserOutlined className="me-2" />}
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
        {/* Conditionally render Logging for SUPER_ADMIN or DEVELOPER */}
        {hasAdminOrDevAccess && (
          <>
            <Menu.Divider />
            <Menu.Item
              key="logging"
              onClick={() => navigate("/logging")}
              icon={<SettingOutlined className="me-2" />}
            >
              Logging
            </Menu.Item>
          </>
        )}
        <Menu.Divider />
        <Menu.Item
          key="logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
          icon={<LogoutOutlined className="me-2" />}
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
      hasAdminOrDevAccess, // Add dependency
    ]
  );

  const mobileMenuItems = useMemo(() => {
    const items = [
      {
        key: "profile",
        label: "My Profile",
        icon: <UserOutlined className="me-2" />,
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
        icon: <BellOutlined className="me-2" />,
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
        icon: <ShoppingCartOutlined className="me-2" />,
        onClick: () => navigate("/cart"),
      },
      {
        key: "fullscreen",
        label: isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
        icon: <FullscreenOutlined className="me-2" />,
        onClick: handleFullscreenToggle,
      },
      {
        key: "darkmode",
        label: darkMode ? "Light Mode" : "Dark Mode",
        icon: darkMode ? <SunFilled /> : <MoonFilled />,
        onClick: toggleDarkMode,
      },
    ];

    // Insert Logging item before Logout if user has access
    if (hasAdminOrDevAccess) {
      items.push({
        key: "logging",
        label: "Logging",
        icon: <SettingOutlined className="me-2" />,
        onClick: () => navigate("/logging"),
      });
    }

    items.push({
      key: "logout",
      label: isLoggingOut ? "Logging out..." : "Logout",
      icon: <LogoutOutlined className="me-2" />,
      onClick: handleLogout,
      disabled: isLoggingOut,
    });

    return items;
  }, [
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
    hasAdminOrDevAccess, // Add dependency
  ]);

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
          <li
            className="nav-item nav-searchinputs flex-grow-1 d-flex justify-content-center position-relative"
            ref={searchRef}
          >
            <div className="top-nav-search w-100" style={{ maxWidth: "700px" }}>
              {/* Mobile Search Icon */}
              <Button
                type="link"
                className="responsive-search d-md-none me-3"
                onClick={() => setShowSearchOverlay(true)}
              >
                <SearchOutlined style={{ fontSize: 22 }} />
              </Button>

              {/* Desktop Large Centered Search Input */}
              <div className="d-none d-md-block w-100">
                <Input
                  prefix={<SearchOutlined className="search-icon" />}
                  suffix={searchFetching ? <Spin size="small" /> : null}
                  placeholder="Search products, users, orders, invoices, customers..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    localStorage.setItem("lastSearchQuery", value);
                  }}
                  onFocus={() => setShowSearchOverlay(true)}
                  onPressEnter={() => {
                    if (searchQuery.trim()) {
                      navigate(
                        `/search?q=${encodeURIComponent(searchQuery.trim())}`
                      );
                      closeSearchOverlay();
                    }
                  }}
                  allowClear={{
                    onClick: () => {
                      setSearchQuery("");
                      localStorage.removeItem("lastSearchQuery");
                      setShowSearchOverlay(false);
                    },
                  }}
                  size="large"
                  className="global-search-input"
                  style={{ height: 48 }}
                />
              </div>
            </div>

            {/* Search Overlay - Now positioned absolutely under the input */}
            <SearchOverlay
              visible={showSearchOverlay}
              loading={searchLoading || searchFetching}
              results={searchResults}
              query={searchQuery}
              onClose={closeSearchOverlay}
            />
          </li>

          {/* Fullscreen */}
          <li className="nav-item nav-item-box">
            <Button
              type="link"
              onClick={handleFullscreenToggle}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <FullscreenOutlined />
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
                <BellOutlined style={{ fontSize: 18 }} />
              </Badge>
            </Link>
          </li>
          <PermissionsGate api="write" module="cart">
            {/* Cart with Badge */}
            <li className="nav-item nav-item-box">
              <Link to="/cart" style={{ position: "relative" }}>
                <Badge
                  count={cartItemCount}
                  size="small"
                  offset={[-5, 5]}
                  showZero={false}
                >
                  <ShoppingCartOutlined style={{ fontSize: 20 }} />
                </Badge>
              </Link>
            </li>
          </PermissionsGate>

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
                        src={
                          user?.user?.photo_thumbnail ||
                          user?.user?.profileImage
                        }
                        size={40} // important – tell the library the exact size
                        round={true}
                        className="circular-avatar"
                        textSizeRatio={2.2}
                        maxInitials={2}
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
              icon={<EllipsisOutlined />}
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
