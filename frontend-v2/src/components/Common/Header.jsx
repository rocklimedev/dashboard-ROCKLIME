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
  SearchOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import SearchOverlay from "./SearchOverlay";
import { message } from "antd";
import Avatar from "react-avatar";
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
    { skip: !searchQuery.trim() },
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
    setShowSearchOverlay(!!searchQuery.trim());
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

  // Handlers
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
    [notifications],
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
              @{user?.user?.username || "User"}
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
      user?.user?.username, // only what is actually used
      userId,
      navigate,
      handleLogout,
      isLoggingOut,
      // Remove hasAdminOrDevAccess — it's not used here
    ],
  );

  return (
    <>
      <header className="header bg-white shadow-sm">
        <div className="main-header d-flex align-items-center justify-content-between px-3 px-md-4 py-2">
          {/* Left: Hamburger (mobile) */}
          <div className="d-flex align-items-center">
            <a
              className="mobile_btn me-3 d-lg-none"
              onClick={() => toggleSidebar(!isSidebarOpen)}
              id="mobile_btn"
            >
              <span className="bar-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </a>
          </div>

          {/* Center: Search */}
          <div className="flex-grow-1 px-2 px-md-4" ref={searchRef}>
            <div className="position-relative w-100">
              {/* Mobile Search Trigger */}
              <div className="d-md-none text-center">
                <Button
                  type="link"
                  className={mobileSearchOpen ? "d-none" : "d-inline-block"}
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <SearchOutlined style={{ fontSize: 24 }} />
                </Button>
              </div>

              {/* Mobile Full-width Search */}
              <div
                className={`mobile-search-container d-md-none ${
                  mobileSearchOpen ? "open" : ""
                }`}
                style={{
                  position: mobileSearchOpen ? "fixed" : "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  background: "var(--background-color, white)",
                  padding: "12px 16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <Input
                  ref={mobileSearchInputRef}
                  prefix={<SearchOutlined />}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  size="large"
                />
              </div>

              {/* Desktop Search Bar */}
              <div className="d-none d-md-block">
                <Input
                  prefix={<SearchOutlined />}
                  suffix={searchFetching ? <Spin size="small" /> : null}
                  placeholder="Search products, users, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    searchQuery.trim() && setShowSearchOverlay(true)
                  }
                  allowClear
                  size="large"
                  className="global-search-input"
                />
              </div>

              {/* Search Results Overlay */}
              <SearchOverlay
                visible={showSearchOverlay}
                loading={searchLoading || searchFetching}
                results={searchResults}
                query={searchQuery}
                onClose={() => {
                  setShowSearchOverlay(false);
                  if (window.innerWidth < 992) setMobileSearchOpen(false);
                }}
              />
            </div>
          </div>

          {/* Right: Actions + User */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Desktop-only icons */}
            <div className="d-none d-md-flex align-items-center gap-3">
              <Button
                type="link"
                onClick={handleFullscreenToggle}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <FullscreenOutlined
                  style={{ fontSize: 18, color: "#333333" }}
                />
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
            </div>

            {/* Mobile More Menu */}
            <div className="d-md-none">
              <Dropdown
                overlay={
                  <Menu className="shadow-sm rounded">
                    <Menu.Item
                      key="fullscreen"
                      icon={<FullscreenOutlined />}
                      onClick={handleFullscreenToggle}
                    >
                      {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    </Menu.Item>

                    <Menu.Item
                      key="notifications"
                      icon={<BellOutlined />}
                      onClick={() => setShowNotifications(true)}
                    >
                      Notifications
                      {notificationCount > 0 && (
                        <Badge
                          count={notificationCount}
                          size="small"
                          className="ms-2"
                        />
                      )}
                    </Menu.Item>

                    <PermissionsGate api="write" module="cart">
                      <Menu.Item key="cart" icon={<ShoppingCartOutlined />}>
                        <Link
                          to="/cart"
                          className="d-flex justify-content-between align-items-center w-100 text-decoration-none"
                          style={{ color: "inherit" }}
                        >
                          <span>Cart</span>
                          {cartItemCount > 0 && (
                            <Badge count={cartItemCount} size="small" />
                          )}
                        </Link>
                      </Menu.Item>
                    </PermissionsGate>
                  </Menu>
                }
                trigger={["click"]}
                placement="bottomRight"
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

            {/* User Avatar */}
            {/* User Avatar */}
            {/* User Avatar */}
            <div className="ms-1 ms-md-2">
              {isProfileLoading ? (
                <span className="text-muted">Loading...</span>
              ) : profileError ? (
                <span className="text-danger">Error</span>
              ) : (
                <Dropdown
                  overlay={() => (
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
                            @{user?.user?.username || "User"}
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
                  )}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <a
                    href="#"
                    className="nav-link userset d-flex align-items-center"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Avatar
                      name={user?.user?.name || user?.user?.username || "User"}
                      src={
                        user?.user?.photo_thumbnail || user?.user?.profileImage
                      }
                      size={36}
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
      </header>

      <NotificationsOverlay
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Header;
