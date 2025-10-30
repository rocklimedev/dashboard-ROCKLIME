import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Common/Header";
import Router from "./router/Router";
import Footer from "./components/Common/Footer";
import { toast, Toaster } from "sonner";
import { useGetProfileQuery } from "./api/userApi";
import Loader from "./components/Common/Loader";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import SidebarNew from "./components/Common/SidebarNew2";
import { useAuth } from "./context/AuthContext";

function App() {
  const { auth, setAuth, authChecked } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [layoutMode, setLayoutMode] = useState("vertical");
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New flag
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

  // Restore token from storage

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

  // Authentication check
  useEffect(() => {
    if (!authChecked || isLoggingOut) return; // Skip if logging out
    if (
      !auth?.token &&
      (location.pathname === "/no-access" ||
        location.pathname === "/verify-account")
    ) {
      toast.warning("You must be logged in to access this page.");
      navigate("/login", { replace: true });
    } else if (!auth?.token && !isAuthPage) {
      toast.warning("You are not authenticated. Please log in.");
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
  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
    isUninitialized,
  } = useGetProfileQuery(undefined, {
    skip: !auth?.token || isAuthPage, // Skip auto-fetch if no token or on auth page
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
  // Debug profile fetch
  useEffect(() => {
    if (profileError) {
      toast.error("Failed to fetch user profile.");
      if (!isLoggingOut) {
        navigate("/login", { replace: true });
      }
    }
  }, [profileData, profileError, navigate, isLoggingOut]);

  useEffect(() => {
    if (!profileData?.user || isAuthPage || !auth?.token) return;

    const user = profileData.user;
    let roles = user.roles || [];
    if (typeof roles === "string") {
      try {
        roles = JSON.parse(roles);
      } catch (e) {
        roles = [];
      }
    }
    const accessRoles = roles.filter((r) => r !== "USERS");

    if (!user.isEmailVerified || accessRoles.length === 0) {
      if (location.pathname !== "/no-access") {
        toast.warning(
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
  // Maintenance mode
  useEffect(() => {
    if (MAINTENANCE_MODE && !isMaintenancePage) {
      navigate("/under-maintenance", { replace: true });
    }
  }, [MAINTENANCE_MODE, isMaintenancePage, navigate]);

  // Expose setIsLoggingOut to AuthContext logout
  useEffect(() => {
    const originalLogout = auth?.logout;
    if (originalLogout) {
      auth.logout = async () => {
        setIsLoggingOut(true);
        try {
          await originalLogout();
        } finally {
          setIsLoggingOut(false);
        }
      };
    }
  }, [auth]);
  console.log(auth);
  if ((MAINTENANCE_MODE && !isMaintenancePage) || !authChecked) return null;

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
        <Toaster richColors position="top-right" />
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
