import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
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

  // Auto-focus mobile search
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Show overlay when typing
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowSearchOverlay(true);
    } else {
      setShowSearchOverlay(false);
    }
  }, [searchQuery]);

  // Click outside to close search
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

  // Dark Mode persistence
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

  // Clean user dropdown (no fullscreen/dark mode here)
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
    ]
  );

  return (
    <>
      <div className="header">
        <div className="main-header d-flex align-items-center justify-content-between">
          {/* Left: Mobile Hamburger */}
          <div className="d-flex align-items-center">
            <a
              className="mobile_btn me-3"
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
          </div>

          {/* Center: Search - Takes available space */}
          <div className="flex-grow-1 mx-md-4" ref={searchRef}>
            <ul className="nav user-menu h-100">
              <li className="nav-item nav-searchinputs w-100 position-relative">
                {/* Mobile Search Trigger - Centered */}
                <div className="d-md-none d-flex justify-content-center">
                  <Button
                    type="link"
                    className={`responsive-search ${
                      mobileSearchOpen ? "d-none" : "d-block"
                    }`}
                    onClick={() => setMobileSearchOpen(true)}
                  >
                    <SearchOutlined style={{ fontSize: 24 }} />
                  </Button>
                </div>

                {/* Mobile Full Search Input */}
                <div
                  className={`mobile-search-container d-md-none ${
                    mobileSearchOpen ? "open position-fixed" : ""
                  }`}
                  style={{
                    top: mobileSearchOpen ? "0" : "",
                    left: mobileSearchOpen ? "0" : "",
                    right: mobileSearchOpen ? "0" : "",
                    zIndex: 1000,
                    background: "var(--background-color, #fff)",
                    padding: "12px 16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
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
                    allowClear
                    size="large"
                    className="mobile-global-search"
                  />
                </div>

                {/* Desktop Search - Centered */}
                <div
                  className="d-none d-md-block mx-auto"
                  style={{ maxWidth: "680px" }}
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
                    allowClear
                    size="large"
                    className="global-search-input"
                  />
                </div>

                {/* Search Overlay */}
                <SearchOverlay
                  visible={showSearchOverlay}
                  loading={searchLoading || searchFetching}
                  results={searchResults}
                  query={searchQuery}
                  onClose={() => {
                    setShowSearchOverlay(false);
                    if (window.innerWidth < 992 && !searchQuery.trim()) {
                      setMobileSearchOpen(false);
                    }
                  }}
                />
              </li>
            </ul>
          </div>

          {/* Right: Action Icons */}
          <div className="d-flex align-items-center">
            {/* Desktop Icons */}
            <div className="d-none d-md-flex align-items-center gap-2">
              <Button
                type="link"
                onClick={handleFullscreenToggle}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <FullscreenOutlined style={{ fontSize: 18 }} />
              </Button>

              <Button type="link" onClick={() => setShowNotifications(true)}>
                <Badge count={notificationCount} size="small" offset={[-4, 4]}>
                  <BellOutlined style={{ fontSize: 18 }} />
                </Badge>
              </Button>

              <PermissionsGate api="write" module="cart">
                <Link to="/cart">
                  <Badge count={cartItemCount} size="small" offset={[-4, 4]}>
                    <ShoppingCartOutlined style={{ fontSize: 20 }} />
                  </Badge>
                </Link>
              </PermissionsGate>

              {/* <Button
                type="link"
                onClick={toggleDarkMode}
                title={darkMode ? "Light Mode" : "Dark Mode"}
              >
                {darkMode ? (
                  <SunFilled style={{ fontSize: 18 }} />
                ) : (
                  <MoonFilled style={{ fontSize: 18 }} />
                )}
              </Button> */}
            </div>

            {/* Mobile: More Menu */}
            <div className="d-md-none mx-2">
              <Dropdown
                overlay={
                  <Menu className="shadow-sm rounded">
                    <Menu.Item
                      key="fullscreen"
                      onClick={handleFullscreenToggle}
                      icon={<FullscreenOutlined />}
                    >
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </Menu.Item>
                    <Menu.Item
                      key="notifications"
                      onClick={() => setShowNotifications(true)}
                      icon={<BellOutlined />}
                    >
                      Notifications{" "}
                      {notificationCount > 0 && (
                        <Badge
                          count={notificationCount}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </Menu.Item>
                    <PermissionsGate api="write" module="cart">
                      <Menu.Item key="cart" icon={<ShoppingCartOutlined />}>
                        <Link
                          to="/cart"
                          className="d-flex justify-content-between align-items-center w-100"
                        >
                          Cart{" "}
                          {cartItemCount > 0 && <Badge count={cartItemCount} />}
                        </Link>
                      </Menu.Item>
                    </PermissionsGate>
                    {/* <Menu.Item
                      key="theme"
                      onClick={toggleDarkMode}
                      icon={darkMode ? <SunFilled /> : <MoonFilled />}
                    >
                      {darkMode ? "Light Mode" : "Dark Mode"}
                    </Menu.Item> */}
                  </Menu>
                }
                trigger={["click"]}
              >
                <Button type="link" size="large">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </Button>
              </Dropdown>
            </div>

            {/* User Avatar - Always visible */}
            <div className="ms-2">
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
                    <Avatar
                      name={user?.user?.name || "User"}
                      src={
                        user?.user?.photo_thumbnail || user?.user?.profileImage
                      }
                      size={40}
                      round={true}
                      className="circular-avatar"
                      textSizeRatio={2.2}
                      maxInitials={2}
                    />
                  </a>
                </Dropdown>
              )}
            </div>
          </div>
        </div>
      </div>

      <NotificationsOverlay
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Header;
