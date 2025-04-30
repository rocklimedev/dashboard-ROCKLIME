import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Common/Header";
import Router from "./router/Router";
import Sidebar from "./components/Common/SidebarNew";
import Footer from "./components/Common/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetProfileQuery } from "./api/userApi";
import Loader from "./components/Common/Loader";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = [
    "/login",
    "/signup",
    "/404",
    "/forgot-password",
    "/under-maintainance",
    "/coming-soon",
    "/no-access", // Add /no-access to allowed pages
  ].includes(location.pathname);
  const isPOSPage = location.pathname === "/pos";

  const token = localStorage.getItem("token");

  const { data: profileData, isLoading: isProfileLoading } =
    useGetProfileQuery();

  const userId = profileData?.user?.userId || null;
  const roleId = profileData?.user?.roleId || null;

  useEffect(() => {
    if (!token && !isAuthPage) {
      toast.warn("You are not authenticated. Please log in.");
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

    // If the role is USERS and user is trying to access non-no-access page
    if (roleNames.includes("USERS") && location.pathname !== "/no-access") {
      toast.warn("Access restricted. No valid role assigned.");
      navigate("/no-access");
      return;
    }

    // If the role is NOT USERS but user is stuck on /no-access
    if (!roleNames.includes("USERS") && location.pathname === "/no-access") {
      navigate("/");
    }
  }, [
    isProfileLoading,
    userId,
    profileData,
    isAuthPage,
    location.pathname,
    navigate,
  ]);

  return (
    <>
      <Loader loading={isProfileLoading} />
      <div className="main-wrapper">
        {!isAuthPage && <Header toggleSidebar={setSidebarOpen} />}
        {!isAuthPage && !isPOSPage && (
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={setSidebarOpen}
          />
        )}
        <Router />
        <Footer />
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </>
  );
}

export default App;
