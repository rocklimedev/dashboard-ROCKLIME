import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Badge, Button, Dropdown, Input, Menu, message, Spin } from "antd";

import { useGetProfileQuery } from "../../api/userApi";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetNotificationsQuery } from "../../api/notificationApi";
import { useLogoutMutation } from "../../api/authApi";
import { useSearchAllQuery } from "../../api/searchApi";

import { useAuth } from "../../context/AuthContext";
import PermissionsGate from "../../context/PermissionGate";
import SearchOverlay from "./SearchOverlay";
import NotificationsOverlay from "../Notifications/NotificationsWrapper";

import Avatar from "react-avatar";

export default function Header({ toggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  // ── Data ────────────────────────────────────────────────
  const { data: user, isLoading: isProfileLoading } = useGetProfileQuery();
  const userId = user?.user?.userId;
  const username = user?.user?.username || "User";
  const avatarSrc = user?.user?.photo_thumbnail || user?.user?.profileImage;

  const { data: cart } = useGetCartQuery(userId, { skip: !userId });
  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !userId,
  });

  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  const cartCount = cart?.cart?.items?.length || 0;
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  // ── Search ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  const searchRef = useRef(null);
  const mobileInputRef = useRef(null);

  const {
    data: searchData,
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useSearchAllQuery(
    { query: searchQuery, limit: 8 },
    { skip: !searchQuery.trim() },
  );

  const searchResults = searchData?.results ?? null;

  // Auto-focus mobile input
  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Show overlay when there's a query
  useEffect(() => {
    setShowSearchOverlay(!!searchQuery.trim());
  }, [searchQuery]);

  // Click outside → close search
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

  // ── Fullscreen ──────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
      contextLogout();
      navigate("/login", { replace: true });
    } catch {
      message.error("Logout failed. Please try again.");
    }
  }, [logoutMutation, contextLogout, navigate]);

  // ── Menus ───────────────────────────────────────────────
  const userMenuItems = useMemo(
    () => [
      {
        key: "profile-header",
        disabled: true,
        label: (
          <div className="p-3">
            <h6 className="mb-0 fw-medium">@{username}</h6>
          </div>
        ),
      },
      { type: "divider" },
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Profile",
        onClick: () => navigate(`/u/${userId}`),
      },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Settings",
        onClick: () => navigate("/settings"),
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: isLoggingOut ? "Logging out..." : "Logout",
        disabled: isLoggingOut,
        onClick: handleLogout,
      },
    ],
    [username, userId, navigate, handleLogout, isLoggingOut],
  );

  const mobileMoreMenuItems = useMemo(
    () => [
      {
        key: "fullscreen",
        icon: <FullscreenOutlined />,
        label: isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
        onClick: toggleFullscreen,
      },
      {
        key: "notifications",
        icon: <BellOutlined />,
        label: (
          <>
            Notifications
            {unreadNotifications > 0 && (
              <Badge
                count={unreadNotifications}
                size="small"
                className="ms-2"
              />
            )}
          </>
        ),
        onClick: () => setShowNotifications(true),
      },
      {
        key: "cart",
        icon: <ShoppingCartOutlined />,
        label: (
          <Link
            to="/cart"
            className="d-flex justify-content-between align-items-center text-decoration-none"
            style={{ color: "inherit" }}
          >
            <span>Cart</span>
            {cartCount > 0 && <Badge count={cartCount} size="small" />}
          </Link>
        ),
      },
    ],
    [isFullscreen, unreadNotifications, cartCount, toggleFullscreen],
  );

  // ── Notifications Overlay ───────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="header bg-white shadow-sm sticky-top">
        <div className="main-header d-flex align-items-center justify-content-between px-3 px-md-4 py-2">
          {/* Left – Mobile Hamburger */}
          <div className="d-flex align-items-center">
            <button
              type="button"
              className="mobile_btn me-3 d-lg-none"
              onClick={() => toggleSidebar(!isSidebarOpen)}
            >
              <span className="bar-icon">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>

          {/* Center – Search */}
          <div className="flex-grow-1 px-2 px-md-4" ref={searchRef}>
            <div className="position-relative w-100">
              {/* Mobile search trigger */}
              <div className="d-md-none text-center">
                <Button
                  type="link"
                  className={mobileSearchOpen ? "d-none" : ""}
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <SearchOutlined style={{ fontSize: 24 }} />
                </Button>
              </div>

              {/* Mobile full-width search */}
              <div
                className={`mobile-search-container d-md-none ${mobileSearchOpen ? "open" : ""}`}
                style={{
                  position: mobileSearchOpen ? "fixed" : "absolute",
                  inset: mobileSearchOpen ? "0" : undefined,
                  zIndex: 1000,
                  background: "white",
                  padding: "12px 16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <Input
                  ref={mobileInputRef}
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

              {/* Desktop search */}
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

          {/* Right – Actions + User */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Desktop icons */}
            <div className="d-none d-md-flex align-items-center gap-3">
              <Button type="link" onClick={toggleFullscreen}>
                <FullscreenOutlined style={{ fontSize: 18, color: "#333" }} />
              </Button>

              <Button type="link" onClick={() => setShowNotifications(true)}>
                <Badge
                  count={unreadNotifications}
                  size="small"
                  offset={[-4, 4]}
                >
                  <BellOutlined style={{ fontSize: 18 }} />
                </Badge>
              </Button>

              <PermissionsGate api="write" module="cart">
                <Link to="/cart">
                  <Badge count={cartCount} size="small" offset={[-4, 4]}>
                    <ShoppingCartOutlined style={{ fontSize: 20 }} />
                  </Badge>
                </Link>
              </PermissionsGate>
            </div>

            {/* Mobile more menu */}
            <div className="d-md-none">
              <Dropdown
                menu={{ items: mobileMoreMenuItems }}
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

            {/* User avatar dropdown */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <a
                href="#"
                className="nav-link userset d-flex align-items-center"
                onClick={(e) => e.preventDefault()}
              >
                {isProfileLoading ? (
                  <Spin size="small" />
                ) : (
                  <Avatar
                    name={user?.user?.name || username}
                    src={avatarSrc}
                    size={36}
                    round
                    className="circular-avatar"
                    textSizeRatio={2.2}
                    maxInitials={2}
                  />
                )}
              </a>
            </Dropdown>
          </div>
        </div>
      </header>

      <NotificationsOverlay
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
