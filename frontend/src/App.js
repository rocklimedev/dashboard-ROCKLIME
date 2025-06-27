import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Common/Header";
import Router from "./router/Router";
import Footer from "./components/Common/Footer";
import { toast, Toaster } from "sonner"; // ✅ New toast import
import { useGetProfileQuery } from "./api/userApi";
import Loader from "./components/Common/Loader";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import SidebarNew from "./components/Common/SidebarNew2";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState("vertical");

  const isAuthPage = [
    "/login",
    "/signup",
    "/404",
    "/reset-password",
    "/forgot-password",
    "/under-maintainance",
    "/coming-soon",
    "/no-access",
  ].includes(location.pathname);
  const isPOSPage = ["/pos", "/pos-new"].includes(location.pathname);

  const token = localStorage.getItem("token");
  const { data: profileData, isLoading: isProfileLoading } =
    useGetProfileQuery();
  const userId = profileData?.user?.userId || null;
  useEffect(() => {
    if (!token && !isAuthPage) {
      toast.warning("You are not authenticated. Please log in.");
      navigate("/login");
    }
  }, [token, isAuthPage, navigate]);

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

  const toggleSidebar = (value) => {
    setSidebarOpen(value);
  };

  return (
    <>
      <Loader loading={isProfileLoading} />
      <div className="main-wrapper">
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
        <Router />
        <Footer />
        <Toaster richColors position="top-right" /> {/* ✅ New Toaster */}
      </div>
    </>
  );
}

export default App;
