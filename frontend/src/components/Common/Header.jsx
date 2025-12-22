import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetNotificationsQuery } from "../../api/notificationApi";
import { Dropdown, Button, Menu, Badge, Input, Spin } from "antd";
import {
  BellOutlined,
  ShoppingCartOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  SunFilled,
  MoonFilled,
  SearchOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import SearchOverlay from "./SearchOverlay";
import { message } from "antd";
import Avatar from "react-avatar";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import { useLogoutMutation } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import PermissionsGate from "../../context/PermissionGate";
import { useSearchAllQuery } from "../../api/searchApi";
import NotificationsOverlay from "../Notifications/NotificationsWrapper";

const Header = ({ toggleSidebar, isSidebarOpen }) => {
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

  const { data: cart } = useGetCartQuery(userId, { skip: !userId });

  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !userId,
  });

  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  // === State ===
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [showNotifications, setShowNotifications] = useState(false);

  // Mobile Search States
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  const searchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const {
    data: searchData,
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useSearchAllQuery(
    { query: searchQuery, limit: 8 },
    { skip: !searchQuery.trim() }
  );
  const searchResults = searchData?.results || null;

  // Auto-focus input when mobile search opens
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Show overlay only when typing (has query)
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowSearchOverlay(true);
    } else {
      setShowSearchOverlay(false);
    }
  }, [searchQuery]);

  // Close everything on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchOverlay(false);
        setMobileSearchOpen(false);
        setSearchQuery("");
      }
    };
    if (mobileSearchOpen || showSearchOverlay) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileSearchOpen, showSearchOverlay]);

  // Dark Mode
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [darkMode]);

  // Handlers
  const toggleDarkMode = useCallback(() => setDarkMode((prev) => !prev), []);

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
    } catch {
      message.error("Logout failed. Please try again.");
    }
  }, [logoutMutation, logout, navigate]);

  // Counters
  const notificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length || 0,
    [notifications]
  );

  const cartItemCount = useMemo(() => cart?.cart?.items?.length || 0, [cart]);

  // User Dropdown Menu
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
          key="fullscreen"
          onClick={handleFullscreenToggle}
          icon={<FullscreenOutlined className="me-2" />}
        >
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        </Menu.Item>
        <Menu.Item
          key="darkmode"
          onClick={toggleDarkMode}
          icon={
            darkMode ? (
              <SunFilled className="me-2" />
            ) : (
              <MoonFilled className="me-2" />
            )
          }
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </Menu.Item>
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
      userId,
      navigate,
      handleLogout,
      isLoggingOut,
      hasAdminOrDevAccess,
      isFullscreen,
      darkMode,
      handleFullscreenToggle,
      toggleDarkMode,
    ]
  );

  return (
    <>
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
            {/* Use small logo on mobile when sidebar is closed (compact view) */}
            <Link to="/" className="logo logo-small">
              <img src={isSidebarOpen ? logo : logo_small} alt="Logo" />
            </Link>
          </div>

          {/* Mobile Sidebar Toggle */}
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

          {/* Main Navigation */}
          <ul className="nav user-menu" ref={searchRef}>
            {/* Mobile Search: Icon → Input → Overlay */}
            <li className="nav-item nav-searchinputs flex-grow-1 position-relative">
              {/* Mobile Search Trigger Icon (visible when input is closed) */}
              <Button
                type="link"
                className={`responsive-search d-md-none ${
                  mobileSearchOpen ? "d-none" : "d-block"
                }`}
                onClick={() => setMobileSearchOpen(true)}
              >
                <SearchOutlined style={{ fontSize: 22 }} />
              </Button>

              {/* Mobile Search Input (slides in when opened) */}
              <div
                className={`mobile-search-container d-md-none ${
                  mobileSearchOpen ? "open" : ""
                }`}
              >
                <Input
                  ref={mobileSearchInputRef}
                  prefix={<SearchOutlined className="search-icon" />}
                  suffix={
                    searchFetching ? (
                      <Spin size="small" />
                    ) : (
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setMobileSearchOpen(false);
                          setSearchQuery("");
                          setShowSearchOverlay(false);
                        }}
                        size="small"
                      />
                    )
                  }
                  placeholder="Search products, users, orders..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    localStorage.setItem("lastSearchQuery", value);
                  }}
                  onPressEnter={() => {
                    if (searchQuery.trim()) {
                      navigate(
                        `/search?q=${encodeURIComponent(searchQuery.trim())}`
                      );
                      setMobileSearchOpen(false);
                      setShowSearchOverlay(false);
                    }
                  }}
                  allowClear={{
                    onClick: () => {
                      setSearchQuery("");
                      localStorage.removeItem("lastSearchQuery");
                    },
                  }}
                  size="large"
                  className="mobile-global-search"
                />
              </div>

              {/* Desktop Search Input */}
              <div
                className="d-none d-md-block w-100"
                style={{ maxWidth: "700px" }}
              >
                <Input
                  prefix={<SearchOutlined className="search-icon" />}
                  suffix={searchFetching ? <Spin size="small" /> : null}
                  placeholder="Search products, users, orders..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    localStorage.setItem("lastSearchQuery", value);
                  }}
                  onFocus={() =>
                    searchQuery.trim() && setShowSearchOverlay(true)
                  }
                  onPressEnter={() => {
                    if (searchQuery.trim()) {
                      navigate(
                        `/search?q=${encodeURIComponent(searchQuery.trim())}`
                      );
                      setShowSearchOverlay(false);
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

              {/* Search Overlay (shared for both mobile & desktop) */}
              <SearchOverlay
                visible={showSearchOverlay}
                loading={searchLoading || searchFetching}
                results={searchResults}
                query={searchQuery}
                onClose={() => {
                  setShowSearchOverlay(false);
                  // On mobile, also close input if no query
                  if (window.innerWidth < 992 && !searchQuery.trim()) {
                    setMobileSearchOpen(false);
                  }
                }}
              />
            </li>

            {/* Fullscreen - Desktop only */}
            <li className="nav-item nav-item-box d-none d-md-flex">
              <Button
                type="link"
                onClick={handleFullscreenToggle}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <FullscreenOutlined />
              </Button>
            </li>

            {/* Notifications */}
            <li className="nav-item nav-item-box">
              <Button
                type="link"
                onClick={() => setShowNotifications(true)}
                className="position-relative"
              >
                <Badge
                  count={notificationCount}
                  size="small"
                  offset={[-5, 5]}
                  showZero={false}
                >
                  <BellOutlined style={{ fontSize: 18 }} />
                </Badge>
              </Button>
            </li>

            {/* Cart */}
            <PermissionsGate api="write" module="cart">
              <li className="nav-item nav-item-box">
                <Link to="/cart" className="position-relative">
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

            {/* Dark Mode - Desktop only */}
            <li className="nav-item nav-item-box d-none d-lg-flex">
              <Button
                type="link"
                onClick={toggleDarkMode}
                title={darkMode ? "Light Mode" : "Dark Mode"}
              >
                {darkMode ? <SunFilled /> : <MoonFilled />}
              </Button>
            </li>

            {/* User Avatar Dropdown */}
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
                          size={40}
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
        </div>
      </div>

      {/* Notifications Overlay */}
      <NotificationsOverlay
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Header;
