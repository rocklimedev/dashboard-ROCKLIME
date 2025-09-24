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
  const { auth, setAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  console.log(auth);
  const [authChecked, setAuthChecked] = useState(false);
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
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      setAuth({ token, user: null });
    }
    setAuthChecked(true);
  }, [setAuth]);

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

  // Fetch profile
  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery(undefined, {
    skip: !auth?.token || isAuthPage,
    refetchOnMountOrArgChange: true,
  });

  // Debug profile fetch
  useEffect(() => {
    if (profileError) {
      console.error("Profile fetch error:", profileError);
      toast.error("Failed to fetch user profile.");
      if (!isLoggingOut) {
        navigate("/login", { replace: true });
      }
    }
    if (profileData) {
      console.log("Profile data:", profileData);
    }
  }, [profileData, profileError, navigate, isLoggingOut]);

  // Access control based on profile
  useEffect(() => {
    if (isProfileLoading || isAuthPage || !auth?.token || isLoggingOut) return;

    if (!profileData?.user) {
      console.warn("No user profile found in profileData");
      toast.error("Access denied. No user profile found.");
      navigate("/login", { replace: true });
      return;
    }

    const user = profileData.user;
    let roles = user.roles || [];
    if (typeof roles === "string") {
      try {
        roles = JSON.parse(roles);
      } catch (e) {
        console.error("Failed to parse roles:", e);
        roles = [];
      }
    }
    const accessRoles = roles.filter((r) => r !== "USERS");

    if (!user.isEmailVerified || accessRoles.length === 0) {
      if (location.pathname !== "/no-access") {
        console.log(
          "Redirecting to /no-access: isEmailVerified=",
          user.isEmailVerified,
          "accessRoles=",
          accessRoles
        );
        toast.warning(
          "Access restricted. Please verify your email or request access."
        );
        navigate("/no-access", { replace: true });
      }
    } else if (location.pathname === "/no-access") {
      console.log("Redirecting to / from /no-access");
      navigate("/", { replace: true });
    }

    if (auth?.user !== user) {
      setAuth((prev) => ({ ...prev, user }));
    }
  }, [
    isProfileLoading,
    profileData,
    location.pathname,
    navigate,
    isAuthPage,
    auth,
    setAuth,
    isLoggingOut,
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
