import Loader from './Loader';
import './Header.styles.css';
// src/components/Layout/Header.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetProfileQuery } from '../../api/userApi';
import { useGetCartQuery } from '../../api/cartApi';
import { useGetNotificationsQuery } from '../../api/notificationApi';
import { Dropdown, Button, Menu, Badge, Input } from 'antd';
import { toast } from 'sonner';
import {
  BellOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  SearchOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import SearchOverlay from './SearchOverlay';
import Avatar from 'react-avatar';
import { useLogoutMutation } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import PermissionsGate from '../../context/PermissionGate';
import { useSearchAllQuery } from '../../api/searchApi';
import NotificationsOverlay from '../Notifications/NotificationsWrapper';
import AppSwitcher from './AppSwitcher';
import CliqDrawer from '../Chat/CliqDrawer';
import logoImg from '../../assets/img/logo.png';
import { debounce } from 'lodash';

const Header = ({ toggleSidebar, isSidebarOpen, home = false }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // === Queries ===
  const { data: user, isLoading: isProfileLoading, error: profileError } = useGetProfileQuery();
  const userId = user?.user?.userId;

  const { data: cart } = useGetCartQuery(userId, { skip: !userId });
  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !userId,
  });

  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  // === States ===
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const searchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const desktopSearchInputRef = useRef(null);

  // Cmd+K / Ctrl+K (or "/" when not typing) jumps to the search box from anywhere
  useEffect(() => {
    const onKey = (e) => {
      const typing =
        /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
        e.preventDefault();
        desktopSearchInputRef.current?.focus();
        desktopSearchInputRef.current?.select?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Search API
  const { data: searchResponse, isFetching: searchFetching } = useSearchAllQuery(
    { query: debouncedQuery, limit: 8 },
    { skip: !debouncedQuery.trim() },
  );

  // Debounce search input
  const debouncedSetQuery = useCallback(
    debounce((value) => {
      setDebouncedQuery(value.trim());
    }, 300),
    [],
  );

  // Auto-focus mobile search
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Show overlay when there's a debounced query
  useEffect(() => {
    setShowSearchOverlay(!!debouncedQuery.trim());
  }, [debouncedQuery]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchOverlay(false);
        setMobileSearchOpen(false);
        setSearchQuery('');
        setDebouncedQuery('');
      }
    };

    if (mobileSearchOpen || showSearchOverlay) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileSearchOpen, showSearchOverlay]);

  // === NEW: Handle Enter Key Press ===
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = searchQuery.trim();

      // Close overlays
      setShowSearchOverlay(false);
      setMobileSearchOpen(false);

      // Navigate to search page with query
      navigate(`/search?q=${encodeURIComponent(query)}`);

      // Optional: Clear the search input after navigation
      // setSearchQuery("");
      // setDebouncedQuery("");
    }
  };

  // Search input change handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetQuery(value);
  };

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
      logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  }, [logoutMutation, logout, navigate]);

  // Counters
  const notificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length || 0,
    [notifications],
  );

  const cartItemCount = useMemo(() => cart?.cart?.items?.length || 0, [cart]);
  const avatarSrc = user?.user?.photo_thumbnail || user?.user?.profileImage || undefined;
  // User Dropdown Menu
  const userMenu = useMemo(
    () => (
      <Menu className="shadow-sm rounded menu-drop-user fv2-header-a69c3f8efe">
        <Menu.Item
          key="profile-header"
          className="d-flex align-items-center p-3 profileset"
          disabled
        >
          <div>
            <h6 className="fw-medium mb-0">@{user?.user?.username || 'User'}</h6>
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
          onClick={() => navigate(`/u/${userId}/settings`)}
          icon={<SettingOutlined className="me-2" />}
        >
          Account settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          key="logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
          icon={<LogoutOutlined className="me-2" />}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Menu.Item>
      </Menu>
    ),
    [user?.user?.username, userId, navigate, handleLogout, isLoggingOut],
  );

  return (
    <>
      <header className="header bg-white shadow-sm">
        <div className="main-header d-flex align-items-center justify-content-between px-3 px-md-4 py-2">
          {/* Left: logo on the apps home, menu button inside an app */}
          <div className="d-flex align-items-center">
            {home && (
              <Link to="/" className="cm-header-logo">
                <img src={logoImg} alt="Chhabra Marble" />
              </Link>
            )}
            <a
              style={home ? { display: 'none' } : undefined}
              className="mobile_btn me-3 d-lg-none"
              onClick={() => toggleSidebar(!isSidebarOpen)}
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
                  className={mobileSearchOpen ? 'd-none' : 'd-inline-block'}
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <SearchOutlined className="fv2-header-6c9de3ae60" />
                </Button>
              </div>

              {/* Mobile Full-width Search */}
              <div
                className={
                  `mobile-search-container d-md-none ${mobileSearchOpen ? 'open' : ''}` +
                  ' fv2-header-3bde8b0bc9'
                }
                style={{ position: mobileSearchOpen ? 'fixed' : 'absolute' }}
              >
                <Input
                  ref={mobileSearchInputRef}
                  prefix={<SearchOutlined />}
                  suffix={searchFetching ? <Loader size="small" /> : null}
                  placeholder="Search products, users, orders..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchSubmit} // ← Enter key handler
                  allowClear
                  size="large"
                />
              </div>

              {/* Desktop Search Bar */}
              <div className="d-none d-md-block">
                <Input
                  ref={desktopSearchInputRef}
                  prefix={<SearchOutlined />}
                  suffix={
                    searchFetching ? (
                      <Loader size="small" />
                    ) : (
                      <span className="fv2-header-8bb5f62121">
                        {/Mac/.test(navigator.platform) ? '⌘K' : 'Ctrl K'}
                      </span>
                    )
                  }
                  placeholder="Search customers, quotations, orders, products…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchSubmit} // ← Enter key handler
                  onFocus={() => debouncedQuery.trim() && setShowSearchOverlay(true)}
                  allowClear
                  size="large"
                  className="global-search-input"
                />
              </div>

              {/* Search Overlay (Live suggestions) */}
              <SearchOverlay
                visible={showSearchOverlay}
                loading={searchFetching}
                results={searchResponse?.data || {}}
                query={debouncedQuery}
                onClose={() => setShowSearchOverlay(false)}
              />
            </div>
          </div>

          {/* Right: Actions + User */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <Button
              type="text"
              aria-label="Open Cliq chat"
              title="Cliq chat"
              icon={<CommentOutlined className="fv2-header-b5b215d54b" />}
              onClick={() => setChatOpen(true)}
            />
            {/* Desktop Icons */}
            <div className="d-none d-md-flex align-items-center gap-3">
              <AppSwitcher />

              <Button type="link" onClick={() => setShowNotifications(true)}>
                <Badge count={notificationCount} size="small" offset={[-4, 4]}>
                  <BellOutlined className="fv2-header-2024ce2514" />
                </Badge>
              </Button>

              <PermissionsGate api="write" module="cart">
                <Link to="/cart/quotation">
                  <Badge count={cartItemCount} size="small" offset={[-4, 4]}>
                    <ShoppingCartOutlined className="fv2-header-d18c372548" />
                  </Badge>
                </Link>
              </PermissionsGate>
            </div>

            {/* Mobile More Menu */}
            <div className="d-md-none">
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item key="apps" icon={<AppstoreOutlined />}>
                      <Link to="/">All apps</Link>
                    </Menu.Item>
                    <Menu.Item
                      key="notifications"
                      onClick={() => setShowNotifications(true)}
                      icon={<BellOutlined />}
                    >
                      Notifications {notificationCount > 0 && <Badge count={notificationCount} />}
                    </Menu.Item>
                    <PermissionsGate api="write" module="cart">
                      <Menu.Item key="cart" icon={<ShoppingCartOutlined />}>
                        <Link to="/cart/quotation" className="d-flex justify-content-between w-100">
                          Cart {cartItemCount > 0 && <Badge count={cartItemCount} />}
                        </Link>
                      </Menu.Item>
                    </PermissionsGate>
                  </Menu>
                }
                trigger={['click']}
              >
                <Button type="link" size="large">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </Button>
              </Dropdown>
            </div>

            {/* User Avatar */}
            <div className="ms-1 ms-md-2">
              {isProfileLoading ? (
                <span className="text-muted">Loading...</span>
              ) : profileError ? (
                <span className="text-danger">Error</span>
              ) : (
                <Dropdown overlay={userMenu} trigger={['click']}>
                  <a
                    href="#"
                    className="nav-link userset d-flex align-items-center justify-content-center fv2-header-93cbf68ba8"
                    onClick={(e) => e.preventDefault()}
                  >
                    {avatarSrc ? (
                      <Avatar
                        name={user?.user?.name || user?.user?.username || 'User'}
                        src={avatarSrc || undefined}
                        size={36}
                        round
                      />
                    ) : (
                      <div className="fv2-header-d9db2f99af">
                        <UserOutlined className="fv2-header-2024ce2514" />
                      </div>
                    )}
                  </a>
                </Dropdown>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Overlay */}
      <CliqDrawer
        key={userId || 'anonymous'}
        userId={userId}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
      <NotificationsOverlay
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Header;
