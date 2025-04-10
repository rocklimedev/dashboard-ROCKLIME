import Header from "./components/Common/Header";
import Router from "./router/Router";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Common/SidebarNew";
import Footer from "./components/Common/Footer";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetProfileQuery } from "./api/userApi";
import Loader from "./components/Common/Loader"; // Import Loader

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
  ].includes(location.pathname);
  const isPOSPage = location.pathname === "/pos";

  const token = localStorage.getItem("token");
  console.log(token);
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
    if (!isProfileLoading && (!userId || !roleId) && !isAuthPage) {
      toast.error("Access denied. No role assigned.");
      navigate("/login");
    }
  }, [isProfileLoading, userId, roleId, isAuthPage, navigate]);

  return (
    <div className="pos-page">
      {/* ✅ Fullscreen Loader on top of everything */}
      <Loader loading={isProfileLoading} />

      <div className="main-wrapper">
        {!isAuthPage && <Header toggleSidebar={setSidebarOpen} />}
        {!isAuthPage && !isPOSPage && <Sidebar isSidebarOpen={isSidebarOpen} />}
        <Router />
        <Footer />
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}

export default App;
