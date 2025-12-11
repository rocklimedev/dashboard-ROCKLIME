// src/App.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Common/Header";
import Router from "./router/Router";
import Footer from "./components/Common/Footer";
import { message } from "antd";
import { useGetProfileQuery } from "./api/userApi";
import Loader from "./components/Common/Loader";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import SidebarNew from "./components/Common/SidebarNew2";
import { useAuth } from "./context/AuthContext";

function App() {
  const { auth, setAuth, authChecked, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  console.log(auth);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [layoutMode] = useState("vertical");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const MAINTENANCE_MODE = false;

  const isMaintenancePage = location.pathname === "/under-maintenance";
  const isAuthPage = [
    "/login",
    "/signup",
    "/404",
    "/reset-password/:token",
    "/forgot-password",
    "/under-maintenance",
    "/coming-soon",
    "/no-access",
    "/verify-account",
  ].includes(location.pathname);

  // Toggle sidebar
  const toggleSidebar = (open) => setSidebarOpen(open);

  // Sidebar resize handler
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when clicking outside (tablet range)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isSidebarOpen &&
        window.innerWidth >= 768 &&
        window.innerWidth < 992 &&
        !e.target.closest("#sidebar") &&
        !e.target.closest("#toggle_btn")
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen]);

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
    if (
      authChecked &&
      auth?.token &&
      !isAuthPage &&
      (isUninitialized || !profileData)
    ) {
      refetchProfile();
    }
  }, [
    auth?.token,
    authChecked,
    isAuthPage,
    isUninitialized,
    profileData,
    refetchProfile,
  ]);

  // ────── AUTH CHECK (redirects) ──────
  useEffect(() => {
    if (!authChecked || isLoggingOut) return;

    if (
      !auth?.token &&
      (location.pathname === "/no-access" ||
        location.pathname === "/verify-account")
    ) {
      message.warning("You must be logged in to access this page.");
      navigate("/login", { replace: true });
    } else if (!auth?.token && !isAuthPage) {
      message.warning("You are not authenticated. Please log in.");
      navigate("/login", { replace: true });
    }
  }, [
    auth,
    isAuthPage,
    navigate,
    authChecked,
    location.pathname,
    isLoggingOut,
  ]);

  // ────── PROFILE ERROR (401 → logout) ──────
  // In App.jsx → profile error effect
  useEffect(() => {
    if (profileError) {
      const status = profileError?.status;
      if (status === 401 || status === 403) {
        message.error("Your session has expired. Please log in again.");
        logout(); // ← Remove optional chaining
        navigate("/login", { replace: true });
      } else {
        message.error("Failed to load profile.");
      }
    }
  }, [profileError, navigate, logout]);
  // ────── USER ROLES / EMAIL VERIFICATION ──────
  useEffect(() => {
    if (!profileData?.user || isAuthPage || !auth?.token) return;

    const user = profileData.user;
    let roles = user.roles || [];
    if (typeof roles === "string") {
      try {
        roles = JSON.parse(roles);
      } catch {
        roles = [];
      }
    }
    const accessRoles = roles.filter((r) => r !== "USERS");

    if (!user.isEmailVerified || accessRoles.length === 0) {
      if (location.pathname !== "/no-access") {
        message.warning(
          "Access restricted. Please verify your email or request access."
        );
        navigate("/no-access", { replace: true });
      }
    } else if (location.pathname === "/no-access") {
      navigate("/", { replace: true });
    }

    // Update auth context with user
    if (auth?.user !== user) {
      setAuth((prev) => ({ ...prev, user }));
    }
  }, [
    profileData,
    auth?.token,
    location.pathname,
    navigate,
    isAuthPage,
    setAuth,
  ]);

  // ────── MAINTENANCE MODE ──────
  useEffect(() => {
    if (MAINTENANCE_MODE && !isMaintenancePage) {
      navigate("/under-maintenance", { replace: true });
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
      <Loader loading={isProfileLoading} />
      <div className={`main-wrapper ${isSidebarOpen ? "slide-nav" : ""}`}>
        {!isAuthPage && (
          <Header
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => toggleSidebar(!isSidebarOpen)}
          />
        )}
        {!isAuthPage && (
          <SidebarNew
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => toggleSidebar(!isSidebarOpen)}
            layoutMode={layoutMode}
          />
        )}
        <Router />
        <Footer />

        {isSidebarOpen && (
          <div
            className="sidebar-overlay active"
            onClick={() => toggleSidebar(false)}
          />
        )}
      </div>
    </>
  );
}

export default App;
