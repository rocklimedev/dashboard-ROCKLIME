// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Common/Header';
import Router from './router/Router';
import RouteErrorBoundary from './router/RouteErrorBoundary';
import { Grid } from 'antd';
import { toast } from 'sonner';
import { useGetProfileQuery } from './api/userApi';
import Loader from './components/Common/Loader';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import AppSidebar from './components/Common/AppSidebar';
import { useAuth } from './context/AuthContext';
import PwaManager from './components/Common/PwaManager';
import { HOME_PATHS } from './apps/registry';
import './apps/shell.css';

function App() {
  const { auth, setAuth, authChecked, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { md = false, lg = false } = Grid.useBreakpoint();
  const [sidebarState, setSidebarState] = useState({ md, open: md });
  // Reset the manual toggle only when crossing the mobile breakpoint.
  // Adjusting state during render avoids an effect showing the previous layout first.
  if (sidebarState.md !== md) {
    setSidebarState({ md, open: md });
  }
  const isSidebarOpen = sidebarState.md === md ? sidebarState.open : md;
  const isTablet = md && !lg;
  const [layoutMode] = useState('vertical');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const MAINTENANCE_MODE = false;

  const isMaintenancePage = location.pathname === '/under-maintenance';
  // Pages that work without a login (paths with a token use a prefix match).
  const AUTH_PAGES = [
    '/login',
    '/signup',
    '/404',
    '/forgot-password',
    '/under-maintenance',
    '/coming-soon',
    '/no-access',
    '/verify-account',
    '/account-verify',
  ];
  const AUTH_PREFIXES = ['/reset-password/', '/verify-account/'];
  const isAuthPage =
    AUTH_PAGES.includes(location.pathname) ||
    AUTH_PREFIXES.some((p) => location.pathname.startsWith(p));
  // The apps home (first screen after login) has no app sidebar.
  const isHome = HOME_PATHS.includes(location.pathname);

  // Toggle sidebar
  const toggleSidebar = (open) => setSidebarState({ md, open });

  // Close sidebar when clicking outside (tablet range)
  useEffect(() => {
    if (!isSidebarOpen || !isTablet) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('#sidebar') && !e.target.closest('#toggle_btn')) {
        setSidebarState({ md, open: false });
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSidebarOpen, isTablet, md]);

  // ────── PROFILE FETCH ──────
  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
    isUninitialized, // ← now defined
    refetch: refetchProfile, // ← now defined
  } = useGetProfileQuery(undefined, {
    skip: !auth?.token || isAuthPage,
  });

  // Manually trigger profile fetch only if needed
  useEffect(() => {
    if (authChecked && auth?.token && !isAuthPage && (isUninitialized || !profileData)) {
      refetchProfile();
    }
  }, [auth?.token, authChecked, isAuthPage, isUninitialized, profileData, refetchProfile]);

  // ────── AUTH CHECK (redirects) ──────
  useEffect(() => {
    if (!authChecked || isLoggingOut) return;

    if (
      !auth?.token &&
      (location.pathname === '/no-access' || location.pathname === '/verify-account')
    ) {
      toast.warning('You must be logged in to access this page.');
      navigate('/login', { replace: true });
    } else if (!auth?.token && !isAuthPage) {
      toast.warning('You are not authenticated. Please log in.');
      navigate('/login', { replace: true });
    }
  }, [auth, isAuthPage, navigate, authChecked, location.pathname, isLoggingOut]);

  // ────── PROFILE ERROR (401 → logout) ──────
  // In App.jsx → profile error effect
  useEffect(() => {
    if (profileError) {
      const status = profileError?.status;
      if (status === 401 || status === 403) {
        toast.error('Your session has expired. Please log in again.');
        logout(); // ← Remove optional chaining
        navigate('/login', { replace: true });
      } else {
        toast.error('Failed to load profile.');
      }
    }
  }, [profileError, navigate, logout]);
  // ────── USER ROLES / EMAIL VERIFICATION ──────
  useEffect(() => {
    if (!profileData?.user || isAuthPage || !auth?.token) return;

    const user = profileData.user;
    let roles = user.roles || [];
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles);
      } catch {
        roles = [];
      }
    }
    const accessRoles = roles.filter((r) => r !== 'USERS');

    if (!user.isEmailVerified || accessRoles.length === 0) {
      if (location.pathname !== '/no-access') {
        toast.warning('Access restricted. Please verify your email or request access.');
        navigate('/no-access', { replace: true });
      }
    } else if (location.pathname === '/no-access') {
      navigate('/', { replace: true });
    }

    // Update auth context with user
    if (auth?.user !== user) {
      setAuth((prev) => ({ ...prev, user }));
    }
  }, [profileData, auth?.token, location.pathname, navigate, isAuthPage, setAuth]);

  // ────── MAINTENANCE MODE ──────
  useEffect(() => {
    if (MAINTENANCE_MODE && !isMaintenancePage) {
      navigate('/under-maintenance', { replace: true });
    }
  }, [MAINTENANCE_MODE, isMaintenancePage, navigate]);

  // ────── WRAP LOGOUT TO SET isLoggingOut FLAG ──────
  useEffect(() => {
    if (auth?.logout) {
      const original = auth.logout;
      auth.logout = async () => {
        setIsLoggingOut(true);
        try {
          await original();
        } finally {
          setIsLoggingOut(false);
        }
      };
    }
  }, [auth]);

  // ────── EARLY RETURN WHILE CHECKING AUTH ──────
  if ((MAINTENANCE_MODE && !isMaintenancePage) || !authChecked) return null;

  // ────── RENDER ──────
  return (
    <>
      <Loader loading={isProfileLoading} fullscreen />
      <PwaManager />
      <div
        className={`main-wrapper cm-shell ${isHome ? 'cm-shell--home' : ''} ${isSidebarOpen && !isHome ? 'slide-nav' : ''}`}
      >
        {!isAuthPage && (
          <Header
            home={isHome}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => toggleSidebar(!isSidebarOpen)}
          />
        )}
        {!isAuthPage && !isHome && (
          <AppSidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => toggleSidebar(!isSidebarOpen)}
            layoutMode={layoutMode}
          />
        )}
        <RouteErrorBoundary area="This area" hasSidebar={!isAuthPage && !isHome}>
          <Router hasSidebar={!isAuthPage && !isHome} />
        </RouteErrorBoundary>

        {isSidebarOpen && !isHome && (
          <div className="sidebar-overlay active" onClick={() => toggleSidebar(false)} />
        )}
      </div>
    </>
  );
}

export default App;
