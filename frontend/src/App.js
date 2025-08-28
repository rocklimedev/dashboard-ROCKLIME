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

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [layoutMode, setLayoutMode] = useState("vertical");
  const MAINTENANCE_MODE = false;
  const isMaintenancePage = location.pathname === "/under-maintenance";

  const isAuthPage = [
    "/login",
    "/signup",
    "/404",
    "/reset-password",
    "/forgot-password",
    "/under-maintenance",
    "/coming-soon",
    "/no-access",
    "/verify-account",
  ].includes(location.pathname);
  const isPOSPage = ["/pos", "/pos-new"].includes(location.pathname);

  const token = localStorage.getItem("token");

  const { data: profileData, isLoading: isProfileLoading } =
    useGetProfileQuery();
  const userId = profileData?.user?.userId || null;

  // Initialize and update sidebar state based on viewport
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!token && !isAuthPage) {
      toast.warning("You are not authenticated. Please log in.");
      navigate("/login");
    }
  }, [token, isAuthPage, navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isSidebarOpen &&
        window.innerWidth < 992 && // only mobile + tablet
        !e.target.closest("#sidebar") && // clicked outside sidebar
        !e.target.closest("#toggle_btn") // not on toggle button
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (isProfileLoading || isAuthPage) return;

    const roleNames = profileData?.user?.roles || [];

    if (!userId) {
      toast.error("Access denied. No user profile found.");
      navigate("/login");
      return;
    }

    if (roleNames.includes("USERS") && location.pathname !== "/no-access") {
      toast.warning("Access restricted. No valid role assigned.");
      navigate("/no-access");
      return;
    }

    if (!roleNames.includes("USERS") && location.pathname === "/no-access") {
      navigate("/");
    }

    if (location.pathname === "/layout-horizontal") {
      setLayoutMode("horizontal");
      setSidebarOpen(false);
    } else if (location.pathname === "/layout-two-column") {
      setLayoutMode("two-column");
    } else {
      setLayoutMode("vertical");
    }

    if (isAuthPage || isPOSPage) {
      setSidebarOpen(false);
    }
  }, [
    isProfileLoading,
    userId,
    profileData,
    isAuthPage,
    isPOSPage,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (MAINTENANCE_MODE && !isMaintenancePage) {
      navigate("/under-maintenance", { replace: true });
    }
  }, [MAINTENANCE_MODE, isMaintenancePage, navigate]);

  if (MAINTENANCE_MODE && !isMaintenancePage) return null;

  const toggleSidebar = (value) => {
    if (window.innerWidth < 768) {
      setSidebarOpen(value);
    }
  };

  return (
    <>
      <Loader loading={isProfileLoading} />
      <div className={`main-wrapper ${isSidebarOpen ? "slide-nav" : ""}`}>
        {!isAuthPage && (
          <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        )}
        {!isAuthPage && !isPOSPage && (
          <SidebarNew
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            layoutMode={layoutMode}
          />
        )}
        {!isAuthPage &&
          !isPOSPage &&
          isSidebarOpen &&
          window.innerWidth < 992 && ( // allow mobile + tablet
            <div
              className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

        <Router />
        <Footer />
        <Toaster richColors position="top-right" />
      </div>
    </>
  );
}

export default App;
